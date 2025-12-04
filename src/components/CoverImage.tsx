"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { blurHashToDataURL, isValidBlurHash } from "@/lib/utils/blurhashClient";

type CoverImageProps = {
  src: string;
  alt: string;
  blurHash?: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
};

export default function CoverImage({ src, alt, blurHash, width, height, style }: CoverImageProps) {
  const [loaded, setLoaded] = useState(false);

  const imgWidth = width || 1200;
  const imgHeight = height || 675;

  const blurDataURL = useMemo(() => {
    if (!isValidBlurHash(blurHash)) return undefined;
    return blurHashToDataURL(blurHash, imgWidth, imgHeight);
  }, [blurHash, imgWidth, imgHeight]);

  const hasBlur = !!blurDataURL;

  return (
    <div
      style={{
        position: "relative",
        width: imgWidth,
        height: imgHeight,
        overflow: "hidden",
        ...style
      }}
    >
      {hasBlur && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${blurDataURL})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            transition: "opacity .25s ease",
            opacity: loaded ? 0 : 1
          }}
        />
      )}

      <Image
        src={src}
        alt={alt}
        width={imgWidth}
        height={imgHeight}
        placeholder="empty"
        onLoadingComplete={() => setLoaded(true)}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: loaded ? 1 : 0,
          transition: "opacity .25s ease"
        }}
      />
    </div>
  );
}
