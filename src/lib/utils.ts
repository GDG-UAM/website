// Slug utilities and other helpers

/**
 * Convert a string to a URL-friendly slug.
 * - Lowercases
 * - Removes diacritics (áéíóú ñ ç …)
 * - Replaces non-alphanumeric runs with a single hyphen
 * - Trims leading/trailing hyphens
 */
export function toSlug(input: string): string {
  if (!input) return "";
  return (
    input
      .toString()
      // Normalize and remove diacritics
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      // Lowercase and trim
      .toLowerCase()
      .trim()
      // Replace any non-alphanumeric (a-z0-9) with hyphens
      .replace(/[^a-z0-9]+/g, "-")
      // Collapse multiple hyphens
      .replace(/-+/g, "-")
      // Trim leading/trailing hyphens
      .replace(/^-+|-+$/g, "")
  );
}
