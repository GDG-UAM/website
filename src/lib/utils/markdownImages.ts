import { generateBlurHash } from "./blurhash";

/**
 * Regex to match markdown images: ![alt](url) or ![alt](url "title")
 * Captures: alt text, URL, optional title
 */
const MARKDOWN_IMAGE_REGEX = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g;

/**
 * Regex to match our custom mdimg tags
 * Captures: all attributes as a string
 */
const MDIMG_TAG_REGEX = /<mdimg\s+([^>]*?)\s*\/?>/g;

/**
 * Helper to extract attribute value from attributes string
 */
function extractAttribute(attrs: string, name: string): string | undefined {
  const regex = new RegExp(`${name}\\s*=\\s*"([^"]*)"`, "i");
  const match = regex.exec(attrs);
  return match ? match[1] : undefined;
}

/**
 * Helper to escape special characters for HTML attributes
 */
function escapeAttr(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Helper to unescape HTML attribute values
 */
function unescapeAttr(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/**
 * Check if URL should skip BlurHash generation
 */
function shouldSkipBlurHash(url: string): boolean {
  // Skip data URLs (already inline)
  if (url.startsWith("data:")) return true;
  // Skip SVG images (vectors don't benefit from blur)
  if (url.toLowerCase().endsWith(".svg")) return true;
  // Skip relative URLs that aren't absolute
  if (!url.startsWith("http://") && !url.startsWith("https://")) return true;
  return false;
}

/**
 * Process a single image: fetch and generate BlurHash
 */
async function processImage(
  url: string,
  alt: string,
  title?: string,
  timeout: number = 10000
): Promise<{
  url: string;
  alt: string;
  title?: string;
  blur?: string;
  width?: number;
  height?: number;
}> {
  if (shouldSkipBlurHash(url)) {
    return { url, alt, title };
  }

  try {
    // Add timeout to prevent hanging on slow URLs
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const blurResult = await Promise.race([
      generateBlurHash(url),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("BlurHash generation timeout")), timeout)
      )
    ]);

    clearTimeout(timeoutId);

    if (blurResult) {
      return {
        url,
        alt,
        title,
        blur: blurResult.blurHash,
        width: blurResult.width,
        height: blurResult.height
      };
    }
    return { url, alt, title };
  } catch (error) {
    console.warn(`Failed to generate BlurHash for ${url}:`, error);
    return { url, alt, title };
  }
}

/**
 * Build an mdimg tag from image data
 */
function buildMdimgTag(data: {
  url: string;
  alt: string;
  title?: string;
  blur?: string;
  width?: number;
  height?: number;
}): string {
  let tag = `<mdimg src="${escapeAttr(data.url)}" alt="${escapeAttr(data.alt)}"`;
  if (data.title) {
    tag += ` title="${escapeAttr(data.title)}"`;
  }
  if (data.blur) {
    tag += ` blur="${escapeAttr(data.blur)}"`;
  }
  if (data.width) {
    tag += ` width="${data.width}"`;
  }
  if (data.height) {
    tag += ` height="${data.height}"`;
  }
  tag += ">";
  return tag;
}

/**
 * Process markdown content when saving: convert ![alt](url) to <mdimg> with BlurHash
 *
 * This should be called when saving markdown content (events, articles, etc.)
 * It processes all images in parallel and generates BlurHash for each.
 *
 * @param markdown - Raw markdown content with ![alt](url) syntax
 * @returns Processed markdown with <mdimg> tags containing blur data
 */
export async function processMarkdownSave(markdown: string): Promise<string> {
  if (!markdown) return markdown;

  // Find all markdown images
  const matches: Array<{
    fullMatch: string;
    alt: string;
    url: string;
    title?: string;
    index: number;
  }> = [];

  let match;
  const regex = new RegExp(MARKDOWN_IMAGE_REGEX.source, "g");
  while ((match = regex.exec(markdown)) !== null) {
    matches.push({
      fullMatch: match[0],
      alt: match[1] || "",
      url: match[2],
      title: match[3],
      index: match.index
    });
  }

  if (matches.length === 0) return markdown;

  // Process all images in parallel
  const processedImages = await Promise.allSettled(
    matches.map((m) => processImage(m.url, m.alt, m.title))
  );

  // Build result by replacing matches in reverse order (to preserve indices)
  let result = markdown;
  for (let i = matches.length - 1; i >= 0; i--) {
    const m = matches[i];
    const processed = processedImages[i];

    let replacement: string;
    if (processed.status === "fulfilled") {
      replacement = buildMdimgTag(processed.value);
    } else {
      // If processing failed, keep original but convert to mdimg without blur
      replacement = buildMdimgTag({ url: m.url, alt: m.alt, title: m.title });
    }

    result = result.slice(0, m.index) + replacement + result.slice(m.index + m.fullMatch.length);
  }

  return result;
}

/**
 * Process markdown content for admin editing: convert <mdimg> back to ![alt](url)
 *
 * This should be called when loading markdown for editing in admin panel.
 * It strips BlurHash data and converts back to standard markdown syntax.
 *
 * @param markdown - Stored markdown with <mdimg> tags
 * @returns Clean markdown with ![alt](url) syntax for editing
 */
export function processMarkdownForEdit(markdown: string): string {
  if (!markdown) return markdown;

  return markdown.replace(MDIMG_TAG_REGEX, (_, attrs: string) => {
    const src = extractAttribute(attrs, "src");
    const alt = extractAttribute(attrs, "alt");
    const title = extractAttribute(attrs, "title");

    if (!src) return ""; // Invalid tag, remove it

    const unescapedSrc = unescapeAttr(src);
    const unescapedAlt = alt ? unescapeAttr(alt) : "";
    const unescapedTitle = title ? unescapeAttr(title) : undefined;

    // Build markdown image syntax
    if (unescapedTitle) {
      return `![${unescapedAlt}](${unescapedSrc} "${unescapedTitle}")`;
    }
    return `![${unescapedAlt}](${unescapedSrc})`;
  });
}

/**
 * Regenerate BlurHash for all images in markdown content
 *
 * Useful for admin tools to refresh BlurHash data for existing content.
 *
 * @param markdown - Markdown content (can have either format)
 * @returns Processed markdown with fresh BlurHash data
 */
export async function regenerateBlurHashes(markdown: string): Promise<string> {
  // First convert any mdimg tags back to markdown syntax
  const cleanMarkdown = processMarkdownForEdit(markdown);
  // Then reprocess to generate fresh BlurHash
  return processMarkdownSave(cleanMarkdown);
}

/**
 * Check if markdown contains any images (either format)
 */
export function hasImages(markdown: string): boolean {
  if (!markdown) return false;
  return MARKDOWN_IMAGE_REGEX.test(markdown) || MDIMG_TAG_REGEX.test(markdown);
}

/**
 * Extract all image URLs from markdown (either format)
 */
export function extractImageUrls(markdown: string): string[] {
  if (!markdown) return [];

  const urls: string[] = [];

  // From markdown syntax
  let match;
  const mdRegex = new RegExp(MARKDOWN_IMAGE_REGEX.source, "g");
  while ((match = mdRegex.exec(markdown)) !== null) {
    urls.push(match[2]);
  }

  // From mdimg tags
  const tagRegex = new RegExp(MDIMG_TAG_REGEX.source, "g");
  while ((match = tagRegex.exec(markdown)) !== null) {
    const src = extractAttribute(match[1], "src");
    if (src) urls.push(unescapeAttr(src));
  }

  return [...new Set(urls)]; // Remove duplicates
}
