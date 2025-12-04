import { t } from "elysia";

export const AdminArticleItem = t.Object({
  _id: t.Any(), // ObjectId
  type: t.Union([t.Literal("newsletter"), t.Literal("blog")]),
  title: t.Record(t.String(), t.String()),
  slug: t.String(),
  excerpt: t.Optional(t.Record(t.String(), t.String())),
  content: t.Record(t.String(), t.String()),
  coverImage: t.Optional(t.String()),
  status: t.Union([t.Literal("draft"), t.Literal("published")]),
  authors: t.Array(t.String()),
  publishedAt: t.Optional(t.Nullable(t.Date())),
  views: t.Number(),
  coverImageBlurHash: t.Optional(t.Nullable(t.String())),
  coverImageWidth: t.Optional(t.Nullable(t.Number())),
  coverImageHeight: t.Optional(t.Nullable(t.Number())),
  createdAt: t.Date(),
  updatedAt: t.Date()
});

export const AdminArticlesListResponse = t.Object({
  items: t.Array(AdminArticleItem),
  total: t.Number(),
  page: t.Number(),
  pageSize: t.Number()
});

export const AdminCreateArticleBody = t.Object({
  title: t.Any(), // LocalizedStringMap
  content: t.Any(), // LocalizedStringMap
  type: t.Union([t.Literal("newsletter"), t.Literal("blog")]),
  status: t.Optional(t.String()),
  slug: t.Optional(t.String()),
  excerpt: t.Optional(t.Any()),
  coverImage: t.Optional(t.String()),
  authors: t.Optional(t.Array(t.String())),
  publishedAt: t.Optional(t.Union([t.String(), t.Date()]))
});

export const AdminUpdateArticleBody = t.Partial(AdminCreateArticleBody);

export const AdminArticleDetailResponse = t.Union([
  AdminArticleItem,
  t.Object({
    title: t.String(),
    excerpt: t.Optional(t.String()),
    content: t.String(),
    slug: t.String(),
    coverImage: t.Optional(t.String()),
    authors: t.Array(t.Any()),
    publishedAt: t.Optional(t.Nullable(t.Date()))
    // ... other localized fields
  })
]);
