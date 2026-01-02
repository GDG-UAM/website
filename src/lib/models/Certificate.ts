import mongoose from "mongoose";
const { Schema, model, models } = mongoose;
import type { Document, Model, Types } from "mongoose";

// Certificate types
export type CertificateType =
  | "COURSE_COMPLETION"
  | "EVENT_ACHIEVEMENT"
  | "PARTICIPATION"
  | "VOLUNTEER";
export type ParticipationRole = "ATTENDEE" | "PARTICIPANT" | "SPEAKER" | "ORGANIZER";

// Sub-document interfaces
export interface IRecipient {
  userId?: Types.ObjectId | string;
  name: string;
}

export interface ISignature {
  name?: string;
  role?: string;
  imageUrl?: string;
}

export interface IPeriod {
  startDate: Date;
  endDate?: Date;
}

export interface IRevoked {
  isRevoked: boolean;
  reason?: string;
  revokedAt?: Date;
}

// Metadata interfaces for each certificate type
export interface ICourseCompletionMetadata {
  instructors?: Array<{
    ref?: Types.ObjectId;
    name?: string;
  }>;
  grade?: string;
  hours?: number;
}

export interface IEventAchievementMetadata {
  rank: string;
  group?: string;
}

export interface IParticipationMetadata {
  role: ParticipationRole;
}

export interface IVolunteerMetadata {
  hours: number;
}

// Base certificate interface
export interface ICertificateBase extends Document {
  _id: Types.ObjectId;
  publicId: string;
  recipient: IRecipient;
  designId: string;
  signatures?: ISignature[];
  period?: IPeriod;
  title: string;
  description?: string;
  type: CertificateType;
  revoked?: IRevoked;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

// Discriminated certificate interfaces
export interface ICourseCompletionCertificate extends ICertificateBase {
  type: "COURSE_COMPLETION";
  metadata?: ICourseCompletionMetadata;
}

export interface IEventAchievementCertificate extends ICertificateBase {
  type: "EVENT_ACHIEVEMENT";
  metadata: IEventAchievementMetadata;
}

export interface IParticipationCertificate extends ICertificateBase {
  type: "PARTICIPATION";
  metadata: IParticipationMetadata;
}

export interface IVolunteerCertificate extends ICertificateBase {
  type: "VOLUNTEER";
  metadata: IVolunteerMetadata;
}

// Union type for all certificate types
export type ICertificate =
  | ICourseCompletionCertificate
  | IEventAchievementCertificate
  | IParticipationCertificate
  | IVolunteerCertificate;

const RecipientSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true }
  },
  { _id: false }
);

const SignatureSchema = new Schema(
  {
    name: String,
    role: String,
    imageUrl: String
  },
  { _id: false }
);

const PeriodSchema = new Schema(
  {
    startDate: { type: Date, required: true },
    endDate: { type: Date }
  },
  { _id: false }
);

const RevokedSchema = new Schema(
  {
    isRevoked: { type: Boolean, default: false },
    reason: String,
    revokedAt: Date
  },
  { _id: false }
);

const CertificateBaseSchema = new Schema(
  {
    // Identity
    publicId: { type: String, required: true, unique: true, index: true },
    recipient: { type: RecipientSchema, required: true },

    // Visuals
    designId: { type: String, required: true },
    signatures: [SignatureSchema],

    // Common Data
    period: PeriodSchema,
    title: { type: String, required: true },
    description: String,

    // Type discriminator key
    type: {
      type: String,
      enum: ["COURSE_COMPLETION", "EVENT_ACHIEVEMENT", "PARTICIPATION", "VOLUNTEER"],
      required: true
    },

    // Revocation
    revoked: RevokedSchema,

    // Certificate system version
    version: { type: Number, default: 1 }
  },
  {
    timestamps: true,
    discriminatorKey: "type"
  }
);

// Pre-save hook to automatically set revokedAt when isRevoked switches to true
CertificateBaseSchema.pre("save", function () {
  if (this.isModified("revoked.isRevoked") && this.revoked?.isRevoked && !this.revoked.revokedAt) {
    this.revoked.revokedAt = new Date();
  }
});

// Check if model already exists to prevent discriminator re-registration
let Certificate: Model<ICertificate>;

if (models.Certificate) {
  Certificate = models.Certificate as Model<ICertificate>;
} else {
  Certificate = model<ICertificate>("Certificate", CertificateBaseSchema);

  const CourseCertificateSchema = new Schema(
    {
      // Will have one of the options
      instructors: [
        {
          ref: { type: Schema.Types.ObjectId, ref: "User" },
          name: String
        }
      ],
      grade: String,
      hours: Number
    },
    { _id: false }
  );

  Certificate.discriminator(
    "COURSE_COMPLETION",
    new Schema({ metadata: CourseCertificateSchema }, { _id: false })
  );

  const EventAchievementSchema = new Schema(
    {
      rank: { type: String, required: true },
      group: String
    },
    { _id: false }
  );

  Certificate.discriminator(
    "EVENT_ACHIEVEMENT",
    new Schema({ metadata: EventAchievementSchema }, { _id: false })
  );

  const ParticipationCertificateSchema = new Schema(
    {
      role: {
        type: String,
        enum: ["ATTENDEE", "PARTICIPANT", "SPEAKER", "ORGANIZER"],
        required: true
      }
    },
    { _id: false }
  );

  Certificate.discriminator(
    "PARTICIPATION",
    new Schema({ metadata: ParticipationCertificateSchema }, { _id: false })
  );

  const VolunteerCertificateSchema = new Schema(
    {
      hours: { type: Number, required: true }
    },
    { _id: false }
  );

  Certificate.discriminator(
    "VOLUNTEER",
    new Schema({ metadata: VolunteerCertificateSchema }, { _id: false })
  );
}

export default Certificate;
