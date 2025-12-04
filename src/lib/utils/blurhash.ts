import { encode } from "blurhash";
import type sharp from "sharp";

// Dynamic import for sharp to avoid loading issues during module initialization
type SharpFn = typeof sharp;
let sharpFn: SharpFn | null = null;

async function getSharp(): Promise<SharpFn> {
  if (!sharpFn) {
    const sharpModule = await import("sharp");
    sharpFn = sharpModule.default;
  }
  return sharpFn;
}

/**
 * Result of BlurHash generation including image dimensions
 */
export interface BlurHashResult {
  /** The raw BlurHash string (compact, ~20-30 chars) */
  blurHash: string;
  /** Original image width in pixels */
  width: number;
  /** Original image height in pixels */
  height: number;
}

/**
 * Generates a BlurHash from a remote image URL.
 * Returns the compact BlurHash string along with original image dimensions.
 * The BlurHash should be decoded on the client for display.
 *
 * @param imageUrl - The URL of the image to generate a BlurHash for
 * @returns The BlurHash result with hash string and dimensions, or null if generation fails
 */
export async function generateBlurHash(imageUrl: string): Promise<BlurHashResult | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Dynamically import sharp to avoid blocking module loading
    const sharp = await getSharp();

    // Get original image dimensions first
    const metadata = await sharp(buffer).metadata();
    const originalWidth = metadata.width || 0;
    const originalHeight = metadata.height || 0;

    // Resize to small dimensions for faster encoding
    // Using 32x32 as a good balance between quality and performance
    const { data, info } = await sharp(buffer)
      .resize(32, 32, { fit: "inside" })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Encode with 4x3 components (good balance of detail vs string length)
    const blurHash = encode(new Uint8ClampedArray(data), info.width, info.height, 4, 3);

    return {
      blurHash,
      width: originalWidth,
      height: originalHeight
    };
  } catch (error) {
    console.error("Failed to generate BlurHash:", error);
    return null;
  }
}

/**
 * Checks if a BlurHash needs to be regenerated based on image URL change.
 *
 * @param oldImage - The previous image URL
 * @param newImage - The new image URL
 * @returns true if the BlurHash should be regenerated
 */
export function shouldRegenerateBlurHash(
  oldImage: string | undefined,
  newImage: string | undefined
): boolean {
  // If no new image, no need to generate
  if (!newImage) return false;
  // If image changed, regenerate
  return oldImage !== newImage;
}
