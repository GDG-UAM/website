import { Elysia, t } from "elysia";
import { getSession } from "../utils/auth";
import { ingestTelemetryBatch, type IncomingEvent } from "@/lib/controllers/telemetryController";
import { TelemetryBatch } from "../models/telemetry";

export const telemetryRoutes = new Elysia({ prefix: "/telemetry" })
  .derive(async () => {
    const session = await getSession();
    return {
      user: session?.user ?? null,
      session
    };
  })
  .derive(({ set }) => ({
    status: (code: 200 | 401 | 403 | 404 | 500 | 429, response) => {
      set.status = code;
      return response;
    }
  }))
  .post(
    "/",
    async ({ body, user, status }) => {
      try {
        const batch: IncomingEvent[] = Array.isArray(body)
          ? (body as IncomingEvent[])
          : [body as IncomingEvent];

        const rawUser = (user ?? {}) as Record<string, unknown>;
        const userId = typeof rawUser.id === "string" ? rawUser.id : undefined;
        const allowAnon =
          typeof rawUser.allowAnonUsage === "boolean"
            ? rawUser.allowAnonUsage && (rawUser.active as boolean)
            : false;

        const saved = await ingestTelemetryBatch(batch, { userId, allowAnon });
        return status(200, { saved });
      } catch {
        return status(500, { error: "failed" });
      }
    },
    {
      body: TelemetryBatch,
      response: {
        200: t.Object({ saved: t.Number() }),
        500: t.Object({ error: t.String() })
      }
    }
  );
