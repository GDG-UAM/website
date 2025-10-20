import { NextRequest, NextResponse } from "next/server";
import { createLink, listLinks, LinkInput } from "@/lib/controllers/linkController";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyCsrf } from "@/lib/controllers/csrfController";

/**
 * GET /api/admin/links - List all links
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.max(1, Math.min(parseInt(searchParams.get("pageSize") || "50", 10), 100));
    const search = searchParams.get("search") || undefined;
    const activeOnly = searchParams.get("activeOnly") === "true";

    const data = await listLinks({ page, pageSize, search, activeOnly });
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to list links";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * POST /api/admin/links - Create a new link
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string | undefined;
    const token = req.headers.get("x-csrf-token") || "";

    if (!userId || !token || !(await verifyCsrf(token, userId))) {
      return NextResponse.json({ error: "Invalid CSRF" }, { status: 403 });
    }

    const body = (await req.json()) as LinkInput;

    // Validate required fields
    if (!body.slug || !body.destination || !body.title) {
      return NextResponse.json(
        { error: "Missing required fields: slug, destination, title" },
        { status: 400 }
      );
    }

    const created = await createLink(body);
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create link";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
