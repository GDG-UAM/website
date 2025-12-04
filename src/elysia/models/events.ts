import { t } from "elysia";

export const EventItem = t.Object({
  title: t.String(),
  slug: t.String(),
  description: t.String(),
  date: t.Any(), // Date or string
  location: t.String(),
  image: t.Optional(t.String()),
  url: t.Optional(t.String()),
  markdownContent: t.String(),
  blogUrl: t.Optional(t.String()),
  imageBlurHash: t.Optional(t.Nullable(t.String())),
  imageWidth: t.Optional(t.Number()),
  imageHeight: t.Optional(t.Number())
});

export const EventsListResponse = t.Object({
  items: t.Array(EventItem),
  total: t.Number(),
  page: t.Number(),
  pageSize: t.Number()
});

export const EventDetailResponse = EventItem;
