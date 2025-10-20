"use client";

import React, { PropsWithChildren } from "react";

interface StampProps {
  seed: number;
  width?: number | string;
  height?: number | string;
  viewBox?: string;
  style?: React.CSSProperties;
}

function Stamp({
  seed,
  width = 600,
  height = 600,
  viewBox = "0 0 512 512",
  style,
  children
}: PropsWithChildren<StampProps>) {
  const filterId = React.useId().replace(/:/g, "") + `-inkstamp-${seed}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      role="img"
      aria-label="Stamp"
    >
      <filter id={filterId}>
        {/* Layer 0 - coarse paper roughness */}
        <feTurbulence
          type="fractalNoise"
          baseFrequency={0.8}
          numOctaves={3}
          seed={seed}
          result="noise"
        />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale={6} result="roughened" />

        {/* Layer 1 - ink density variation */}
        <feTurbulence
          type="fractalNoise"
          baseFrequency={0.9}
          numOctaves={4}
          seed={seed + 1}
          result="inkNoise"
        />
        <feColorMatrix
          in="inkNoise"
          type="matrix"
          values="0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 3 -0.2"
          result="mask"
        />
        <feComposite in="roughened" in2="mask" operator="in" result="patchy" />

        {/* Layer 2 - big blob transparency */}
        <feTurbulence
          type="fractalNoise"
          baseFrequency={0.001}
          numOctaves={200}
          seed={seed + 2}
          result="blobNoise"
        />
        <feColorMatrix
          in="blobNoise"
          type="matrix"
          values="0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 4 -0.5"
          result="blobMask"
        />
        <feComposite in="patchy" in2="blobMask" operator="in" result="withBlobs" />

        <feGaussianBlur in="withBlobs" stdDeviation={0.8} />
      </filter>
      <g filter={`url(#${filterId})`}>{children}</g>
    </svg>
  );
}

export default Stamp;
