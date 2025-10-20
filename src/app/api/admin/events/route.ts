import { NextRequest, NextResponse } from "next/server";
import { createEvent, listEvents, EventInput, SortTypes } from "@/lib/controllers/eventController";
import { EventStatus } from "@/lib/models/Event";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyCsrf } from "@/lib/controllers/csrfController";

// Get a list of all events for the admin panel
export async function GET(req: NextRequest) {
  // Search the filter params in the URL
  const { searchParams } = new URL(req.url);
  // Get the filter values
  const status: EventStatus = searchParams.get("status") === "draft" ? "draft" : "published";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.max(1, Math.min(parseInt(searchParams.get("pageSize") || "10", 10), 100));
  const sort: SortTypes = searchParams.get("sort") === "oldest" ? "oldest" : "newest";

  try {
    // List events with the specified filters
    const data = await listEvents({ status, page, pageSize, sort });
    return NextResponse.json(data); // Return the list of events
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to list events";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Create a new event
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string | undefined;
    const token = req.headers.get("x-csrf-token") || "";
    if (!userId || !token || !(await verifyCsrf(token, userId))) {
      return NextResponse.json({ error: "Invalid CSRF" }, { status: 403 });
    }
    const raw = (await req.json()) as Partial<EventInput>;
    const body: EventInput = {
      ...raw,
      markdownContent: raw.markdownContent ?? "",
      // Ensure required fields are present at runtime; TypeScript enforces at compile time elsewhere
      title: raw.title || "",
      description: raw.description || "",
      date: raw.date instanceof Date ? raw.date : new Date(String(raw.date)),
      location: raw.location || "",
      status: raw.status,
      image: raw.image,
      slug: raw.slug,
      url: raw.url,
      blogUrl: raw.blogUrl
    } as EventInput;
    const created = await createEvent(body); // Create the event with the provided data
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create event";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
