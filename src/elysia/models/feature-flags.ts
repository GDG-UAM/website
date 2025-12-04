import { t } from "elysia";

export const FeatureFlagItem = t.Object({
  key: t.String(),
  environment: t.Union([t.Literal("development"), t.Literal("production")]),
  name: t.Optional(t.String()),
  description: t.Optional(t.String()),
  isActive: t.Optional(t.Boolean()),
  rolloutPercentage: t.Optional(t.Number()),
  metadata: t.Optional(t.Record(t.String(), t.Any()))
});

export const FeatureFlagsResponse = t.Object({
  items: t.Array(FeatureFlagItem)
});

export const FeatureFlagExportItem = t.Object({
  _id: t.Object({ $oid: t.String() }),
  name: t.String(),
  key: t.String(),
  description: t.Optional(t.String()),
  isActive: t.Boolean(),
  rolloutPercentage: t.Number(),
  targetUsers: t.Array(t.Object({ $oid: t.String() })),
  excludeUsers: t.Array(t.Object({ $oid: t.String() })),
  environment: t.Union([t.Literal("development"), t.Literal("production")]),
  createdBy: t.Object({ $oid: t.String() }),
  metadata: t.Optional(t.Record(t.String(), t.Any())),
  createdAt: t.Object({ $date: t.String() }),
  updatedAt: t.Object({ $date: t.String() })
});

export const FeatureFlagsExportResponse = t.Object({
  items: t.Array(FeatureFlagExportItem)
});
