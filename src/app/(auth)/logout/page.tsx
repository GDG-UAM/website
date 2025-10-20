"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import styled from "styled-components";
import Image from "next/image";

const LogoContainer = styled.div`
  margin-bottom: 32px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 600;
  color: var(--auth-logout-title-text);
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: var(--auth-logout-subtitle-text);
  margin-bottom: 32px;
  line-height: 1.5;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SignOutButton = styled.button`
  width: 100%;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background: var(--auth-logout-button-bg);
  color: var(--auth-logout-button-text);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--auth-logout-button-bg-hover);
    box-shadow: 0 2px 8px var(--auth-logout-button-shadow);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--auth-logout-button-shadow);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;

    &:hover {
      background: var(--auth-logout-button-bg-disabled-hover);
      box-shadow: none;
    }
  }
`;

const CancelButton = styled.button`
  width: 100%;
  padding: 12px 24px;
  border: 2px solid var(--auth-logout-cancel-button-border);
  border-radius: 8px;
  background: var(--auth-logout-cancel-button-bg);
  color: var(--auth-logout-cancel-button-text);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--auth-logout-cancel-button-border-hover);
    color: var(--auth-logout-cancel-button-text-hover);
  }

  &:focus {
    outline: none;
    border-color: var(--auth-logout-cancel-button-border-hover);
    box-shadow: 0 0 0 2px var(--auth-logout-cancel-button-shadow);
  }
`;

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid var(--auth-logout-loading-spinner-border);
  border-top: 2px solid var(--auth-logout-loading-spinner-border-top);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const LoadingSpinnerContainer = styled.div`
  display: flex;
  justify-content: center;
  margin: 32px 0;
`;

const UserInfo = styled.div`
  background: var(--auth-logout-user-info-bg);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
`;

const UserTextInfo = styled.div`
  flex: 1;
`;

const UserName = styled.div`
  font-weight: 500;
  color: var(--auth-logout-user-info-name-text);
  margin-bottom: 4px;
`;

const UserEmail = styled.div`
  font-size: 14px;
  color: var(--auth-logout-user-info-email-text);
`;

export default function LogoutPage() {
  const router = useRouter();
  const t = useTranslations("auth.logout");
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);

      await signOut({
        redirect: true,
        callbackUrl: "/"
      });
    } catch (err) {
      console.error("Sign out error:", err);
      // Even if there's an error, try to redirect
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    try {
      if ((window.history?.length || 0) <= 1) router.push("/");
      else router.back();
    } catch {
      router.push("/");
    }
  };

  if (status === "loading") {
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
        <Title>{t("loading")}</Title>
        <LoadingSpinnerContainer>
          <LoadingSpinner />
        </LoadingSpinnerContainer>
      </>
    );
  }

  if (!session) return null; // Will redirect

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

      {session.user && (
        <UserInfo>
          {session.user.image && (
            <Image
              src={session.user.image}
              alt={session.user.name || session.user.email || ""}
              width={48}
              height={48}
              decoding="async"
              priority={false}
              sizes="48px"
              style={{ borderRadius: "50%", objectFit: "cover" }}
            />
          )}
          <UserTextInfo>
            <UserName>{session.user.name || session.user.email || ""}</UserName>
            <UserEmail>{session.user.email}</UserEmail>
          </UserTextInfo>
        </UserInfo>
      )}

      <ButtonContainer>
        <SignOutButton
          type="button"
          onClick={handleSignOut}
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? <LoadingSpinner /> : t("signOutButton")}
        </SignOutButton>

        <CancelButton type="button" onClick={handleCancel}>
          {t("cancelButton")}
        </CancelButton>
      </ButtonContainer>
    </>
  );
}
