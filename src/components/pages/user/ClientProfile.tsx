"use client";

import React from "react";
import Image from "next/image";
import { OpenSocialButton } from "@/components/Buttons";
import styled, { keyframes } from "styled-components";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import type { UserProfileDTO } from "@/lib/types/user";
import NotFound from "@/app/not-found";

const PageContainer = styled.section`
  padding: 40px 32px 80px;
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
`;

const HeaderWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: flex-start;
  }
`;

const AvatarBox = styled.div`
  width: 96px;
  height: 96px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--color-gray-200);
  flex-shrink: 0;
`;

const Content = styled.div`
  flex: 1;
`;

const Name = styled.h1`
  margin: 0;
  font-size: 2rem;
  line-height: 1.2;
  font-weight: 800;
  color: var(--google-dark-gray);

  @media (max-width: 768px) {
    text-align: center;
  }
`;

const NameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    justify-content: center;
    text-align: center;
    flex-direction: column-reverse;
    gap: 4px;
    margin-top: -4px;
  }
`;

const Bio = styled.p`
  margin-top: 12px;
  color: var(--google-light-gray);
  max-width: 65ch;
`;

const SocialRow = styled.div`
  margin-top: 12px;
  margin-bottom: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  @media (max-width: 768px) {
    justify-content: center;
  }
`;

// Loading spinner
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const SpinnerCenter = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
  height: 100%;
`;

const Spinner = styled.div`
  width: 48px;
  height: 48px;
  border: 6px solid var(--loading-border);
  border-top: 6px solid var(--loading-border-top);
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const PrivateBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--google-red);
  font-size: 0.95rem;
  font-weight: 600;
  border: 2px solid var(--google-red);
  border-radius: 1000px;
  padding: 3px 8px;
`;

export default function UserProfileClient(context: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(context.params);
  const id = resolvedParams.id;
  const { data: session } = useSession();
  const t = useTranslations("userProfile");
  type HttpError = Error & { status?: number };
  type SessionWithFlags = { user?: { flags?: Record<string, boolean> } } | null;
  const canSeePrivate = Boolean(
    (session as SessionWithFlags)?.user?.flags?.["profile-see-private-profiles"]
  );
  const fetcher = async (url: string) => {
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) return res.json();
    const err = new Error("Failed to load profile") as HttpError;
    err.status = res.status;
    throw err;
  };

  const endpoint = id ? (canSeePrivate ? `/api/admin/users/${id}` : `/api/users/${id}`) : null;
  const { data, error, isLoading } = useSWR<UserProfileDTO>(endpoint, fetcher, {
    // Keep UI snappy without excessive refetching
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
    errorRetryCount: 2,
    errorRetryInterval: 1500
  });

  if ((error as HttpError)?.status === 404) return <NotFound />;

  if (error) {
    return (
      <PageContainer>
        <Bio>{t("loadError")}</Bio>
      </PageContainer>
    );
  }

  if (isLoading || !data) {
    return (
      <PageContainer>
        <SpinnerCenter>
          <Spinner aria-label={t("loading")} />
        </SpinnerCenter>
      </PageContainer>
    );
  }

  const { name, image, bio, socials, isPrivate } = (data || {}) as UserProfileDTO;

  type Network = "website" | "github" | "linkedin" | "x" | "instagram";
  const socialEntries: Array<{ key: keyof typeof socials; network: Network; value?: string }> = [
    { key: "website", network: "website", value: socials.website },
    { key: "github", network: "github", value: socials.github },
    { key: "linkedin", network: "linkedin", value: socials.linkedin },
    { key: "x", network: "x", value: socials.x },
    { key: "instagram", network: "instagram", value: socials.instagram }
  ];

  const isOwnerPrivate =
    (session?.user?.id as string | undefined) === id &&
    session?.user?.showProfilePublicly === false;

  return (
    <PageContainer>
      <HeaderWrap>
        <AvatarBox>
          <Image
            src={image || "/logo/196x196.webp"}
            alt={name}
            width={96}
            height={96}
            decoding="async"
            priority={false}
            style={{ width: 96, height: 96, objectFit: "cover", borderRadius: "50%" }}
            data-no-ai-translate
          />
        </AvatarBox>
        <Content>
          <NameRow>
            <Name data-no-ai-translate>{name}</Name>
            {(isOwnerPrivate || isPrivate) && (
              <PrivateBadge aria-label={t("private")}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="20"
                  viewBox="0 -960 960 960"
                  width="20"
                  fill="currentColor"
                >
                  <path d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm0-80h480v-400H240v400Zm240-120q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80ZM240-160v-400 400Z" />
                </svg>
                <span>{t("private")}</span>
              </PrivateBadge>
            )}
          </NameRow>
          <SocialRow>
            {socialEntries
              .filter((s) => !!s.value)
              .map((s) => (
                <OpenSocialButton
                  key={s.network}
                  user={s.value!}
                  network={s.network}
                  ignoreStart
                  showTooltip
                />
              ))}
          </SocialRow>
          {bio && <Bio>{bio}</Bio>}
        </Content>
      </HeaderWrap>
    </PageContainer>
  );
}
