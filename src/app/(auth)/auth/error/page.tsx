"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import styled from "styled-components";
import Image from "next/image";
import Link from "next/link";

const LogoContainer = styled.div`
  margin-bottom: 32px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 600;
  color: var(--auth-error-title-text);
  margin-bottom: 16px;
`;

const ErrorMessage = styled.div`
  background: var(--auth-error-bg);
  color: var(--auth-error-text);
  padding: 16px 20px;
  border-radius: 8px;
  margin-bottom: 24px;
  font-size: 16px;
  border: 1px solid var(--auth-error-border);
  line-height: 1.5;
`;

const Description = styled.p`
  font-size: 16px;
  color: var(--auth-error-description-text);
  margin-bottom: 32px;
  line-height: 1.5;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PrimaryButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background: var(--auth-error-primary-button-bg);
  color: white;
  font-size: 16px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--auth-error-primary-button-bg-hover);
    box-shadow: 0 2px 8px var(--auth-error-primary-button-hover-bg);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--auth-error-primary-button-shadow);
  }
`;

const SecondaryButton = styled.button`
  padding: 12px 24px;
  border: 2px solid var(--auth-error-secondary-button-border);
  border-radius: 8px;
  background: white;
  color: var(--auth-error-secondary-button-text);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--auth-error-secondary-button-hover-border);
    color: var(--auth-error-primary-button-bg);
  }

  &:focus {
    outline: none;
    border-color: var(--auth-error-primary-button-bg);
    box-shadow: 0 0 0 2px var(--auth-error-primary-button-shadow);
  }
`;

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("auth.error");
  const { title, description } = useMemo(() => {
    const raw = searchParams?.get("error") || "Default";
    // Allow-list known keys (extend as you add translations)
    const allowed = new Set([
      "Default",
      "AccessDenied",
      "Configuration",
      "OAuthAccountNotLinked",
      "OAuthCallback",
      "OAuthCreateAccount",
      "OAuthSignin",
      "SessionRequired",
      "CallbackRouteError"
    ]);
    const key = allowed.has(raw) ? raw : "Default";
    return {
      title: t(`errors.${key}.title`),
      description: t(`errors.${key}.description`)
    };
  }, [searchParams, t]);

  const handleGoBack = () => {
    try {
      // If no history entries, navigate to home as a safe fallback
      if ((window.history?.length || 0) <= 1) router.push("/");
      else router.back();
    } catch {
      router.push("/");
    }
  };

  return (
    <>
      <LogoContainer>
        <Image
          src="/logo/32x32.webp"
          alt="GDGoC UAM"
          width={48}
          height={48}
          decoding="async"
          priority={false}
        />
      </LogoContainer>

      <Title>{t("title")}</Title>

      {title && (
        <ErrorMessage>
          <strong>{title}</strong>
        </ErrorMessage>
      )}

      <Description>{description}</Description>

      <ButtonContainer>
        <PrimaryButton href="/login">{t("tryAgainButton")}</PrimaryButton>

        <SecondaryButton onClick={handleGoBack}>{t("goBackButton")}</SecondaryButton>
      </ButtonContainer>
    </>
  );
}
