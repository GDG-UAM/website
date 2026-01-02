import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { rateLimit } from "elysia-rate-limit";
import { articlesRoutes } from "./routes/articles";
import { usersRoutes } from "./routes/users";
import { adminRoutes } from "./routes/admin";
import { certificatesRoutes } from "./routes/certificates";
import { contactRoutes } from "./routes/contact";
import { csrfRoutes } from "./routes/csrf";
import { eventsRoutes } from "./routes/events";
import { featureFlagsRoutes } from "./routes/feature-flags";
import { giveawaysRoutes } from "./routes/giveaways";
import { passportRoutes } from "./routes/passport";
import { settingsRoutes } from "./routes/settings";
import { teamRoutes } from "./routes/team";
// import { telemetryRoutes } from "./routes/telemetry";
import { otherRoutes } from "./routes/other";
import { badgesRoutes } from "./routes/badges";
import { createHash } from "crypto";

export const sessionHashGenerator = (request) => {
  const headers = request.headers;
  const cookieString = headers.get("cookie") || "";

  // 1. Identify by Session (Logged in) or CSRF (Guest)
  const sessionToken = cookieString.match(/next-auth\.session-token=([^;]+)/)?.[1];
  const csrfToken = cookieString.match(/next-auth\.csrf-token=([^;]+)/)?.[1];

  const sessionIdentifier = sessionToken || csrfToken || "anonymous";

  // 2. Device Fingerprint (User-Agent + Language)
  // This helps separate different devices on the same WiFi
  const userAgent = headers.get("user-agent") || "no-ua";
  const language = headers.get("accept-language") || "no-lang";

  // 3. Combine and Hash
  // We hash this so the "key" stored in your VPS memory is short and uniform
  const fingerprint = `${sessionIdentifier}-${userAgent}-${language}`;
  return createHash("sha256").update(fingerprint).digest("hex");
};

export const app = new Elysia({ prefix: "/api" })
  .use(cors())
  .use(
    swagger({
      path: "/docs",
      documentation: {
        info: {
          title: "GDG UAM API",
          version: "1.0.0",
          description: "GDG UAM API"
        }
      },
      version: "1.0.0",
      autoDarkMode: false,
      scalarConfig: {
        darkMode: false,
        forceDarkModeState: "light",
        hideDarkModeToggle: true,
        layout: "modern",
        telemetry: false,
        searchHotKey: "f",
        theme: "bluePlanet",
        showDeveloperTools: "never",
        hiddenClients: {
          http: false,
          javascript: false,
          node: false,
          powershell: false,
          shell: false,
          c: true,
          clojure: true,
          csharp: true,
          go: true,
          java: true,
          kotlin: true,
          objc: true,
          ocaml: true,
          php: true,
          python: true,
          r: true,
          ruby: true,
          swift: true,
          // @ts-expect-error definition error, but works properly
          fsharp: true,
          rust: true,
          dart: true
        },
        customCss: "div:has(> a.open-api-client-button) { display: none !important; }"
      }
    })
  )
  // No rate limits (requests without permissions are blocked on edge)
  .use(adminRoutes)
  .use(
    new Elysia()
      // 10 requests per second - Set as 20 / 2s due to many requests on page load
      .use(
        rateLimit({ max: 20, duration: 2000, scoping: "scoped", generator: sessionHashGenerator })
      )
      .use(articlesRoutes)
      .use(usersRoutes)
      .use(certificatesRoutes)
      .use(csrfRoutes)
      .use(eventsRoutes)
      .use(featureFlagsRoutes)
      .use(giveawaysRoutes)
      .use(passportRoutes)
      .use(settingsRoutes)
      .use(teamRoutes)
      // .use(telemetryRoutes)
      .use(badgesRoutes)
      .use(otherRoutes)
  )
  .use(
    new Elysia()
      // 5 emails per minute
      .use(
        rateLimit({ max: 5, duration: 60000, scoping: "scoped", generator: sessionHashGenerator })
      )
      .use(contactRoutes)
  );

export type App = typeof app;
