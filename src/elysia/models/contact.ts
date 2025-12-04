import { t } from "elysia";

export const ContactFormBody = t.Object({
  type: t.Union([t.Literal("sponsor"), t.Literal("personal")]),
  name: t.String(),
  email: t.String(),
  message: t.String(),
  orgName: t.Optional(t.String()),
  website: t.Optional(t.String())
});
