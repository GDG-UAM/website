import { NextRequest, NextResponse } from "next/server";
import { getLinkBySlug, incrementLinkClicks } from "@/lib/controllers/linkController";

/**
 * Public route for link redirects
 * GET /link/[...slug] - Redirect to destination if link exists and is active
 */
export async function GET(req: NextRequest, context: { params: Promise<{ slug: string[] }> }) {
  try {
    const params = await context.params;
    const slug = params.slug?.join("/") || "";

    if (!slug) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const link = await getLinkBySlug(slug);

    if (!link) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
      //   return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    if (!link.isActive) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
      //   return NextResponse.json({ error: "Link is not active" }, { status: 404 });
    }

    // Increment click count asynchronously (don't wait for it)
    incrementLinkClicks(slug).catch((err) => {
      console.error("Failed to increment clicks:", err);
    });

    // Return redirect response
    return NextResponse.redirect(link.destination, { status: 302 });
  } catch (e) {
    console.error("Link redirect error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
