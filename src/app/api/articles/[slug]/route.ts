import { NextRequest, NextResponse } from "next/server";
import {
  getArticleById,
  getArticleBySlug,
  selectArticleLocale
} from "@/lib/controllers/articleController";
import type { ArticleType, IArticle } from "@/lib/models/Article";

export async function GET(req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const idOrSlug = (await context.params).slug;
  const { searchParams } = new URL(req.url);
  let type = searchParams.get("type") as ArticleType | null;
  if (type !== "blog" && type !== "newsletter") type = null;

  try {
    let article: IArticle | null = await getArticleBySlug(type, idOrSlug, true);
    if (!article) {
      article = await getArticleById(idOrSlug, true);
    }
    if (!article || (article.status !== "published" && article.status !== "url_only"))
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const locale = req.cookies.get("NEXT_LOCALE")?.value || "";
    return NextResponse.json(selectArticleLocale(article, locale, true));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch article";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
