import { t } from "elysia";

export const AdminEvaluationItem = t.Object({
  _id: t.Any(),
  trackId: t.Any(),
  teamId: t.Any(),
  judgeId: t.Any(),
  scores: t.Record(t.String(), t.Number()),
  notes: t.Optional(t.String()),
  createdAt: t.Any(),
  updatedAt: t.Any()
});

export const AdminEvaluationsListResponse = t.Array(AdminEvaluationItem);

export const AdminSubmitEvaluationBody = t.Object({
  trackId: t.String(),
  teamId: t.String(),
  scores: t.Record(t.String(), t.Number()),
  notes: t.Optional(t.String())
});
