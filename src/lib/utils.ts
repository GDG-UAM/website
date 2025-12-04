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

/**
 * Recursively convert Maps and ObjectIds to plain objects/strings for JSON serialization.
 * This is needed because Mongoose Map fields and ObjectIds don't serialize to JSON properly.
 *
 * @param obj - The object to convert
 * @returns The object with all Maps converted to plain objects and ObjectIds to strings
 */
export function mapsToObjects<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  // Handle MongoDB ObjectId (has _bsontype or buffer property and toString method)
  if (
    typeof obj === "object" &&
    obj !== null &&
    ("_bsontype" in obj || "buffer" in obj) &&
    typeof (obj as { toString?: () => string }).toString === "function"
  ) {
    return (obj as { toString: () => string }).toString() as T;
  }

  // Handle Date objects - keep as-is
  if (obj instanceof Date) {
    return obj;
  }

  // Handle Map instances
  if (obj instanceof Map) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of obj.entries()) {
      result[key] = mapsToObjects(value);
    }
    return result as T;
  }

  // Handle Arrays
  if (Array.isArray(obj)) {
    return obj.map(mapsToObjects) as T;
  }

  // Handle plain objects
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = mapsToObjects(value);
    }
    return result as T;
  }

  return obj;
}
