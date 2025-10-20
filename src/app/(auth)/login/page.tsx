"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import styled from "styled-components";
import Image from "next/image";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";

const LogoContainer = styled.div`
  margin-bottom: 32px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 600;
  color: var(--auth-login-title-text);
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: var(--auth-login-subtitle-text);
  margin-bottom: 32px;
  line-height: 1.5;
`;

// (GoogleLoginButton provides the button and spinner styles)

const ErrorMessage = styled.div`
  background: var(--auth-login-error-bg);
  color: var(--auth-login-error-text);
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  font-size: 14px;
  border: 1px solid var(--auth-login-error-border);
`;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const t = useTranslations("auth.login");

  const validatedCallbackUrl = useMemo(() => {
    const raw = searchParams?.get("callbackUrl") || "/";
    try {
      // Allow only same-origin or relative paths
      const u = new URL(raw, typeof window !== "undefined" ? window.location.origin : "http://x");
      const sameOrigin = typeof window === "undefined" || u.origin === window.location.origin;
      return sameOrigin ? u.pathname + u.search + u.hash : "/";
    } catch {
      return "/";
    }
  }, [searchParams]);

  const errorMessage = useMemo(() => {
    const raw = searchParams?.get("error");
    if (!raw) return null;
    const allowed = new Set([
      "Default",
      "OAuthAccountNotLinked",
      "AccessDenied",
      "Configuration",
      "OAuthCallback",
      "OAuthCreateAccount",
      "OAuthSignin",
      "SessionRequired",
      "CallbackRouteError"
    ]);
    const key = allowed.has(raw) ? raw : "Default";
    return t(`errors.${key}`);
  }, [searchParams, t]);

  // Redirect if already authenticated
  useEffect(() => {
    if (status === "authenticated") {
      router.replace(validatedCallbackUrl);
    }
  }, [status, router, validatedCallbackUrl]);

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
      <Subtitle>{t("subtitle")}</Subtitle>

      {errorMessage && (
        <ErrorMessage role="alert" aria-live="polite">
          {errorMessage}
        </ErrorMessage>
      )}

      <GoogleLoginButton label={t("googleButton")} callbackUrl={validatedCallbackUrl} fullWidth />
    </>
  );
}
