"use client";

import Image from "next/image";
import { useMemo } from "react";
import { blurHashToDataURL, isValidBlurHash } from "@/lib/utils/blurhashClient";

type CoverImageProps = {
  src: string;
  alt: string;
  blurHash?: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
};

/**
 * CoverImage component - renders cover images with BlurHash placeholder
 * Decodes BlurHash on the client side for efficient data transfer
 */
export default function CoverImage({ src, alt, blurHash, width, height, style }: CoverImageProps) {
  // Decode BlurHash to data URL on the client, passing dimensions for correct aspect ratio
  const blurDataURL = useMemo(() => {
    if (!isValidBlurHash(blurHash)) return undefined;
    return blurHashToDataURL(blurHash, width, height);
  }, [blurHash, width, height]);

  return (
    <Image
      src={src}
      alt={alt}
      width={width || 1200}
      height={height || 675}
      placeholder={blurDataURL ? "blur" : "empty"}
      blurDataURL={blurDataURL}
      style={style}
    />
  );
}
