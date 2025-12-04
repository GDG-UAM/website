"use client";
import { api } from "@/lib/eden";

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
  white-space: pre-wrap; /* Respect newlines */
`;

const TagsRow = styled.div`
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;

  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--google-red);
  font-size: 0.9rem;
  font-weight: 600;
  border: 2px solid var(--google-red);
  border-radius: 1000px;
  padding: 4px 12px;

  svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }
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

// Tag icon paths from Material Icons
const TAG_ICONS: Record<string, string | Record<string, string>> = {
  "gdg-organizer":
    // "m344-60-76-128-144-32 14-148-98-112 98-112-14-148 144-32 76-128 136 58 136-58 76 128 144 32-14 148 98 112-98 112 14 148-144 32-76 128-136-58-136 58Zm34-102 102-44 104 44 56-96 110-26-10-112 74-84-74-86 10-112-110-24-58-96-102 44-104-44-56 96-110 24 10 112-74 86 74 84-10 114 110 24 58 96Zm102-318Zm-42 142 226-226-56-58-170 170-86-84-56 56 142 142Z", // Verified
    // "M320-240 80-480l240-240 57 57-184 184 183 183-56 56Zm320 0-57-57 184-184-183-183 56-56 240 240-240 240Z", // Code
    {
      iconPath: `
      <g transform="matrix(1, 0, 0, 1, -175.3, -153.8)">
        <g>
          <path fill="currentColor" stroke="currentColor" stroke-width="15" d="M 253.038 228.062 C 253.038 228.062 220.239 202.392 213.429 201.24 C 204.384 199.71 192.523 206.083 194.4 204.7 L 247.2 166.8 C 253 162.7 260 161 267 162.2 C 274 163.3 280.1 167.2 284.3 172.9 C 288.4 178.7 290.1 185.7 288.9 192.7 C 287.8 199.7 283.9 205.8 278.2 210 L 253.038 228.062 Z M 262.6 165.5 C 257.9 165.5 253.2 167 249.3 169.8 L 196.5 207.7 C 193.572 206.586 207.276 201.125 211.783 201.731 C 223.454 203.301 250.013 225.553 250.012 225.554 L 276 206.9 C 281 203.3 284.2 198.1 285.2 192 C 286.2 186 284.8 179.9 281.2 175 C 277.6 170 272.4 166.8 266.3 165.8 C 265.1 165.6 263.8 165.5 262.6 165.5 Z"/>
        </g>
        <g>
          <path fill="currentColor" stroke="currentColor" stroke-width="15" d="M262.6,290.8c-5.5,0-10.9-1.7-15.4-5l-52.8-37.9c-11.9-8.5-14.6-25.2-6.1-37.1h0c4.1-5.8,10.3-9.6,17.3-10.7,7-1.1,14,.5,19.8,4.6l52.8,37.9c11.9,8.5,14.6,25.2,6.1,37.1-4.1,5.8-10.3,9.6-17.3,10.7-1.5.2-2.9.4-4.3.4ZM209.9,203.5c-1.2,0-2.5.1-3.7.3-6,1-11.3,4.3-14.9,9.2h0c-3.6,5-5,11-4,17,1,6,4.3,11.3,9.2,14.9l52.8,37.9c5,3.6,11,5,17,4,6-1,11.3-4.3,14.9-9.2,3.6-5,5-11,4-17-1-6-4.3-11.3-9.2-14.9l-52.8-37.9c-3.9-2.8-8.5-4.3-13.3-4.3Z"/>
        </g>
        <g>
          <path fill="currentColor" stroke="currentColor" stroke-width="15" d="M 337.4 290.8 C 329.1 290.8 321 287 315.8 279.8 C 307.3 267.9 310 251.3 321.9 242.7 L 346.237 225.23 C 346.15 225.265 382.902 257.685 394.263 253.141 L 396.625 254.514 L 352.9 285.9 C 348.2 289.3 342.8 290.9 337.4 290.9 L 337.4 290.8 Z M 391.95 253.191 C 391.95 253.191 346.657 228.708 349.163 227.638 L 324 245.7 C 313.8 253.1 311.4 267.4 318.8 277.6 C 326.2 287.8 340.5 290.2 350.7 282.8 L 391.95 253.191 Z"/>
        </g>
        <g>
          <path fill="currentColor" stroke="currentColor" stroke-width="15" d="M390.1,252.9c-5.5,0-10.9-1.7-15.4-5l-52.8-37.9c-11.9-8.5-14.6-25.2-6.1-37.1h0c8.5-11.9,25.2-14.6,37.1-6.1l52.8,37.9c11.9,8.5,14.6,25.2,6.1,37.1-4.1,5.8-10.3,9.6-17.3,10.7-1.5.2-2.9.4-4.3.4ZM318.8,175c-3.6,5-5,11-4,17,1,6,4.3,11.3,9.2,14.9l52.8,37.9c5,3.6,11,5,17,4,6-1,11.3-4.3,14.9-9.2,3.6-5,5-11,4-17-1-6-4.3-11.3-9.2-14.9l-52.8-37.9c-10.2-7.4-24.5-5-31.9,5.2h0Z"/>
        </g>
      </g>
    `,
      viewBox: "0 0 249.3 144.9"
    },
  "team-member":
    // "M40-160v-112q0-34 17.5-62.5T104-378q62-31 126-46.5T360-440q66 0 130 15.5T616-378q29 15 46.5 43.5T680-272v112H40Zm720 0v-120q0-44-24.5-84.5T666-434q51 6 96 20.5t84 35.5q36 20 55 44.5t19 53.5v120H760ZM360-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm400-160q0 66-47 113t-113 47q-11 0-28-2.5t-28-5.5q27-32 41.5-71t14.5-81q0-42-14.5-81T544-792q14-5 28-6.5t28-1.5q66 0 113 47t47 113ZM120-240h480v-32q0-11-5.5-20T580-306q-54-27-109-40.5T360-360q-56 0-111 13.5T140-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T440-640q0-33-23.5-56.5T360-720q-33 0-56.5 23.5T280-640q0 33 23.5 56.5T360-560Zm0 320Zm0-400Z",
    "M475-160q4 0 8-2t6-4l328-328q12-12 17.5-27t5.5-30q0-16-5.5-30.5T817-607L647-777q-11-12-25.5-17.5T591-800q-15 0-30 5.5T534-777l-11 11 74 75q15 14 22 32t7 38q0 42-28.5 70.5T527-522q-20 0-38.5-7T456-550l-75-74-175 175q-3 3-4.5 6.5T200-435q0 8 6 14.5t14 6.5q4 0 8-2t6-4l136-136 56 56-135 136q-3 3-4.5 6.5T285-350q0 8 6 14t14 6q4 0 8-2t6-4l136-135 56 56-135 136q-3 2-4.5 6t-1.5 8q0 8 6 14t14 6q4 0 7.5-1.5t6.5-4.5l136-135 56 56-136 136q-3 3-4.5 6.5T454-180q0 8 6.5 14t14.5 6Zm-1 80q-37 0-65.5-24.5T375-166q-34-5-57-28t-28-57q-34-5-56.5-28.5T206-336q-38-5-62-33t-24-66q0-20 7.5-38.5T149-506l232-231 131 131q2 3 6 4.5t8 1.5q9 0 15-5.5t6-14.5q0-4-1.5-8t-4.5-6L398-777q-11-12-25.5-17.5T342-800q-15 0-30 5.5T285-777L144-635q-9 9-15 21t-8 24q-2 12 0 24.5t8 23.5l-58 58q-17-23-25-50.5T40-590q2-28 14-54.5T87-692l141-141q24-23 53.5-35t60.5-12q31 0 60.5 12t52.5 35l11 11 11-11q24-23 53.5-35t60.5-12q31 0 60.5 12t52.5 35l169 169q23 23 35 53t12 61q0 31-12 60.5T873-437L545-110q-14 14-32.5 22T474-80Zm-99-560Z",
  founder:
    "m226-559 78 33q14-28 29-54t33-52l-56-11-84 84Zm142 83 114 113q42-16 90-49t90-75q70-70 109.5-155.5T806-800q-72-5-158 34.5T492-656q-42 42-75 90t-49 90Zm178-65q-23-23-23-56.5t23-56.5q23-23 57-23t57 23q23 23 23 56.5T660-541q-23 23-57 23t-57-23Zm19 321 84-84-11-56q-26 18-52 32.5T532-299l33 79Zm313-653q19 121-23.5 235.5T708-419l20 99q4 20-2 39t-20 33L538-80l-84-197-171-171-197-84 167-168q14-14 33.5-20t39.5-2l99 20q104-104 218-147t235-24ZM157-321q35-35 85.5-35.5T328-322q35 35 34.5 85.5T327-151q-25 25-83.5 43T82-76q14-103 32-161.5t43-83.5Zm57 56q-10 10-20 36.5T180-175q27-4 53.5-13.5T270-208q12-12 13-29t-11-29q-12-12-29-11.5T214-265Z",
  president:
    "M480-80v-355q12-21 26.5-39.5T538-510q44-42 100.5-66T760-600q66 0 113 47t47 113v200q0 66-47 113T760-80H480Zm-280 0q-66 0-113-47T40-240v-200q0-66 47-113t113-47q66 0 123.5 25T425-507q17 16 30.5 34t24.5 38v355H200Zm0-80h240v-120q0-100-70.5-170T200-520q-33 0-56.5 23.5T120-440v200q0 33 23.5 56.5T200-160Zm320 0h240q33 0 56.5-23.5T840-240v-200q0-33-23.5-56.5T760-520q-99 0-169.5 70T520-280v120Zm-80-514v-46H320v-80h120v-120h80v120h120v80H520v45q39 10 68 37.5t42 65.5q-20 8-37 19t-34 24q-3-30-25.5-50.5T480-600q-31 0-53.5 20.5T401-529q-16-13-34-24t-37-19q13-38 42.5-64.5T440-674Z",
  "vice-president":
    "M160-120q-33 0-56.5-23.5T80-200v-440q0-33 23.5-56.5T160-720h160v-80q0-33 23.5-56.5T400-880h160q33 0 56.5 23.5T640-800v80h160q33 0 56.5 23.5T880-640v440q0 33-23.5 56.5T800-120H160Zm240-600h160v-80H400v80Zm400 360H600v80H360v-80H160v160h640v-160Zm-360 0h80v-80h-80v80Zm-280-80h200v-80h240v80h200v-200H160v200Zm320 40Z",
  treasurer:
    "M336-120q-91 0-153.5-62.5T120-336q0-38 13-74t37-65l142-171-97-194h530l-97 194 142 171q24 29 37 65t13 74q0 91-63 153.5T624-120H336Zm144-200q-33 0-56.5-23.5T400-400q0-33 23.5-56.5T480-480q33 0 56.5 23.5T560-400q0 33-23.5 56.5T480-320Zm-95-360h190l40-80H345l40 80Zm-49 480h288q57 0 96.5-39.5T760-336q0-24-8.5-46.5T728-423L581-600H380L232-424q-15 18-23.5 41t-8.5 47q0 57 39.5 96.5T336-200Z",
  secretary:
    "M360-600v-80h360v80H360Zm0 120v-80h360v80H360Zm120 320H200h280Zm0 80H240q-50 0-85-35t-35-85v-120h120v-560h600v361q-20-2-40.5 1.5T760-505v-295H320v480h240l-80 80H200v40q0 17 11.5 28.5T240-160h240v80Zm80 0v-123l221-220q9-9 20-13t22-4q12 0 23 4.5t20 13.5l37 37q8 9 12.5 20t4.5 22q0 11-4 22.5T903-300L683-80H560Zm300-263-37-37 37 37ZM620-140h38l121-122-18-19-19-18-122 121v38Zm141-141-19-18 37 37-18-19Z"
};

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
  const fetcher = async ([userId, privateAccess]: [string, boolean]) => {
    const { data, error } = privateAccess
      ? await api.admin.users({ id: userId }).get()
      : await api.users({ id: userId }).get();

    if (error) {
      const err = new Error("Failed to load profile") as HttpError;
      err.status = error.status;
      throw err;
    }
    return data;
  };

  const { data, error, isLoading } = useSWR<UserProfileDTO>(
    id ? [id, canSeePrivate] : null,
    fetcher,
    {
      // Keep UI snappy without excessive refetching
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      errorRetryCount: 2,
      errorRetryInterval: 1500
    }
  );

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

  const { name, image, bio, socials, isPrivate, role, customTags } = (data || {}) as UserProfileDTO;

  type Network = "website" | "github" | "linkedin" | "x" | "instagram";
  const socialEntries: Array<{ key: keyof typeof socials; network: Network; value?: string }> = [
    { key: "website", network: "website", value: socials.website },
    { key: "github", network: "github", value: socials.github },
    { key: "linkedin", network: "linkedin", value: socials.linkedin },
    { key: "x", network: "x", value: socials.x },
    { key: "instagram", network: "instagram", value: socials.instagram }
  ];

  // Determine which tags to show
  const tags: Array<{ key: string; label: string }> = [];

  // Add role-based tags
  if (role === "admin") {
    tags.push({ key: "gdg-organizer", label: "GDG Organizer" });
  } else if (role === "team") {
    tags.push({ key: "team-member", label: "Team Member" });
  }

  // Add custom tags
  if (customTags && customTags.length > 0) {
    customTags.forEach((tag) => {
      const labels: Record<string, string> = {
        founder: "Founder",
        president: "President",
        "vice-president": "Vice President",
        treasurer: "Treasurer",
        secretary: "Secretary"
      };
      tags.push({ key: tag, label: labels[tag] || tag });
    });
  }

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
          {tags.length > 0 && (
            <TagsRow>
              {tags.map((tag) => {
                const content = TAG_ICONS[tag.key];
                return typeof content === "object" ? (
                  <Tag key={tag.key}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox={content.viewBox}
                      width="24px"
                      fill="currentColor"
                    >
                      <g dangerouslySetInnerHTML={{ __html: content.iconPath }} />
                    </svg>
                    <span>{tag.label}</span>
                  </Tag>
                ) : (
                  <Tag key={tag.key}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="currentColor"
                    >
                      <path d={content} />
                    </svg>
                    <span>{tag.label}</span>
                  </Tag>
                );
              })}
            </TagsRow>
          )}
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
