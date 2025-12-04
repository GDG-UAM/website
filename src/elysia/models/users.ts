import { t } from "elysia";

export const UserMentionData = t.Object({
  id: t.Optional(t.String()),
  name: t.Optional(t.String()),
  image: t.Optional(t.String()),
  isPrivate: t.Optional(t.Boolean())
});

export const PublicUserProfile = t.Object({
  id: t.String(),
  name: t.String(),
  image: t.Optional(t.String()),
  bio: t.Optional(t.String()),
  isPrivate: t.Boolean(),
  role: t.Optional(t.Union([t.Literal("user"), t.Literal("team"), t.Literal("admin")])),
  customTags: t.Optional(
    t.Array(
      t.Union([
        t.Literal("founder"),
        t.Literal("president"),
        t.Literal("vice-president"),
        t.Literal("treasurer"),
        t.Literal("secretary")
      ])
    )
  ),
  socials: t.Object({
    instagram: t.Optional(t.String()),
    linkedin: t.Optional(t.String()),
    github: t.Optional(t.String()),
    x: t.Optional(t.String()),
    website: t.Optional(t.String())
  })
});
