"use client";

import { memo, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { LocalizedArticle } from "@/lib/types/article";
import styled, { css, keyframes } from "styled-components";
import { ArticleType } from "@/lib/models/Article";
import LocalTimeWithSettings from "@/components/LocalTimeWithSettings";
import { blurHashToDataURL, isValidBlurHash } from "@/lib/utils/blurhashClient";
type ArticleStatus = "published" | "draft" | "url_only";

// Card layout styled similar to EventCard with skeleton states
const Card = styled.div<{ $skeleton?: boolean; $status?: ArticleStatus }>`
  background-color: ${({ $status }) => {
    if (!$status) return "var(--color-white)";
    let color = "var(--color-white)";
    if ($status === "published")
      color = "color-mix(in srgb, var(--color-white) 90%, var(--button-success-bg))";
    else if ($status === "draft")
      color = "color-mix(in srgb, var(--color-white) 90%, var(--button-warning-bg))";
    else if ($status === "url_only")
      color = "color-mix(in srgb, var(--color-white) 90%, var(--button-secondary-bg))";
    return color;
  }};
  border-radius: 8px;
  transition:
    background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-width: 350px;
  min-width: 275px;
  height: 100%;
  position: relative;
  padding: 0;
  margin: auto;
  border: 1px var(--color-gray-200) solid;
  width: 100%;
  display: flex;
  flex-direction: column;
  ${({ $skeleton }) =>
    !$skeleton &&
    css`
      cursor: pointer;
      &:hover {
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15) !important;
      }
    `}

  [data-view="list"] & {
    flex-direction: row;
    max-width: fit-content;
    width: max-content;
    height: auto;
    min-width: 0;
    align-items: stretch;
    padding: 12px;
    gap: 16px;
    align-items: center;
  }
`;

const shimmer = keyframes`
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
`;

const ImageWrapper = styled.div<{ $skeleton?: boolean }>`
  width: 100%;
  height: 150px;
  position: relative;
  overflow: hidden;
  margin: 0;
  padding: 0;
  flex-shrink: 0;
  img {
    object-fit: cover;
    width: 100%;
    height: 100%;
    display: block;
  }
  ${({ $skeleton }) =>
    $skeleton &&
    css`
      background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
      background-size: 400% 100%;
      animation: ${shimmer} 1.4s ease infinite;
    `}
  /* list view image sizing from ancestor */
  [data-view="list"] & {
    width: 160px;
    height: 160px;
    flex: 0 0 160px;
    border-radius: 8px;
  }
`;

const Content = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: 8px;
  background: transparent;
  margin: 0;
  border-radius: 0 0 32px 32px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100%;

  /* list view content adjustments */
  [data-view="list"] & {
    padding: 8px 0 8px 0;
    border-radius: 0;
    justify-content: flex-start;
    align-items: stretch;
    min-height: 100%;
  }
`;

const Title = styled.h3<{ $skeleton?: boolean }>`
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  transition: color 0.3s ease;
  padding: 0;
  ${({ $skeleton }) =>
    $skeleton &&
    css`
      display: grid;
      gap: 6px;
      -webkit-line-clamp: unset;
      -webkit-box-orient: unset;
      > div {
        height: 22px;
        border-radius: 6px;
        background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
        background-size: 400% 100%;
        animation: ${shimmer} 1.4s ease infinite;
      }
      > div:first-child {
        width: 90%;
      }
      > div:last-child {
        width: 70%;
      }
      color: transparent;

      /* In list view we want a single title line in the skeleton */
      [data-view="list"] & {
        > div:first-child {
          margin-top: 4px;
          width: 70%;
        }
        > div:last-child {
          display: none;
        }
      }
    `}

  @media (max-width: 768px) {
    [data-view="list"] & {
      -webkit-line-clamp: 4;
    }
  }
