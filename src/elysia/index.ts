import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { articlesRoutes } from "./routes/articles";
import { usersRoutes } from "./routes/users";
import { adminRoutes } from "./routes/admin";
import { contactRoutes } from "./routes/contact";
import { csrfRoutes } from "./routes/csrf";
import { eventsRoutes } from "./routes/events";
import { featureFlagsRoutes } from "./routes/feature-flags";
import { giveawaysRoutes } from "./routes/giveaways";
import { passportRoutes } from "./routes/passport";
import { settingsRoutes } from "./routes/settings";
import { teamRoutes } from "./routes/team";
import { telemetryRoutes } from "./routes/telemetry";
import { otherRoutes } from "./routes/other";

export const app = new Elysia({ prefix: "/api" })
  .use(cors())
  .use(swagger())
  .use(articlesRoutes)
  .use(usersRoutes)
  .use(adminRoutes)
  .use(contactRoutes)
  .use(csrfRoutes)
  .use(eventsRoutes)
  .use(featureFlagsRoutes)
  .use(giveawaysRoutes)
  .use(passportRoutes)
  .use(settingsRoutes)
  .use(teamRoutes)
  .use(telemetryRoutes)
  .use(otherRoutes)
  .get("/", () => "Hello Elysia");
