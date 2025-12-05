"use client";

import { useEffect, useRef, useState } from "react";
import Certificate, { CertificateData } from "@/components/Certificate";
import { PrintButton, ShareButton } from "@/components/Buttons";
import { useTranslations } from "next-intl";
import LocalTimeWithSettings from "@/components/LocalTimeWithSettings";
import styled from "styled-components";

const ViewWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: min(1280px, calc(100vw - 80px));
  margin: 0 auto;
  box-sizing: border-box;
`;

const CertificateContainer = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: 8px;
    border-radius: 8px;
  }
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
  showVerification = false
}: CertificateViewProps) {
  const t = useTranslations("certificates");

  if (showStatus === undefined) showStatus = isRevoked;

  const certRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [wrapperHeight, setWrapperHeight] = useState<number>(0);

  useEffect(() => {
    const resize = () => {
      if (!wrapperRef.current || !certRef.current) return;
      const containerWidth = wrapperRef.current.offsetWidth;
      const certificateWidth = certRef.current.offsetWidth;
      const certificateHeight = certRef.current.offsetHeight;
      const s = Math.min(containerWidth / certificateWidth, 1);
      setScale(s);
      setWrapperHeight(Math.ceil(certificateHeight * s));
    };

    resize();
    window.addEventListener("resize", resize);

    const ro = new ResizeObserver(resize);
    if (certRef.current) ro.observe(certRef.current);

    return () => {
      window.removeEventListener("resize", resize);
      ro.disconnect();
    };
  }, []);

  const handlePrint = () => {};

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: data.title,
          text: `${t("pageTitle")}: ${data.title} - ${data.recipient.name}`,
          url
        });
      } catch {}
    } else {
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
        <div
          ref={wrapperRef}
          style={{
            width: "100%",
            height: wrapperHeight || "auto",
            position: "relative",
            overflow: "hidden"
          }}
        >
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              position: "absolute",
              top: 0,
              left: 0
            }}
          >
            <div ref={certRef} style={{ width: "max-content" }}>
              <Certificate data={data} />
            </div>
          </div>
        </div>
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
          {/* {t("verification.description")}{" "}
          <strong>
            {typeof window !== "undefined" ? window.location.origin : ""}/cert/{publicId}
          </strong> */}
          <CertificateId>
            {t("verification.id")}: {publicId}
          </CertificateId>
        </VerificationInfo>
      )}
    </ViewWrapper>
  );
}
