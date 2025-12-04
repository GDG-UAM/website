import { decode } from "blurhash";

export function blurHashToDataURL(
  blurHash: string,
  imageWidth?: number,
  imageHeight?: number
): string {
  try {
    // Calculate aspect ratio from actual image dimensions
    const aspectRatio = imageWidth && imageHeight ? imageWidth / imageHeight : 16 / 9;

    // Decode at a small size for efficiency (the blur filter smooths it out)
    const decodeWidth = 32;
    const decodeHeight = 32;

    // Decode BlurHash to pixel array
    const pixels = decode(blurHash, decodeWidth, decodeHeight);

    // Create SVG with correct aspect ratio
    const svg = createSVGFromPixels(pixels, decodeWidth, decodeHeight, aspectRatio);

    // Use btoa for browser environment
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  } catch (error) {
    console.error("Failed to decode BlurHash:", error);
    return "";
  }
}

function createSVGFromPixels(
  pixels: Uint8ClampedArray,
  decodeWidth: number,
  decodeHeight: number,
  aspectRatio: number
): string {
  // Use a grid that matches the aspect ratio
  // Base resolution on the wider dimension
  let sampleWidth: number;
  let sampleHeight: number;

  if (aspectRatio >= 1) {
    // Landscape or square
    sampleWidth = 16;
    sampleHeight = Math.round(16 / aspectRatio);
  } else {
    // Portrait
    sampleHeight = 16;
    sampleWidth = Math.round(16 * aspectRatio);
  }

  // Ensure minimum of 1
  sampleWidth = Math.max(1, sampleWidth);
  sampleHeight = Math.max(1, sampleHeight);

  const svgPixels: string[] = [];

  for (let y = 0; y < sampleHeight; y++) {
    for (let x = 0; x < sampleWidth; x++) {
      const srcX = Math.floor((x / sampleWidth) * decodeWidth);
      const srcY = Math.floor((y / sampleHeight) * decodeHeight);
      const idx = (srcY * decodeWidth + srcX) * 4;

      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];

      svgPixels.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="rgb(${r},${g},${b})"/>`);
    }
  }

  // Add Gaussian blur filter to smooth out the pixels
  // edgeMode="duplicate" extends edge pixels outward instead of fading to transparent
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 ${sampleWidth} ${sampleHeight}"
      preserveAspectRatio="none">
      <defs>
        <filter id="b" x="0" y="0" width="100%" height="100%">
          <feGaussianBlur stdDeviation="0.5" edgeMode="duplicate"/>
        </filter>
      </defs>

      <rect width="100%" height="100%" fill="rgb(${pixels[0]},${pixels[1]},${pixels[2]})"/>

      <g filter="url(#b)">
        ${svgPixels.join("")}
      </g>
    </svg>`;

  return svg;
}

export function isValidBlurHash(hash: string | undefined | null): hash is string {
  if (!hash || typeof hash !== "string") return false;
  // BlurHash uses base83 encoding and is typically 20-30 chars
  // Minimum is 6 chars (1x1 components), typical is ~20-30
  return hash.length >= 6 && hash.length <= 100;
}
