"use client";

import Image from "next/image";
import { useState, useMemo } from "react";
import styled from "styled-components";
import { blurHashToDataURL, isValidBlurHash } from "@/lib/utils/blurhashClient";

type MarkdownImageProps = {
  src: string;
  alt: string;
  title?: string;
  blur?: string;
  width?: number;
  height?: number;
};

const Container = styled.span<{ $aspectRatio?: string }>`
  display: block;
  position: relative;
  width: 100%;
  margin: 1em 0;
  border-radius: 6px;
  overflow: hidden;

  ${({ $aspectRatio }) =>
    $aspectRatio &&
    `
    aspect-ratio: ${$aspectRatio};
  `}
`;

const BlurLayer = styled.div`
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  border-radius: inherit;
  transition: opacity 0.4s ease;
  z-index: 0;
`;

const ImgLayer = styled(Image)`
  position: absolute !important;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: inherit;
  transition: opacity 0.4s ease;
  z-index: 1;
`;

export default function MarkdownImage({
  src,
  alt,
  title,
  blur,
  width,
  height
}: MarkdownImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const imgWidth = width || 800;
  const imgHeight = height || 600;

  const blurDataURL = useMemo(() => {
    if (!isValidBlurHash(blur)) return undefined;
    return blurHashToDataURL(blur, imgWidth, imgHeight);
  }, [blur, imgWidth, imgHeight]);

  if (error) {
    return (
      <Image
        src={src}
        alt={alt}
        title={title}
        style={{ maxWidth: "100%", borderRadius: 6 }}
        loading="lazy"
      />
    );
  }

  const hasBlur = !!blurDataURL;
  const aspectRatio = width && height ? `${width} / ${height}` : undefined;

  return (
    <Container $aspectRatio={aspectRatio}>
      {hasBlur && (
        <BlurLayer
          style={{
            backgroundImage: `url(${blurDataURL})`,
            opacity: loaded ? 0 : 1
          }}
        />
      )}

      <ImgLayer
        src={src}
        alt={alt}
        title={title}
        width={imgWidth}
        height={imgHeight}
        placeholder="empty"
        onLoadingComplete={() => setLoaded(true)}
        onError={() => setError(true)}
        style={{
          opacity: loaded ? 1 : 0
        }}
      />
    </Container>
  );
}
