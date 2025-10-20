import { NextRequest, NextResponse } from "next/server";
import {
  createArticle,
  listArticles,
  selectArticleLocale
} from "@/lib/controllers/articleController";
import type { ArticleInput, SortTypes } from "@/lib/controllers/articleController";
import type { ArticleType, ArticleStatus } from "@/lib/models/Article";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyCsrf } from "@/lib/controllers/csrfController";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type: ArticleType = searchParams.get("type") === "newsletter" ? "newsletter" : "blog";
  const statusParam = searchParams.get("status");
  const status: ArticleStatus | undefined =
    statusParam === "draft" ||
    statusParam === "published" ||
    (statusParam === "url_only" && type === "blog")
      ? (statusParam as ArticleStatus)
      : undefined;
  const search = searchParams.get("q") || undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.max(1, Math.min(parseInt(searchParams.get("pageSize") || "10", 10), 100));
  const sortParam = searchParams.get("sort");
  const sort: SortTypes =
    sortParam === "newest" || sortParam === "oldest" || sortParam === "views"
      ? (sortParam as SortTypes)
      : "newest";
  const onlyPublished = searchParams.get("onlyPublished") === "true";
  const includeContentInSearch = searchParams.get("includeContentInSearch") === "true";
  const full = searchParams.get("full") === "true";

  try {
    const data = await listArticles({
      type,
      status,
      search,
      page,
      pageSize,
      sort,
      onlyPublished,
      includeContentInSearch
    });
    if (full) {
      return NextResponse.json(data);
    }
    const locale = req.cookies.get("NEXT_LANG")?.value || "";
    return NextResponse.json(data.items.map((item) => selectArticleLocale(item, locale, false)));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to list articles";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string | undefined;
    const token = req.headers.get("x-csrf-token") || "";
    if (!userId || !token || !(await verifyCsrf(token, userId))) {
      return NextResponse.json({ error: "Invalid CSRF" }, { status: 403 });
    }
    const body = (await req.json()) as ArticleInput;
    const created = await createArticle(body);
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : "Failed to create article";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
