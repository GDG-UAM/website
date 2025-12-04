import { t } from "elysia";

export const LinkItem = t.Object({
  _id: t.Any(), // ObjectId
  slug: t.String(),
  destination: t.String(),
  title: t.String(),
  description: t.Optional(t.String()),
  isActive: t.Boolean(),
  clicks: t.Number(),
  order: t.Optional(t.Number()),
  createdAt: t.Date(),
  updatedAt: t.Date()
});

export const LinkInputBody = t.Object({
  slug: t.String(),
  destination: t.String(),
  title: t.String(),
  description: t.Optional(t.String()),
  isActive: t.Optional(t.Boolean()),
  order: t.Optional(t.Number())
});

export const LinksListResponse = t.Object({
  items: t.Array(LinkItem),
  total: t.Number(),
  page: t.Number(),
  pageSize: t.Number()
});
