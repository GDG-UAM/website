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

const ImageContainer = styled.span<{ $aspectRatio?: string }>`
  display: block;
  position: relative;
  width: 100%;
  margin: 1em 0;
  ${({ $aspectRatio }) => $aspectRatio && `aspect-ratio: ${$aspectRatio};`}

  /* Maintain aspect ratio container */
  &[data-loaded="false"] {
    min-height: 200px;
    background: var(--markdown-code-bg, #f3f4f6);
    border-radius: 6px;
  }
`;

const StyledImage = styled(Image)`
  border-radius: 6px;
  object-fit: contain;
  width: 100%;
  height: auto;
`;

const FallbackImage = styled.img`
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  display: block;
  margin: 1em 0;
`;

/**
 * MarkdownImage component - renders images from markdown with BlurHash placeholder
 *
 * Uses Next/Image for optimized loading with blur placeholder when available.
 * Falls back to regular img tag if Next/Image fails or for incompatible sources.
 */
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

  // Use provided dimensions or defaults
  const imgWidth = width || 800;
  const imgHeight = height || 600;

  // Decode BlurHash to data URL on the client, passing dimensions for correct aspect ratio
  const blurDataURL = useMemo(() => {
    if (!isValidBlurHash(blur)) return undefined;
    return blurHashToDataURL(blur, imgWidth, imgHeight);
  }, [blur, imgWidth, imgHeight]);

  // If we had an error with Next/Image, fall back to regular img
  if (error) {
    return <FallbackImage src={src} alt={alt} title={title} loading="lazy" />;
  }

  // Check if we have a valid blur data URL
  const hasBlur = !!blurDataURL;

  // Calculate aspect ratio for the container to prevent layout shift
  const aspectRatio = width && height ? `${width} / ${height}` : undefined;

  return (
    <ImageContainer data-loaded={loaded} $aspectRatio={aspectRatio}>
      <StyledImage
        src={src}
        alt={alt}
        title={title}
        width={imgWidth}
        height={imgHeight}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px"
        placeholder={hasBlur ? "blur" : "empty"}
        blurDataURL={blurDataURL}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        style={{
          width: "100%",
          height: "auto"
        }}
      />
    </ImageContainer>
  );
}
