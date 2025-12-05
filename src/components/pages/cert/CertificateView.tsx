"use client";

import styled from "styled-components";
import Certificate, { CertificateData } from "@/components/Certificate";
import { PrintButton, ShareButton } from "@/components/Buttons";
import { useTranslations } from "next-intl";
import LocalTimeWithSettings from "@/components/LocalTimeWithSettings";

const ViewWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 800px;
  margin: 0 auto;
`;

const CertificateContainer = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
`;

const StatusBanner = styled.div<{ $revoked?: boolean }>`
  background: ${({ $revoked }) => ($revoked ? "#fef2f2" : "#f0fdf4")};
  border: 1px solid ${({ $revoked }) => ($revoked ? "#fecaca" : "#bbf7d0")};
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: ${({ $revoked }) => ($revoked ? "#991b1b" : "#166534")};
`;

const StatusIcon = styled.div<{ $revoked?: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${({ $revoked }) => ($revoked ? "#dc2626" : "#22c55e")};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
`;

const StatusText = styled.div`
  flex: 1;
`;

const StatusTitle = styled.div`
  font-weight: 600;
  font-size: 0.875rem;
`;

const StatusSubtitle = styled.div`
  font-size: 0.75rem;
  opacity: 0.8;
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
`;

const VerificationInfo = styled.div`
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
`;

const CertificateId = styled.div`
  font-family: monospace;
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 8px;
`;

export interface CertificateViewProps {
  data: CertificateData;
  publicId: string;
  isRevoked?: boolean;
  revokedAt?: Date;
  createdAt?: Date;
  showStatus?: boolean;
  showActions?: boolean;
  showVerification?: boolean;
}

export default function CertificateView({
  data,
  publicId,
  isRevoked = false,
  revokedAt,
  createdAt,
  showStatus,
  showActions = true,
  showVerification = true
}: CertificateViewProps) {
  const t = useTranslations("certificates");

  if (showStatus === undefined) showStatus = isRevoked;

  const handlePrint = () => {
    // TODO: Implement print functionality
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: data.title,
          text: `${t("pageTitle")}: ${data.title} - ${data.recipient.name}`,
          url
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <ViewWrapper>
      {showStatus && (
        <StatusBanner $revoked={isRevoked}>
          <StatusIcon $revoked={isRevoked}>{isRevoked ? "✕" : "✓"}</StatusIcon>
          <StatusText>
            <StatusTitle>{isRevoked ? t("status.revoked") : t("status.valid")}</StatusTitle>
            <StatusSubtitle>
              {isRevoked && revokedAt
                ? t.rich("status.revokedOn", {
                    date: () => (
                      <LocalTimeWithSettings
                        iso={new Date(revokedAt).toISOString()}
                        dateOnly
                        fullMonth
                      />
                    )
                  })
                : createdAt
                  ? t.rich("status.issuedOn", {
                      date: () => (
                        <LocalTimeWithSettings
                          iso={new Date(createdAt).toISOString()}
                          dateOnly
                          fullMonth
                        />
                      )
                    })
                  : null}
            </StatusSubtitle>
          </StatusText>
        </StatusBanner>
      )}

      <CertificateContainer>
        <Certificate data={data} />
      </CertificateContainer>

      {showActions && (
        <ActionsContainer>
          <PrintButton onClick={handlePrint} disabled>
            {t("actions.print")}
          </PrintButton>
          <ShareButton onClick={handleShare}>{t("actions.share")}</ShareButton>
        </ActionsContainer>
      )}

      {showVerification && (
        <VerificationInfo>
          {t("verification.description")}{" "}
          <strong>
            {typeof window !== "undefined" ? window.location.origin : ""}/cert/{publicId}
          </strong>
          <CertificateId>
            {t("verification.id")}: {publicId}
          </CertificateId>
        </VerificationInfo>
      )}
    </ViewWrapper>
  );
}
