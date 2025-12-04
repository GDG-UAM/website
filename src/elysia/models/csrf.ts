import { t } from "elysia";

export const CsrfTokenResponse = t.Object({
  token: t.String(),
  expiresAt: t.Date()
});