`;

const Meta = styled.div<{ $skeleton?: boolean }>`
  display: flex;
  color: var(--color-gray-500);
  font-size: 0.9rem;
  margin-top: 2px;
  font-weight: 400;
  transition: color 0.3s ease;
  padding: 0;
  gap: 8px;
  height: 20px;
  align-items: center;
  ${({ $skeleton }) =>
    $skeleton &&
    css`
      display: grid;
      gap: 6px;
      -webkit-line-clamp: unset;
      -webkit-box-orient: unset;
      > div {
        height: 18px;
        border-radius: 6px;
        background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
        background-size: 400% 100%;
        animation: ${shimmer} 1.4s ease infinite;
      }
      color: transparent;
      width: 50%;

      [data-view="list"] & {
        > div {
          width: 30%;
        }
      }
    `}
`;

const Description = styled.div<{ $skeleton?: boolean }>`
  font-size: 0.95rem;
  color: var(--color-gray-600);
  margin: 4px 0 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  ${({ $skeleton }) =>
    $skeleton &&
    css`
      display: grid;
      gap: 6px;
      > div {
        height: 14px;
        border-radius: 6px;
        background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
        background-size: 400% 100%;
        animation: ${shimmer} 1.4s ease infinite;
      }

      > div:first-child {
        margin-top: 12px;
      }

      > div:nth-child(3) {
        width: 60%;
      }
    `}

  @media (max-width: 479px) {
    [data-view="list"] & {
      display: none;
    }
  }
`;

const EnsureWidth = styled.p`
  color: transparent;
  height: 0;
  margin: 0;
`;

const Icon = ({ path }: { path: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="18px"
    viewBox="0 -960 960 960"
    width="18px"
    fill="currentColor"
    aria-hidden
  >
    <path d={path} />
  </svg>
);

type ArticleCardProps = {
  type?: ArticleType;
  article?: LocalizedArticle;
  skeleton?: boolean;
  status?: ArticleStatus;
};

function ArticleCardImpl({ type, article, skeleton, status }: ArticleCardProps) {
  // Decode BlurHash to data URL on the client
  // Use stored dimensions if available, otherwise use card dimensions
  const blurDataURL = useMemo(() => {
    if (!article?.coverImageBlurHash || !isValidBlurHash(article.coverImageBlurHash))
      return undefined;
    const width = article.coverImageWidth || 350;
    const height = article.coverImageHeight || 150;
    return blurHashToDataURL(article.coverImageBlurHash, width, height);
  }, [article?.coverImageBlurHash, article?.coverImageWidth, article?.coverImageHeight]);

  if (!article && !skeleton) return null;
  const href = !skeleton && article ? `/${type}/${article.slug}` : "#";
  const description = article?.excerpt || "";

  return (
    <Card $skeleton={skeleton} $status={status}>
      <ImageWrapper $skeleton={skeleton}>
        {!skeleton && article ? (
          <Link
            href={href}
            aria-label={article.title}
            style={{ display: "block", width: "100%", height: "100%" }}
          >
            <Image
              src={article.coverImage || "/logo/196x196.webp"}
              alt={article.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 350px"
              style={{ objectFit: "cover" }}
              placeholder={blurDataURL ? "blur" : "empty"}
              blurDataURL={blurDataURL}
            />
          </Link>
        ) : null}
      </ImageWrapper>

      <Link
        href={href}
        style={{ textDecoration: "none", pointerEvents: skeleton ? "none" : "auto", width: "100%" }}
        aria-label={article?.title || "Article"}
      >
        <Content>
          <Title $skeleton={skeleton}>
            {skeleton ? (
              <>
                <div />
                <div />
              </>
            ) : (
              article?.title
            )}
          </Title>

          <Meta $skeleton={skeleton}>
            {skeleton ? (
              <div style={{ marginTop: 8 }} />
            ) : article?.publishedAt ? (
              <>
                <Icon path="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Z" />
                <LocalTimeWithSettings
                  iso={new Date(article.publishedAt).toISOString()}
                  dateOnly={true}
                />
              </>
            ) : null}
          </Meta>

          {skeleton ? (
            <Description $skeleton>
              <div />
              <div />
              <div />
              <EnsureWidth>{"⠀ ".repeat(100)}</EnsureWidth>
            </Description>
          ) : (
            <Description>
              {description}
              <EnsureWidth>{"⠀ ".repeat(100)}</EnsureWidth>
            </Description>
          )}
        </Content>
      </Link>
    </Card>
  );
}

export const ArticleCard = memo(ArticleCardImpl);
