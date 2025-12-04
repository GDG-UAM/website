import { Elysia, t } from "elysia";
import { getSession } from "../utils/auth";
import {
  deleteUserAccount,
  getPublicUserProfile,
  getUserMentionData
} from "@/lib/controllers/userController";
import { buildUserDataExport } from "@/lib/controllers/dataExportController";
import { trackServerEvent } from "@/lib/controllers/telemetryController";
import { verifyCsrf } from "@/lib/controllers/csrfController";
import { PublicUserProfile, UserMentionData } from "../models/users";

export const usersRoutes = new Elysia({ prefix: "/users" })
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
  .delete(
    "/",
    async ({ request, user, headers, status }) => {
      if (!user?.id) return status(401, { error: "Unauthorized" });

      const token = headers["x-csrf-token"];
      if (!token || !(await verifyCsrf(token, user.id)))
        return status(403, { error: "Invalid CSRF" });

      try {
        // Best-effort telemetry audit
        try {
          await trackServerEvent({
            reqHeaders: request.headers,
            userId: user.id,
            allowAnon: Boolean((user as unknown as { allowAnonUsage?: boolean })?.allowAnonUsage),
            eventType: "account_delete",
            path: "/api/users",
            domain: new URL(request.url).hostname,
            referrer: request.headers.get("referer") || undefined,
            props: { event_props: { reason: "user_initiated" } }
          });
        } catch {}

        const ok = await deleteUserAccount(user.id);
        if (!ok) return status(404, { error: "Not found" });

        return status(200, { ok: true });
      } catch (e) {
        const err = e as Error & { status?: number };
        const code = typeof err.status === "number" ? err.status : 500;
        const msg = err instanceof Error ? err.message : "Failed";

        return status(code as 500 | 404 | 401 | 403, { error: msg });
      }
    },
    {
      headers: t.Object({
        "x-csrf-token": t.String()
      }),
      response: {
        200: t.Object({ ok: t.Boolean() }),
        401: t.Object({ error: t.String() }),
        403: t.Object({ error: t.String() }),
        404: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String() })
      }
    }
  )
  .get(
    "/:id",
    async ({ params: { id }, user, status }) => {
      try {
        const requesterId = user?.id ?? null;
        const result = await getPublicUserProfile(id, requesterId);

        if (!result) return status(404, { error: "Not Found" });
        return status(200, result);
      } catch (e) {
        console.error("/api/users/[id] error", e);
        return status(500, { error: "Internal Server Error" });
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      response: {
        200: PublicUserProfile,
        404: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String() })
      }
    }
  )
  .get(
    "/export",
    async ({ user, set, status }) => {
      if (!user?.id) return status(401, { error: "Unauthorized" });

      try {
        const { arrayBuffer, filename, nextAllowed } = await buildUserDataExport(user.id);

        set.headers["Content-Type"] = "application/zip";
        set.headers["Content-Disposition"] = `attachment; filename="${filename}"`;
        set.headers["X-Data-Export-Next-Allowed"] = nextAllowed.toISOString();

        return status(200, arrayBuffer);
      } catch (e: unknown) {
        const err = e as { status?: number; nextAvailable?: string; message?: string };
        if (err?.status === 404) {
          return status(404, { error: "Not found" });
        }
        if (err?.status === 429) {
          return status(429, {
            error: "Too Many Requests",
            nextAvailable: err.nextAvailable
          });
        }
        return status(500, { error: "Internal Server Error" });
      }
    },
    {
      response: {
        200: t.ArrayBuffer(), // Blob
        401: t.Object({ error: t.String() }),
        404: t.Object({ error: t.String() }),
        429: t.Object({ error: t.String(), nextAvailable: t.Optional(t.String()) }),
        500: t.Object({ error: t.String() })
      }
    }
  )
  .get(
    "/mentions/:id",
    async ({ params: { id }, status }) => {
      try {
        const result = await getUserMentionData(id);
        return status(200, result);
      } catch {
        return status(500, { error: "Internal Server Error" });
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      response: {
        200: UserMentionData,
        500: t.Object({ error: t.String() })
      }
    }
  );
