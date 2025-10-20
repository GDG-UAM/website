import styled, { keyframes, css } from "styled-components";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";

const ProfileCardLink = styled(Link)`
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  width: fit-content;
  @media (max-width: 768px) {
    margin: 0;
  }
`;

const ProfileCardContainer = styled.div<{ $skeleton?: boolean }>`
  background: var(--color-white);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  position: relative;
  overflow: hidden;
  width: 200px;
  border: 2px solid transparent;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease,
    border 0.3s ease;

  ${({ $skeleton }) =>
    !$skeleton &&
    css`
      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
      }
    `}

  @media (max-width: 768px) {
    margin: 0;
    &:hover {
      transform: none;
    }
  }
`;

const shimmer = keyframes`
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: 0 0;
  }
`;

const ProfileImageContainer = styled.div<{ $skeleton?: boolean }>`
  width: 72px;
  height: 72px;
  border-radius: 50%;
  margin: 0 auto 16px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: ${({ $skeleton }) =>
    $skeleton ? "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%)" : "none"};
  background-size: ${({ $skeleton }) => ($skeleton ? "400% 100%" : "auto")};
  ${({ $skeleton }) =>
    $skeleton
      ? css`
          animation: ${shimmer} 1.4s ease infinite;
        `
      : css`
          animation: none;
        `}
`;

const ProfileName = styled.h5<{ $skeleton?: boolean; $isLink?: boolean; $isDotted?: boolean }>`
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0 auto;
  margin-bottom: 4px;
  margin-top: 12px;
  color: var(--google-dark-gray);
  ${({ $isLink, $isDotted }) =>
    $isLink &&
    css`
      text-decoration: underline;
      text-decoration-style: ${$isDotted ? "dotted" : "solid"};
    `}
  ${({ $skeleton }) =>
    $skeleton
      ? css`
          width: 70%;
          height: 20px;
          margin-bottom: 8px;
          margin-top: 20px;
          border-radius: 6px;
          background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
          background-size: 400% 100%;
          animation: ${shimmer} 1.4s ease infinite;
          color: transparent;
        `
      : ""}
`;

type ProfileCardProps = {
  id?: string;
  name?: string;
  image?: string;
  showProfilePublicly?: boolean;
  skeleton?: boolean;
};

export default function ProfileCard({
  id,
  name,
  image,
  showProfilePublicly,
  skeleton
}: ProfileCardProps) {
  const { data: session } = useSession();
  type SessionWithFlags = { user?: { flags?: Record<string, boolean> } } | null;
  const canSeePrivate = Boolean(
    (session as SessionWithFlags)?.user?.flags?.["profile-see-private-profiles"]
  );

  const linkable = Boolean(!skeleton && id && (showProfilePublicly || canSeePrivate));
  const dotted = Boolean(!showProfilePublicly && canSeePrivate);

  const content = (
    <>
      <ProfileCardContainer $skeleton={skeleton} data-no-ai-translate>
        <ProfileImageContainer $skeleton={skeleton}>
          {skeleton ? null : (
            <Image
              src={image || "/logo/196x196.webp"}
              alt={name || ""}
              fill
              sizes="72px"
              style={{ objectFit: "cover" }}
            />
          )}
        </ProfileImageContainer>
        <ProfileName $skeleton={skeleton} $isLink={linkable} $isDotted={dotted}>
          {skeleton ? "" : name}
        </ProfileName>
      </ProfileCardContainer>
    </>
  );

  if (!linkable) return content;
  return <ProfileCardLink href={`/user/${id}`}>{content}</ProfileCardLink>;
}
