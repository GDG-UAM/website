import { Elysia, t } from "elysia";
import {
  getOrCreateUserSettings,
  activateUserSettings,
  isUserSettingsOnboardingRequired,
  updateUserSettingsCategory
} from "@/lib/controllers/userSettingsController";
import { trackServerEvent } from "@/lib/controllers/telemetryController";
import type { SettingsCategoryKey } from "@/lib/validation/settingsSchemas";
import { UserSettings, UpdateSettingsBody } from "../models/settings";
import { getSession } from "../utils/auth";

export const settingsRoutes = new Elysia({ prefix: "/settings" })
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
  .get(
    "/",
    async ({ query: { previews }, user, status }) => {
      try {
        if (!user?.id) return status(401, { error: "Unauthorized" });
        const p = (previews || "").toLowerCase();
        const includePreviews = p === "1" || p === "true" || p === "yes";
        const settings = await getOrCreateUserSettings(
          user.id,
          includePreviews ? { includePreviews: true } : undefined
        );
        return status(200, settings as typeof UserSettings.static);
      } catch {
        return status(500, { error: "Internal Server Error" });
      }
    },
    {
      query: t.Object({
        previews: t.Optional(t.String())
      }),
      response: {
        200: UserSettings,
        401: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String() })
      }
    }
  )
  .post(
    "/activate",
    async ({ user, status }) => {
      try {
        if (!user?.id) return status(401, { error: "Unauthorized" });
        await activateUserSettings(user.id);
        return status(200, { ok: true });
      } catch {
        return status(500, { error: "Internal Server Error" });
      }
    },
    {
      response: {
        200: t.Object({ ok: t.Boolean() }),
        401: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String() })
      }
    }
  )
  .get(
    "/onboarding",
    async ({ user, status }) => {
      if (!user?.id) return status(401, { error: "Unauthorized" });
      const required = await isUserSettingsOnboardingRequired(user.id);
      return status(200, { required });
    },
    {
      response: {
        200: t.Object({ required: t.Boolean() }),
        401: t.Object({ error: t.String() })
      }
    }
  )
  .get(
    "/:category",
    async ({ params: { category }, user, status }) => {
      if (!user?.id) return status(401, { error: "Unauthorized" });
      const settings = await getOrCreateUserSettings(user.id);
      const cat = category as SettingsCategoryKey;
      type SettingsIndexable = Record<string, unknown>;
      const indexable = settings as unknown as SettingsIndexable;
      const slice = indexable[cat];
      return status(200, slice || {});
    },
    {
      params: t.Object({
        category: t.Union([
          t.Literal("general"),
          t.Literal("profile"),
          t.Literal("privacy"),
          t.Literal("events"),
          t.Literal("games"),
          t.Literal("notifications"),
          t.Literal("accessibility"),
          t.Literal("experimental")
        ])
      }),
      response: {
        200: UpdateSettingsBody,
        401: t.Object({ error: t.String() })
      }
    }
  )
  .patch(
    "/:category",
    async ({ request, params: { category }, query: { previews }, body, user, status }) => {
      if (!user?.id) return status(401, { error: "Unauthorized" });

      try {
        const url = new URL(request.url);
        const p = (previews || "").toLowerCase();
        const includePreviews = p === "1" || p === "true" || p === "yes";
        const updated = await updateUserSettingsCategory(
          user.id,
          category as SettingsCategoryKey,
          body
        );

        try {
          const nextSlice = (updated as unknown as Record<string, unknown>)[
            category as unknown as string
          ] as Record<string, unknown> | undefined;
          const bodyObj =
            body && typeof body === "object"
              ? (body as Record<string, unknown>)
              : ({} as Record<string, unknown>);
          const diffs: Record<string, unknown> = {};
          for (const key of Object.keys(bodyObj)) {
            const newVal = nextSlice ? (nextSlice as Record<string, unknown>)[key] : undefined;
            diffs[key] = newVal;
          }
          void trackServerEvent({
            reqHeaders: request.headers,
            userId: user.id,
            allowAnon: !!user.allowAnonUsage,
            eventType: "settings_changed",
            path: `/api/settings/${category}`,
            domain: url.hostname,
            referrer: request.headers.get("referer") || undefined,
            props: { event_props: { category, changes: diffs, changed_fields: Object.keys(diffs) } }
          });
        } catch {}

        if (updated && !includePreviews) {
          const obj = updated as unknown as Record<string, unknown>;
          if (Object.prototype.hasOwnProperty.call(obj, "previews")) delete obj.previews;
        }
        return status(200, updated as typeof UserSettings.static);
      } catch (e) {
        return status(400, { error: (e as Error).message });
      }
    },
    {
      params: t.Object({
        category: t.Union([
          t.Literal("general"),
          t.Literal("profile"),
          t.Literal("privacy"),
          t.Literal("events"),
          t.Literal("games"),
          t.Literal("notifications"),
          t.Literal("accessibility"),
          t.Literal("experimental")
        ])
      }),
      query: t.Object({
        previews: t.Optional(t.String())
      }),
      body: UpdateSettingsBody,
      response: {
        200: UserSettings,
        400: t.Object({ error: t.String() }),
        401: t.Object({ error: t.String() })
      }
    }
  );
