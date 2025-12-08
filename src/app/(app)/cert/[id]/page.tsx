import { getCertificateByPublicId } from "@/lib/controllers/certificateController";
import { buildSectionMetadata } from "@/lib/metadata";
import { notFound } from "next/navigation";
import CertificateView from "@/components/pages/cert/CertificateView";
import type { CertificateData } from "@/components/Certificate";

export const revalidate = 60;

function isValidPublicId(id: string) {
  // Public ID is a 32-character hex string
  return /^[a-f0-9]{32}$/.test(id);
}

export async function generateMetadata(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!isValidPublicId(id)) return buildSectionMetadata("certificates");

  const certificate = await getCertificateByPublicId(id);
  if (!certificate) return buildSectionMetadata("certificates");

  const entityName = certificate.title || "Certificate";
  const description = `Certificate for ${certificate.recipient.name}`;
  return buildSectionMetadata("certificates", entityName, description);
}

export default async function CertificatePublicPage(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  if (!isValidPublicId(id)) {
    notFound();
  }

  const certificate = await getCertificateByPublicId(id);
  if (!certificate) {
    notFound();
  }

  // Transform the certificate data for the view component
  const certificateData: CertificateData = {
    title: certificate.title,
    description: certificate.description,
    type: certificate.type,
    recipient: {
      name: certificate.recipient.name
    },
    designId: certificate.designId,
    period: certificate.period
      ? {
          startDate: certificate.period.startDate?.toISOString?.() || undefined,
          endDate: certificate.period.endDate?.toISOString?.() || undefined
        }
      : undefined,
    signatures: certificate.signatures,
    metadata: certificate.metadata as CertificateData["metadata"]
  };

  const isRevoked = certificate.revoked?.isRevoked || false;
  const revokedAt = certificate.revoked?.revokedAt;
  const createdAt = certificate.createdAt;
  const recipientUserId = certificate.recipient.userId?.toString();

  return (
    <main
      style={{
        padding: "40px 32px 80px",
        maxWidth: "min(900px, calc(100vw - 76px))",
        width: "100%",
        margin: "0 auto"
      }}
    >
      <CertificateView
        data={certificateData}
        publicId={certificate.publicId}
        isRevoked={isRevoked}
        revokedAt={revokedAt}
        createdAt={createdAt}
        recipientUserId={recipientUserId}
      />
    </main>
  );
}
