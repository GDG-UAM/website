import { t } from "elysia";

export const AdminEventItem = t.Object({
  _id: t.Any(), // ObjectId
  title: t.String(),
  slug: t.String(),
  description: t.String(),
  date: t.Date(),
  location: t.String(),
  image: t.Optional(t.String()),
  status: t.Union([t.Literal("draft"), t.Literal("published")]),
  url: t.Optional(t.String()),
  markdownContent: t.String(),
  blogUrl: t.Optional(t.String()),
  imageBlurHash: t.Optional(t.Nullable(t.String())),
  imageWidth: t.Optional(t.Nullable(t.Number())),
  imageHeight: t.Optional(t.Nullable(t.Number())),
  createdAt: t.Date(),
  updatedAt: t.Date()
});

export const AdminEventsListResponse = t.Object({
  items: t.Array(AdminEventItem),
  total: t.Number(),
  page: t.Number(),
  pageSize: t.Number()
});

export const AdminCreateEventBody = t.Object({
  title: t.String(),
  description: t.String(),
  date: t.Union([t.String(), t.Date()]),
  location: t.String(),
  status: t.String(),
  markdownContent: t.Optional(t.String()),
  image: t.Optional(t.String()),
  slug: t.Optional(t.String()),
  url: t.Optional(t.String()),
  blogUrl: t.Optional(t.String())
});

export const AdminUpdateEventBody = t.Partial(AdminCreateEventBody);
