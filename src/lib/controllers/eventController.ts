import db from "@/lib/db";
import Event, { IEvent, EventStatus, EventDateStatus } from "@/lib/models/Event";
import { toSlug } from "@/lib/utils";
import { generateBlurHash } from "@/lib/utils/blurhash";
import { processMarkdownSave, processMarkdownForEdit } from "@/lib/utils/markdownImages";
import type { FilterQuery, SortOrder } from "mongoose";

// Use shared robust slug function

// Types for the data input when creating/updating an event
export type EventInput = {
  title: string;
  slug?: string;
  description: string;
  date: Date;
  location: string;
  image?: string;
  status?: EventStatus;
  url?: string;
  markdownContent: string;
  blogUrl?: string;
};

export type SortTypes = "newest" | "oldest";

// CRUD Functions

/**
 * Create a new event in the database.
 * Check EventInput for required fields.
 */
export async function createEvent(input: EventInput): Promise<IEvent> {
  await db.connect();
  // Generate a slug from the title or use the provided slug
  const slug = (input.slug && toSlug(input.slug)) || toSlug(input.title);

  // Generate BlurHash and get dimensions if image is provided
  let imageBlurHash: string | null = null;
  let imageWidth: number | undefined;
  let imageHeight: number | undefined;
  if (input.image) {
    const blurResult = await generateBlurHash(input.image);
    if (blurResult) {
      imageBlurHash = blurResult.blurHash;
      imageWidth = blurResult.width;
      imageHeight = blurResult.height;
    }
  }

  // Process markdown content to add BlurHash to embedded images
  const processedMarkdown = await processMarkdownSave(input.markdownContent);

  const event = await Event.create({
    ...input,
    markdownContent: processedMarkdown,
    slug,
    status: input.status || "draft",
    imageBlurHash,
    imageWidth,
    imageHeight
  });
  return event as IEvent;
}

/**
 * Update an existing event by its _ID.
 */
export async function updateEvent(id: string, input: Partial<EventInput>): Promise<IEvent | null> {
  await db.connect();
  // Prepare the update object, ensuring slug is generated if not provided
  const update: Partial<
    EventInput & {
      slug?: string;
      imageBlurHash?: string | null;
      imageWidth?: number;
      imageHeight?: number;
    }
  > = {
    ...input
  };

  // If the title is changed and slug is not provided, generate a new slug
  if (input.title && !input.slug) {
    update.slug = toSlug(input.title);
  } else if (input.slug) {
    update.slug = toSlug(input.slug);
  }

  // Regenerate BlurHash and dimensions if image changed
  if (input.image !== undefined) {
    if (input.image) {
      const blurResult = await generateBlurHash(input.image);
      if (blurResult) {
        update.imageBlurHash = blurResult.blurHash;
        update.imageWidth = blurResult.width;
        update.imageHeight = blurResult.height;
      } else {
        update.imageBlurHash = null;
        update.imageWidth = undefined;
        update.imageHeight = undefined;
      }
    } else {
      update.imageBlurHash = null;
      update.imageWidth = undefined;
      update.imageHeight = undefined;
    }
  }

  // Process markdown content to add BlurHash to embedded images
  if (input.markdownContent !== undefined) {
    update.markdownContent = await processMarkdownSave(input.markdownContent);
  }

  const event = await Event.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  return event as IEvent | null;
}

/**
 * Remove an event by its _ID.
 */
export async function deleteEvent(id: string): Promise<boolean> {
  await db.connect();
  const res = await Event.findByIdAndDelete(id);
  return !!res;
}

/**
 * Get an event by its _ID.
 */
export async function getEventById(
  id: string,
  eventPublished: boolean = false
): Promise<IEvent | null> {
  await db.connect();
  const event = await Event.findById(id).lean();
  if (eventPublished && event && event.status !== "published") {
    return null;
  }
  return event as IEvent | null;
}

/**
 * Get an event by its _ID for editing (converts mdimg back to markdown syntax).
 */
export async function getEventByIdForEdit(id: string): Promise<IEvent | null> {
  await db.connect();
  const event = await Event.findById(id).lean();
  if (!event) return null;

  // Convert mdimg tags back to markdown syntax for editing
  const result = {
    ...event,
    markdownContent: processMarkdownForEdit(event.markdownContent)
  };
  return result as unknown as IEvent;
}

/**
 * Get an event by its slug.
 */
export async function getEventBySlug(
  slug: string,
  eventPublished: boolean = false
): Promise<IEvent | null> {
  await db.connect();
  const event = await Event.findOne({ slug }).lean();
  if (eventPublished && event && event.status !== "published") {
    return null;
  }
  return event as IEvent | null;
}

/**
 * List events with filters, pagination, and sorting.
 */
export async function listEvents(params: {
  status?: EventStatus;
  dateStatus?: EventDateStatus;
  page?: number;
  pageSize?: number;
  sort?: SortTypes;
}): Promise<{
  items: IEvent[];
  total: number;
  page: number;
  pageSize: number;
}> {
  await db.connect();
  // Default pagination and sorting parameters
  const { status, dateStatus, page = 1, pageSize = 10, sort = "newest" } = params || {};

  const filter: FilterQuery<IEvent> = {};
  // Apply status filter if provided
  if (status) {
    // filter by status
    filter.status = status;
  }

  if (dateStatus) {
    // filter by date status
    // The above logic filters events based on their date status (past or upcoming)
    filter.date = dateStatus === "past" ? { $lt: new Date() } : { $gte: new Date() };
  }

  const sortMap: Record<SortTypes, Record<string, SortOrder>> = {
    newest: { date: -1 }, // newest first
    oldest: { date: 1 } // oldest first
  };

  const total = await Event.countDocuments(filter);
  const items = await Event.find(filter)
    .sort(sortMap[sort])
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();

  return { items: items as unknown as IEvent[], total, page, pageSize };
}
