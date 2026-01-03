import { Elysia, t } from "elysia";
import { getCertificateById, verifyCertificate } from "@/lib/controllers/certificateController";
import { CertificateTypeEnum, SignatureSchema } from "../models/admin/certificates";

// Public certificate response schema (limited info)
const PublicCertificateItem = t.Object({
  id: t.String(),
  recipient: t.Object({
    name: t.String()
  }),
  designId: t.String(),
  signatures: t.Optional(t.Array(SignatureSchema)),
  period: t.Optional(
    t.Object({
      startDate: t.Optional(t.Date()),
      endDate: t.Optional(t.Date())
    })
  ),
  title: t.String(),
  description: t.Optional(t.String()),
  type: CertificateTypeEnum,
  metadata: t.Optional(t.Any()),
  revoked: t.Optional(
    t.Object({
      isRevoked: t.Boolean(),
      revokedAt: t.Optional(t.Date())
    })
  ),
  createdAt: t.Date()
});

const VerifyResponse = t.Object({
  valid: t.Boolean(),
  certificate: t.Optional(t.Nullable(PublicCertificateItem)),
  revokedReason: t.Optional(t.String())
});

export const certificatesRoutes = new Elysia({ prefix: "/certificates" })
  .derive(({ set }) => ({
    status: (code: 200 | 400 | 404 | 500, response) => {
      set.status = code;
      return response;
    }
  }))
  // Get certificate by ID
  .get(
    "/:id",
    async ({ params: { id }, status }) => {
      try {
        const certificate = await getCertificateById(id);

        if (!certificate) {
          return status(404, { error: "Certificate not found" });
        }

        // Return public-safe data (no userId, etc.)
        return status(200, {
          id: certificate._id.toString(),
          recipient: {
            name: certificate.recipient.name
          },
          designId: certificate.designId,
          signatures: certificate.signatures,
          period: certificate.period,
          title: certificate.title,
          description: certificate.description,
          type: certificate.type,
          metadata: certificate.metadata,
          revoked: certificate.revoked
            ? {
                isRevoked: certificate.revoked.isRevoked,
                revokedAt: certificate.revoked.revokedAt
              }
            : undefined,
          createdAt: certificate.createdAt
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to get certificate";
        return status(500, { error: msg });
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      response: {
        200: PublicCertificateItem,
        404: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String() })
      }
    }
  )
  // Verify a certificate by ID
  .get(
    "/:id/verify",
    async ({ params: { id }, status }) => {
      try {
        const result = await verifyCertificate(id);

        if (!result.certificate) {
          return status(200, {
            valid: false,
            certificate: null,
            revokedReason: undefined
          });
        }

        // Return public-safe verification result
        return status(200, {
          valid: result.valid,
          certificate: result.certificate
            ? {
                id: result.certificate._id.toString(),
                recipient: {
                  name: result.certificate.recipient.name
                },
                designId: result.certificate.designId,
                signatures: result.certificate.signatures,
                period: result.certificate.period,
                title: result.certificate.title,
                description: result.certificate.description,
                type: result.certificate.type,
                metadata: result.certificate.metadata,
                revoked: result.certificate.revoked
                  ? {
                      isRevoked: result.certificate.revoked.isRevoked,
                      revokedAt: result.certificate.revoked.revokedAt
                    }
                  : undefined,
                createdAt: result.certificate.createdAt
              }
            : null,
          revokedReason: result.revokedReason
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to verify certificate";
        return status(500, { error: msg });
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      response: {
        200: VerifyResponse,
        500: t.Object({ error: t.String() })
      }
    }
  );
