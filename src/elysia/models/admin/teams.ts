import { t } from "elysia";
import { AdminTrackItem } from "./tracks";

export const AdminTeamUser = t.Object({
  id: t.String(),
  name: t.String()
});

export const AdminTeamItem = t.Object({
  _id: t.Any(),
  name: t.String(),
  hackathonId: t.Any(),
  trackId: t.Optional(t.Union([t.Any(), AdminTrackItem])),
  password: t.String(),
  projectDescription: t.Optional(t.String()),
  users: t.Array(AdminTeamUser),
  certificateCount: t.Optional(t.Number()),
  createdAt: t.Any(),
  updatedAt: t.Any()
});

export const AdminTeamsListResponse = t.Object({
  items: t.Array(AdminTeamItem),
  total: t.Number(),
  page: t.Number(),
  pageSize: t.Number()
});

export const AdminCreateTeamBody = t.Object({
  name: t.String(),
  trackId: t.Optional(t.Nullable(t.String())),
  projectDescription: t.Optional(t.String()),
  users: t.Optional(t.Array(AdminTeamUser))
});

export const AdminUpdateTeamBody = t.Partial(AdminCreateTeamBody);
