import { NextRequest, NextResponse } from "next/server";
import {
  deleteArticle,
  getArticleById,
  getArticleBySlug,
  updateArticle,
  selectArticleLocale
} from "@/lib/controllers/articleController";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyCsrf } from "@/lib/controllers/csrfController";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const url = new URL(req.url);
    const fullParam = (url.searchParams.get("full") ?? "false").toLowerCase();
    const full = fullParam === "1" || fullParam === "true" || fullParam === "yes";

    const locale = req.cookies.get("NEXT_LANG")?.value;

    try {
      const article = await getArticleById((await context.params).id);
      if (article) {
        return full
          ? NextResponse.json(article)
          : NextResponse.json(selectArticleLocale(article, locale || ""));
      }
    } catch {}

    const article = await getArticleBySlug(null, (await context.params).id, false);
    if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return full
      ? NextResponse.json(article)
      : NextResponse.json(selectArticleLocale(article, locale || ""));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string | undefined;
    const token = req.headers.get("x-csrf-token") || "";
    if (!userId || !token || !(await verifyCsrf(token, userId))) {
      return NextResponse.json({ error: "Invalid CSRF" }, { status: 403 });
    }
    const data = await req.json();
    const updated = await updateArticle((await context.params).id, data);
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string | undefined;
    const token = req.headers.get("x-csrf-token") || "";
    if (!userId || !token || !(await verifyCsrf(token, userId))) {
      return NextResponse.json({ error: "Invalid CSRF" }, { status: 403 });
    }
    const ok = await deleteArticle((await context.params).id);
    return NextResponse.json({ success: ok });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to delete";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
