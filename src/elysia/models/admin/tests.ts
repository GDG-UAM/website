import { t } from "elysia";

export const BlurHashTestBody = t.Object({
  url: t.String()
});

export const BlurHashTestResponse = t.Object({
  blurHash: t.Nullable(t.String()),
  width: t.Nullable(t.Number()),
  height: t.Nullable(t.Number()),
  processingTime: t.Number(),
  success: t.Boolean()
});
