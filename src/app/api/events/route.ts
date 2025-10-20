import { NextRequest, NextResponse } from "next/server";
import { listEvents, SortTypes } from "@/lib/controllers/eventController";
import { EventDateStatus, EventStatus } from "@/lib/models/Event";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status: EventStatus = "published";
  const dateStatus: EventDateStatus =
    searchParams.get("dateStatus") === "past" ? "past" : "upcoming";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.max(1, Math.min(parseInt(searchParams.get("pageSize") || "10", 10), 100));
  const sort: SortTypes = searchParams.get("sort") === "oldest" ? "oldest" : "newest";

  try {
    const data = await listEvents({ status, dateStatus, page, pageSize, sort });

    if (data && Array.isArray(data.items)) {
      const items = data.items.map((item) => {
        if (item && typeof item === "object") {
          const obj = { ...(item as unknown as Record<string, unknown>) };
          delete obj.__v;
          delete obj._id;
          delete obj.status;
          delete obj.createdAt;
          delete obj.updatedAt;
          return obj;
        }
        return item;
      });
      const response = { ...data, items };
      return NextResponse.json(response);
    }
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to list events";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
