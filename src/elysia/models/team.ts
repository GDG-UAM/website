import { t } from "elysia";

export const TeamMember = t.Object({
  name: t.String(),
  image: t.Optional(t.String()),
  role: t.Optional(t.Union([t.Literal("user"), t.Literal("team"), t.Literal("admin")])),
  showProfilePublicly: t.Optional(t.Boolean())
});

export const TeamResponse = t.Object({
  organizers: t.Array(TeamMember),
  team: t.Array(TeamMember)
});
