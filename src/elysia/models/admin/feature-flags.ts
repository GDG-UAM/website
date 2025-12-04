import { t } from "elysia";

export const AdminFeatureFlagItem = t.Object({
  _id: t.Any(), // ObjectId
  key: t.String(),
  environment: t.Union([t.Literal("development"), t.Literal("production")]),
  name: t.String(),
  description: t.Optional(t.String()),
  isActive: t.Boolean(),
  rolloutPercentage: t.Number(),
  targetUsers: t.Array(t.String()),
  excludeUsers: t.Array(t.String()),
  createdBy: t.Any(), // ObjectId or String
  metadata: t.Optional(t.Record(t.String(), t.Any())),
  createdAt: t.Date(),
  updatedAt: t.Date()
});

export const AdminFeatureFlagsListResponse = t.Object({
  items: t.Array(AdminFeatureFlagItem),
  total: t.Number(),
  page: t.Number(),
  pageSize: t.Number()
});

export const AdminCreateFeatureFlagBody = t.Object({
  name: t.String(),
  key: t.String(),
  description: t.Optional(t.String()),
  isActive: t.Optional(t.Boolean()),
  rolloutPercentage: t.Optional(t.Number()),
  targetUsers: t.Optional(t.Array(t.String())),
  excludeUsers: t.Optional(t.Array(t.String())),
  environment: t.Optional(t.Union([t.Literal("development"), t.Literal("production")])),
  metadata: t.Optional(t.Record(t.String(), t.Any()))
});

export const AdminUpdateFeatureFlagBody = t.Object({
  environment: t.Optional(t.Union([t.Literal("development"), t.Literal("production")])),
  name: t.Optional(t.String()),
  description: t.Optional(t.String()),
  isActive: t.Optional(t.Boolean()),
  rolloutPercentage: t.Optional(t.Number()),
  targetUsers: t.Optional(t.Array(t.String())),
  excludeUsers: t.Optional(t.Array(t.String())),
  metadata: t.Optional(t.Record(t.String(), t.Any()))
});
