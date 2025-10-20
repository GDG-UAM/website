import { NextRequest, NextResponse } from "next/server";
import { getEventBySlug } from "@/lib/controllers/eventController";

// Cache public event responses for short periods
export const revalidate = 60; // seconds

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  // Public endpoint: only allow lookup by slug (not by MongoDB _id)
  const raw = (await context.params).id;
  const slug = decodeURIComponent(raw || "")
    .trim()
    .toLowerCase();
  // Basic slug validation: lowercase alphanumerics and hyphens, no leading/trailing hyphen
  const isValidSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  if (!isValidSlug) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  try {
    const event = await getEventBySlug(slug, true);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch event";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
