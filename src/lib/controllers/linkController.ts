import db from "@/lib/db";
import Link, { ILink } from "@/lib/models/Link";
import { toSlug } from "@/lib/utils";

// Types for the data input when creating/updating a link
export type LinkInput = {
  slug: string;
  destination: string;
  title: string;
  description?: string;
  isActive?: boolean;
};

/**
 * Create a new link in the database.
 */
export async function createLink(input: LinkInput): Promise<ILink> {
  await db.connect();
  // Normalize slug
  const slug = toSlug(input.slug);
  const link = await Link.create({
    ...input,
    slug,
    isActive: input.isActive ?? true
  });
  return link;
}

/**
 * Update an existing link by its _ID.
 */
export async function updateLink(id: string, input: Partial<LinkInput>): Promise<ILink | null> {
  await db.connect();
  const update: Partial<LinkInput & { slug?: string }> = { ...input };

  // Normalize slug if provided
  if (input.slug) {
    update.slug = toSlug(input.slug);
  }

  const link = await Link.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  return link;
}

/**
 * Remove a link by its _ID.
 */
export async function deleteLink(id: string): Promise<boolean> {
  await db.connect();
  const res = await Link.findByIdAndDelete(id);
  return !!res;
}

/**
 * Get a link by its _ID.
 */
export async function getLinkById(id: string): Promise<ILink | null> {
  await db.connect();
  const link = await Link.findById(id).lean();
  return link as ILink | null;
}

/**
 * Get a link by its slug.
 */
export async function getLinkBySlug(slug: string): Promise<ILink | null> {
  await db.connect();
  const normalizedSlug = toSlug(slug);
  const link = await Link.findOne({ slug: normalizedSlug }).lean();
  return link as ILink | null;
}

/**
 * Increment click count for a link.
 */
export async function incrementLinkClicks(slug: string): Promise<void> {
  await db.connect();
  const normalizedSlug = toSlug(slug);
  await Link.findOneAndUpdate({ slug: normalizedSlug }, { $inc: { clicks: 1 } });
}

/**
 * List all links with pagination and search.
 */
export async function listLinks(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  activeOnly?: boolean;
}): Promise<{
  items: ILink[];
  total: number;
  page: number;
  pageSize: number;
}> {
  await db.connect();
  const { page = 1, pageSize = 50, search, activeOnly } = params || {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: any = {};

  if (activeOnly) {
    filter.isActive = true;
  }

  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), "i");
    filter.$or = [
      { slug: searchRegex },
      { title: searchRegex },
      { destination: searchRegex },
      { description: searchRegex }
    ];
  }

  const total = await Link.countDocuments(filter);
  const items = await Link.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();

  return { items: items as unknown as ILink[], total, page, pageSize };
}
