import { t } from "elysia";
import { AdminTrackItem } from "./tracks";

export const AdminTeamItem = t.Object({
  _id: t.Any(),
  name: t.String(),
  hackathonId: t.Any(),
  trackId: t.Optional(t.Union([t.Any(), AdminTrackItem])),
  password: t.String(),
  projectDescription: t.Optional(t.String()),
  users: t.Array(t.String()),
  createdAt: t.Any(),
  updatedAt: t.Any()
});

export const AdminTeamsListResponse = t.Array(AdminTeamItem);

export const AdminCreateTeamBody = t.Object({
  name: t.String(),
  trackId: t.Optional(t.Nullable(t.String())),
  projectDescription: t.Optional(t.String()),
  users: t.Optional(t.Array(t.String()))
});

export const AdminUpdateTeamBody = t.Partial(AdminCreateTeamBody);
