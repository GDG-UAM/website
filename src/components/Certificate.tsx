"use client";

import { CertificateData } from "@/lib/types/certificate";
import DefaultCertificate from "./certificates/DefaultCertificate";

// Re-export type for backward compatibility
export type { CertificateData } from "@/lib/types/certificate";

export interface CertificateProps {
  data: CertificateData;
}

export const CERTIFICATE_DESIGNS = [{ id: "default", label: "Default" }];

export default function Certificate({ data }: CertificateProps) {
  return <DefaultCertificate data={data} />;
}
