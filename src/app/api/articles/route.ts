import { NextRequest, NextResponse } from "next/server";
import { listArticles, SortTypes, selectArticleLocale } from "@/lib/controllers/articleController";
import type { ArticleType } from "@/lib/models/Article";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type: ArticleType = searchParams.get("type") === "newsletter" ? "newsletter" : "blog";
  const status = "published";
  const search = searchParams.get("q") || undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.max(1, Math.min(parseInt(searchParams.get("pageSize") || "10", 10), 100));
  const sortParam = searchParams.get("sort");
  const sort: SortTypes =
    sortParam === "newest" || sortParam === "oldest" || sortParam === "views"
      ? (sortParam as SortTypes)
      : "newest";

  try {
    const data = await listArticles({
      type,
      status,
      search,
      page,
      pageSize,
      sort,
      onlyPublished: true,
      includeContentInSearch: true
    });
    const locale = req.cookies.get("NEXT_LOCALE")?.value || "";
    return NextResponse.json(data.items.map((item) => selectArticleLocale(item, locale, true)));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to list articles";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
