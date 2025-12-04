import { t } from "elysia";

export const AdminUserItem = t.Object({
  _id: t.Any(), // ObjectId
  name: t.String(),
  email: t.String(),
  image: t.Optional(t.String()),
  role: t.Union([t.Literal("user"), t.Literal("team"), t.Literal("admin")]),
  profileHistory: t.Optional(t.Array(t.Any()))
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
