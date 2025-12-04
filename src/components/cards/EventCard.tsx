"use client";

import { useMemo } from "react";
import styled, { css, keyframes } from "styled-components";
import Link from "next/link";
import Image from "next/image";
import LocalTimeWithSettings from "@/components/LocalTimeWithSettings";
import { PublicEvent } from "@/lib/types/events";
import { isUpcoming } from "@/lib/utils/dates";
import { ShareButton } from "@/components/Buttons";
import { blurHashToDataURL, isValidBlurHash } from "@/lib/utils/blurhashClient";

const Card = styled.div<{ $skeleton?: boolean }>`
  background-color: var(--color-white);
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
  cursor: ${({ $skeleton }) => ($skeleton ? "default" : "pointer")};
  position: relative;
  padding: 0;
  margin: auto;
  border: 1px var(--color-gray-200) solid;
  width: 100%;

  ${({ $skeleton }) =>
    !$skeleton &&
    css`
      &:hover {
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15) !important;
      }
    `}
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
  }
  ${({ $skeleton }) =>
    $skeleton &&
    css`
      background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
      background-size: 400% 100%;
      animation: ${shimmer} 1.4s ease infinite;
    `}
`;

const shimmer = keyframes`
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
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
`;

const Title = styled.h3<{ $skeleton?: boolean }>`
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  transition: color 0.3s ease;
  padding: 0;
  overflow: hidden;
  ${({ $skeleton }) =>
    $skeleton &&
    css`
      display: grid;
      grid-template-rows: 1fr 1fr;
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
    `}
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
    `}
`;

const Icon = ({ path }: { path: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="18px"
    viewBox="0 -960 960 960"
    width="18px"
    fill="currentColor"
  >
    <path d={path} />
  </svg>
);

const ShareButtonWrapper = styled.div<{ $iconSize?: number }>`
  position: absolute;
  top: 4px;
  right: 4px;
  width: ${({ $iconSize }) => ($iconSize || 24) * 2}px;
  height: ${({ $iconSize }) => ($iconSize || 24) * 2}px;
  background: var(--color-white);
  border: 2px solid var(--color-gray-300);
  border-radius: 5px;
  z-index: 10;
  padding: 0;
`;

type EventCardProps = {
  event?: PublicEvent;
  skeleton?: boolean;
  onShare?: (e: PublicEvent) => void;
};

export function EventCard({ event, skeleton, onShare }: EventCardProps) {
  const href = !skeleton && event ? event.blogUrl || `/events/${event.slug}` : "#";
  const validBlogUrl = !event?.blogUrl || !event?.blogUrl.startsWith("#");

  // Decode BlurHash to data URL on the client
  // Use card dimensions (350x150) since events don't store image dimensions
  const blurDataURL = useMemo(() => {
    if (!event?.imageBlurHash || !isValidBlurHash(event.imageBlurHash)) return undefined;
    return blurHashToDataURL(event.imageBlurHash, 350, 150);
  }, [event?.imageBlurHash]);

  return (
    <Card $skeleton={skeleton}>
      <ImageWrapper $skeleton={skeleton}>
        {!skeleton && event ? (
          <Link
            href={href}
            aria-label={event.title}
            style={{ display: "block", width: "100%", height: "100%" }}
          >
            <Image
              src={event.image || "/logo/196x196.webp"}
              alt={event.title}
              fill
              sizes="(max-width: 768px) 100vw, 350px"
              style={{ objectFit: "cover" }}
              placeholder={blurDataURL ? "blur" : "empty"}
              blurDataURL={blurDataURL}
            />
          </Link>
        ) : null}
      </ImageWrapper>

      {!skeleton && event && isUpcoming(event.date) && validBlogUrl && (
        <ShareButtonWrapper $iconSize={20}>
          <ShareButton
            onClick={() => onShare?.(event)}
            iconSize={20}
            noBackground
            borderRadius={3.5}
            hasBorder={false}
            aria-label={`Share ${event.title}`}
          />
        </ShareButtonWrapper>
      )}

      <Link
        href={href}
        style={{ textDecoration: "none", pointerEvents: skeleton ? "none" : "auto" }}
        aria-label={event?.title || "Event"}
      >
        <Content>
          <Title $skeleton={skeleton}>
            {skeleton ? (
              <>
                <div />
                <div />
              </>
            ) : (
              event?.title
            )}
          </Title>
          <Meta $skeleton={skeleton}>
            {skeleton ? (
              <div style={{ marginTop: 6, width: "60%" }} />
            ) : (
              <>
                <Icon path="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Z" />
                <LocalTimeWithSettings iso={event!.date} dateOnly={false} />
              </>
            )}
          </Meta>
          <Meta $skeleton={skeleton}>
            {skeleton ? (
              <div style={{ width: "80%" }} />
            ) : (
              <>
                <Icon path="M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 294q122-112 181-203.5T720-552q0-109-69.5-178.5T480-800q-101 0-170.5 69.5T240-552q0 71 59 162.5T480-186Zm0 106Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Zm0-480Z" />
                <span>{event!.location}</span>
              </>
            )}
          </Meta>
        </Content>
      </Link>
    </Card>
  );
}
