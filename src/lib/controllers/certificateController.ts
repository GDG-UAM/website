import db from "@/lib/db";
import Certificate, {
  IRecipient,
  ICertificate,
  ICertificateBase,
  CertificateType,
  ISignature,
  ICourseCompletionMetadata,
  IEventAchievementMetadata,
  IParticipationMetadata,
  IVolunteerMetadata
} from "@/lib/models/Certificate";
import type { FilterQuery, SortOrder } from "mongoose";
import crypto from "node:crypto";

// Input types for creating/updating certificates (use strings for API input)
export type CertificateInputRecipient = IRecipient;

export type CertificateInputPeriod = {
  startDate: Date;
  endDate?: Date;
};

export type CertificateInput = {
  recipient: CertificateInputRecipient;
  designId: string;
  signatures?: ISignature[];
  period?: CertificateInputPeriod;
  title: string;
  description?: string;
  type: CertificateType;
  metadata?:
    | ICourseCompletionMetadata
    | IEventAchievementMetadata
    | IParticipationMetadata
    | IVolunteerMetadata;
};

export type CertificateUpdateInput = Partial<Omit<CertificateInput, "type" | "publicId">> & {
  revoke?: {
    isRevoked: boolean;
    reason?: string;
  };
};

export type SortTypes = "newest" | "oldest";

/**
 * Generate a unique public ID for a certificate
 */
function generatePublicId(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Create a new certificate in the database.
 */
export async function createCertificate(input: CertificateInput): Promise<ICertificate> {
  await db.connect();

  const publicId = generatePublicId();

  const certificate = await Certificate.create({
    publicId,
    recipient: input.recipient,
    designId: input.designId,
    signatures: input.signatures || [],
    period: input.period,
    title: input.title,
    description: input.description,
    type: input.type,
    metadata: input.metadata,
    revoked: { isRevoked: false }
  });

  return certificate as ICertificate;
}

/**
 * Update an existing certificate by its _ID.
 */
export async function updateCertificate(
  id: string,
  input: CertificateUpdateInput
): Promise<ICertificate | null> {
  await db.connect();

  const certificate = await Certificate.findById(id);
  if (!certificate) return null;

  // Update basic fields
  if (input.recipient !== undefined) certificate.recipient = input.recipient;
  if (input.designId !== undefined) certificate.designId = input.designId;
  if (input.signatures !== undefined) certificate.signatures = input.signatures;
  if (input.period !== undefined) certificate.period = input.period;
  if (input.title !== undefined) certificate.title = input.title;
  if (input.description !== undefined) certificate.description = input.description;
  if (input.metadata !== undefined) certificate.metadata = input.metadata;

  // Handle revocation
  if (input.revoke !== undefined) {
    certificate.revoked = {
      isRevoked: input.revoke.isRevoked,
      reason: input.revoke.reason,
      revokedAt: certificate.revoked?.revokedAt // Will be set by pre-save hook if needed
    };
  }

  await certificate.save();
  return certificate as ICertificate;
}

/**
 * Remove a certificate by its _ID.
 */
export async function deleteCertificate(id: string): Promise<boolean> {
  await db.connect();
  const res = await Certificate.findByIdAndDelete(id);
  return !!res;
}

/**
 * Get a certificate by its _ID.
 */
export async function getCertificateById(id: string): Promise<ICertificate | null> {
  await db.connect();
  const certificate = await Certificate.findById(id).lean();
  return certificate as ICertificate | null;
}

/**
 * Get a certificate by its public ID.
 */
export async function getCertificateByPublicId(publicId: string): Promise<ICertificate | null> {
  await db.connect();
  const certificate = await Certificate.findOne({ publicId }).lean();
  return certificate as ICertificate | null;
}

/**
 * Get certificates by recipient user ID.
 */
export async function getCertificatesByUserId(userId: string): Promise<ICertificate[]> {
  await db.connect();
  const certificates = await Certificate.find({ "recipient.userId": userId })
    .sort({ createdAt: -1 })
    .lean();
  return certificates as unknown as ICertificate[];
}

/**
 * Revoke a certificate by its _ID.
 */
export async function revokeCertificate(id: string, reason?: string): Promise<ICertificate | null> {
  await db.connect();

  const certificate = await Certificate.findById(id);
  if (!certificate) return null;

  certificate.revoked = {
    isRevoked: true,
    reason,
    revokedAt: undefined // Will be set by pre-save hook
  };

  await certificate.save();
  return certificate as ICertificate;
}

/**
 * Reinstate a revoked certificate by its _ID.
 */
export async function reinstateCertificate(id: string): Promise<ICertificate | null> {
  await db.connect();

  const certificate = await Certificate.findByIdAndUpdate(
    id,
    {
      $set: {
        "revoked.isRevoked": false,
        "revoked.reason": undefined,
        "revoked.revokedAt": undefined
      }
    },
    { new: true }
  ).lean();

  return certificate as ICertificate | null;
}

/**
 * List certificates with filters, pagination, and sorting.
 */
export async function listCertificates(params?: {
  type?: CertificateType;
  recipientUserId?: string;
  includeRevoked?: boolean;
  page?: number;
  pageSize?: number;
  sort?: SortTypes;
  search?: string;
}): Promise<{
  items: ICertificate[];
  total: number;
  page: number;
  pageSize: number;
}> {
  await db.connect();

  const {
    type,
    recipientUserId,
    includeRevoked = false,
    page = 1,
    pageSize = 10,
    sort = "newest",
    search
  } = params || {};

  const filter: FilterQuery<ICertificateBase> = {};

  // Filter by type
  if (type) {
    filter.type = type;
  }

  // Filter by recipient user ID
  if (recipientUserId) {
    filter["recipient.userId"] = recipientUserId;
  }

  // Exclude revoked certificates unless explicitly requested
  if (!includeRevoked) {
    filter["revoked.isRevoked"] = { $ne: true };
  }

  // Search by title or recipient name
  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), "i");
    filter.$or = [{ title: searchRegex }, { "recipient.name": searchRegex }];
  }

  const sortMap: Record<SortTypes, Record<string, SortOrder>> = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 }
  };

  const total = await Certificate.countDocuments(filter);
  const items = await Certificate.find(filter)
    .sort(sortMap[sort])
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();

  return { items: items as unknown as ICertificate[], total, page, pageSize };
}

/**
 * Verify a certificate by its public ID (for public verification endpoint).
 * Returns null if certificate doesn't exist or is revoked.
 */
export async function verifyCertificate(
  publicId: string
): Promise<{ valid: boolean; certificate: ICertificate | null; revokedReason?: string }> {
  await db.connect();

  const certificate = (await Certificate.findOne({ publicId }).lean()) as ICertificate | null;

  if (!certificate) {
    return { valid: false, certificate: null };
  }

  if (certificate.revoked?.isRevoked) {
    return {
      valid: false,
      certificate,
      revokedReason: certificate.revoked.reason
    };
  }

  return { valid: true, certificate };
}
