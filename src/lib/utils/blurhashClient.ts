import { decode } from "blurhash";

/**
 * Client-side BlurHash decoder
 * Converts a compact BlurHash string to a data URL for use as a placeholder
 */

/**
 * Converts a BlurHash string to a base64 SVG data URL.
 * This runs on the client to decode the compact BlurHash into a visual placeholder.
 *
 * @param blurHash - The BlurHash string (typically ~20-30 characters)
 * @param imageWidth - Actual image width (used for aspect ratio)
 * @param imageHeight - Actual image height (used for aspect ratio)
 * @returns A base64 SVG data URL string
 */
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

/**
 * Creates an SVG from RGBA pixel data with blur filter.
 * Uses actual aspect ratio to prevent layout shifts.
 */
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
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sampleWidth} ${sampleHeight}" preserveAspectRatio="none"><defs><filter id="b" x="0" y="0" width="100%" height="100%"><feGaussianBlur stdDeviation="0.5" edgeMode="duplicate"/></filter></defs><g filter="url(#b)">${svgPixels.join("")}</g></svg>`;

  return svg;
}

/**
 * Validates if a string is a valid BlurHash
 * BlurHash strings are typically 20-30 characters of base83 encoding
 */
export function isValidBlurHash(hash: string | undefined | null): hash is string {
  if (!hash || typeof hash !== "string") return false;
  // BlurHash uses base83 encoding and is typically 20-30 chars
  // Minimum is 6 chars (1x1 components), typical is ~20-30
  return hash.length >= 6 && hash.length <= 100;
}
