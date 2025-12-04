import { t } from "elysia";

export const AdminUserItem = t.Object({
  _id: t.Any(), // ObjectId
  id: t.String(),
  name: t.String(),
  email: t.String(),
  image: t.Optional(t.String()),
  role: t.Union([t.Literal("user"), t.Literal("team"), t.Literal("admin")]),
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

export const AdminUsersListResponse = t.Object({
  items: t.Array(AdminUserItem),
  total: t.Number(),
  page: t.Number(),
  pageSize: t.Number()
});

export const AdminUpdateUserRoleBody = t.Object({
  id: t.String(),
  role: t.Union([t.Literal("user"), t.Literal("team"), t.Literal("admin")])
});
