import { t } from "elysia";

export const AdminRubricItem = t.Object({
  name: t.String(),
  maxScore: t.Number(),
  weight: t.Optional(t.Number())
});

export const AdminTrackItem = t.Object({
  _id: t.String(),
  name: t.String(),
  hackathonId: t.String(),
  judges: t.Optional(t.Array(t.String())),
  rubrics: t.Optional(t.Array(AdminRubricItem)),
  createdAt: t.String(),
  updatedAt: t.String()
});

export const AdminTracksListResponse = t.Array(AdminTrackItem);

export const AdminCreateTrackBody = t.Object({
  name: t.String(),
  judges: t.Optional(t.Array(t.String())),
  rubrics: t.Optional(t.Array(AdminRubricItem))
});

export const AdminUpdateTrackBody = t.Partial(AdminCreateTrackBody);
