import ArticlePage from "@/components/pages/article/ArticlePage";
import { buildSectionMetadata } from "@/lib/metadata";
import { getArticleBySlug, selectArticleLocale } from "@/lib/controllers/articleController";
import { getLocale } from "next-intl/server";

function isValidSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export async function generateMetadata(context: { params: Promise<{ slug: string }> }) {
  const { slug: raw } = await context.params;
  const slug = decodeURIComponent(raw).trim().toLowerCase();
  if (!isValidSlug(slug)) return buildSectionMetadata("blog");
  const article = await getArticleBySlug("blog", slug, false);
  if (!article) return buildSectionMetadata("blog");
  const locale = await getLocale();
  const localized = selectArticleLocale(article, locale);
  const name = localized.title;
  const description = (localized.excerpt || localized.content || "").slice(0, 160);
  return buildSectionMetadata("blog", name, description);
}

export default function BlogPostPage() {
  return <ArticlePage type="blog" />;
}
