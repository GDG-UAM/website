import { Elysia } from "elysia";
import { adminArticlesRoutes } from "./articles";
import { adminUsersRoutes } from "./users";
import { adminEventsRoutes } from "./events";
import { adminFeatureFlagsRoutes } from "./feature-flags";
import { adminGiveawaysRoutes } from "./giveaways";
import { adminLinksRoutes } from "./links";
import { adminMarkdownRoutes } from "./markdown";
import { adminTestsRoutes } from "./tests";
import { adminCertificatesRoutes } from "./certificates";
import { adminHackathonsRoutes } from "./hackathons";

export const adminRoutes = new Elysia({ prefix: "/admin" })
  .use(adminArticlesRoutes)
  .use(adminUsersRoutes)
  .use(adminEventsRoutes)
  .use(adminFeatureFlagsRoutes)
  .use(adminGiveawaysRoutes)
  .use(adminLinksRoutes)
  .use(adminMarkdownRoutes)
  .use(adminTestsRoutes)
  .use(adminCertificatesRoutes)
  .use(adminHackathonsRoutes);
