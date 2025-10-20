"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";
import styled from "styled-components";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

const userMentionCache = new Map<string, MentionResponse>();

const Mention = styled.span<{
  $loaded?: boolean;
  $isLink?: boolean;
  $isDotted?: boolean;
  $authorFormat?: boolean;
}>`
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  color: var(--foreground);
  font-weight: ${({ $authorFormat }) => ($authorFormat ? "600" : "400")};
  ${({ $isLink, $isDotted }) =>
    $isLink &&
    `
    text-decoration: underline;
    text-decoration-style: ${$isDotted ? "dotted" : "solid"};
  `}

  ${({ $loaded }) =>
    !$loaded &&
    `
    color: var(--color-gray-400);
    pointer-events: none;
  `}
`;

const Avatar = styled(Image)`
  border-radius: 6px;
  object-fit: cover;
  margin: auto;
`;

const UserLink = styled(Link)`
  border-bottom: none !important;
`;

type MentionResponse =
  | {
      id?: string;
      name?: string;
      image?: string;
      isPrivate?: boolean;
    }
  | Record<string, never>;

type SessionWithFlags = { user?: { flags?: Record<string, boolean> } } | null;

export default React.memo(function UserMention({
  userId,
  isAdmin,
  authorFormat
}: {
  userId?: string | null;
  isAdmin?: boolean;
  authorFormat?: boolean;
}) {
  const { data: session } = useSession();
  const t = useTranslations("mentions");
  const cacheKey = `${userId}-${isAdmin ? "admin" : "user"}`;
  const [data, setData] = React.useState<MentionResponse | null>(
    userId ? userMentionCache.get(cacheKey) || null : null
  );
  const [loading, setLoading] = React.useState<boolean>(
    Boolean(userId && !userMentionCache.has(cacheKey))
  );

  React.useEffect(() => {
    if (!userId) return;

    // Already cached?
    if (userMentionCache.has(cacheKey)) {
      setData(userMentionCache.get(cacheKey) || null);
      setLoading(false);
      return;
    }

    let ignore = false;
    setLoading(true);

    const fetchData = async () => {
      try {
        let res: Response;
        if (isAdmin) {
          res = await fetch(`/api/admin/users/mentions/${encodeURIComponent(userId)}`);
        } else {
          res = await fetch(`/api/users/mentions/${encodeURIComponent(userId)}`);
        }
        if (!res.ok) {
          if (!ignore) {
            setData({});
            setLoading(false);
          }
          return;
        }
        const json = (await res.json()) as MentionResponse;
        if (!ignore) {
          setData(json);
          setLoading(false);
          userMentionCache.set(cacheKey, json);
        }
      } catch {
        if (!ignore) {
          setData({});
          setLoading(false);
          userMentionCache.set(cacheKey, {});
        }
      }
    };

    fetchData();

    return () => {
      ignore = true;
    };
  }, [cacheKey, isAdmin, userId]);

  const canSeePrivate = Boolean(
    (session as SessionWithFlags)?.user?.flags?.["profile-see-private-profiles"]
  );
  const canShowMentionAvatars = Boolean(
    (session as SessionWithFlags)?.user?.flags?.["markdown-see-mention-avatars"]
  );

  // Loading placeholder using i18n
  if (loading) return <Mention $authorFormat={authorFormat}>{t("loading")}</Mention>;

  // Deleted user (empty object)
  if (data && Object.keys(data).length === 0)
    return <Mention $authorFormat={authorFormat}>{t("deleted")}</Mention>;

  // Restricted: id present but no name
  if (data && "id" in data && data.id && !data.name)
    return <Mention $authorFormat={authorFormat}>{t("restricted")}</Mention>;

  // Displayable user
  if (data && data.id && data.name) {
    const showImage = Boolean(canShowMentionAvatars && data.image);
    const linkable = !isAdmin && (!data.isPrivate || (data.isPrivate && canSeePrivate));
    const dotted = Boolean(data.isPrivate && canSeePrivate);

    const content = (
      <Mention
        $loaded
        $isLink={linkable}
        $isDotted={dotted}
        $authorFormat={authorFormat}
        data-no-ai-translate
      >
        {showImage ? (
          <Avatar width={18} height={18} src={data.image as string} alt={data.name} />
        ) : null}
        {data.name}
      </Mention>
    );

    if (linkable) {
      return <UserLink href={`/user/${encodeURIComponent(data.id)}`}>{content}</UserLink>;
    }
    return content;
  }

  // Fallback
  return <Mention $authorFormat={authorFormat}>{t("loading")}</Mention>;
});
