import { t } from "elysia";

export const ArticleItem = t.Object({
  title: t.String(),
  slug: t.String(),
  excerpt: t.Optional(t.String()),
  content: t.String(),
  coverImage: t.Optional(t.String()),
  authors: t.Array(t.Any()),
  publishedAt: t.Optional(t.Any()), // Date or string
  coverImageBlurHash: t.Optional(t.Nullable(t.String())),
  coverImageWidth: t.Optional(t.Number()),
  coverImageHeight: t.Optional(t.Number())
});

export const ArticleList = t.Array(ArticleItem);
