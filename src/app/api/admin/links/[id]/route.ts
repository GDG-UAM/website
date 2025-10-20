import { NextRequest, NextResponse } from "next/server";
import { getLinkById, updateLink, deleteLink, LinkInput } from "@/lib/controllers/linkController";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyCsrf } from "@/lib/controllers/csrfController";

/**
 * GET /api/admin/links/[id] - Get a specific link by ID
 */
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const link = await getLinkById((await context.params).id);
    if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(link);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch link";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/links/[id] - Update a link
 */
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string | undefined;
    const token = req.headers.get("x-csrf-token") || "";

    if (!userId || !token || !(await verifyCsrf(token, userId))) {
      return NextResponse.json({ error: "Invalid CSRF" }, { status: 403 });
    }

    const data = (await req.json()) as Partial<LinkInput>;
    const updated = await updateLink((await context.params).id, data);

    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update link";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

/**
 * DELETE /api/admin/links/[id] - Delete a link
 */
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string | undefined;
    const token = req.headers.get("x-csrf-token") || "";

    if (!userId || !token || !(await verifyCsrf(token, userId))) {
      return NextResponse.json({ error: "Invalid CSRF" }, { status: 403 });
    }

    const ok = await deleteLink((await context.params).id);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to delete link";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
