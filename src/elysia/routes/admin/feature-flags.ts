import { Elysia, t } from "elysia";
import { getSession } from "../../utils/auth";
import { verifyCsrf } from "@/lib/controllers/csrfController";
import config from "@/lib/config";
import {
  createFeatureFlag,
  listFeatureFlags,
  getFeatureFlag,
  updateFeatureFlag,
  deleteFeatureFlag
} from "@/lib/controllers/featureFlagController";
import {
  AdminFeatureFlagsListResponse,
  AdminCreateFeatureFlagBody,
  AdminUpdateFeatureFlagBody,
  AdminFeatureFlagItem
} from "../../models/admin/feature-flags";

export const adminFeatureFlagsRoutes = new Elysia({ prefix: "/feature-flags" })
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
    async ({ query: { environment, isActive, q, page, pageSize }, user, status }) => {
      const requesterRole = user?.role as string | undefined;
      const requesterEmail = user?.email;
      const isAssoc =
        config.associationEmail &&
        requesterEmail &&
        requesterEmail.toLowerCase() === config.associationEmail.toLowerCase();

      if (!(requesterRole === "admin" || isAssoc)) return status(401, { error: "Unauthorized" });

      const env =
        environment === "development" || environment === "production"
          ? (environment as "development" | "production")
          : undefined;
      const active = isActive === "true" ? true : isActive === "false" ? false : undefined;
      const pageNum = Math.max(1, page || 1);
      const pageSizeNum = Math.max(1, Math.min(pageSize || 20, 100));

      try {
        const data = await listFeatureFlags({
          environment: env,
          isActive: active,
          q,
          page: pageNum,
          pageSize: pageSizeNum
        });
        return status(200, data);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to list feature flags";
        return status(500, { error: msg });
      }
    },
    {
      query: t.Object({
        environment: t.Optional(t.String()),
        isActive: t.Optional(t.String()),
        q: t.Optional(t.String()),
        page: t.Optional(t.Number({ default: 1, minimum: 1 })),
        pageSize: t.Optional(t.Number({ default: 20, minimum: 1, maximum: 100 }))
      }),
      response: {
        200: AdminFeatureFlagsListResponse,
        401: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String() })
      }
    }
  )
  .post(
    "/",
    async ({ headers, body, user, status }) => {
      const requesterId = user?.id;
      const requesterRole = user?.role as string | undefined;
      const requesterEmail = user?.email;
      const isAssoc =
        config.associationEmail &&
        requesterEmail &&
        requesterEmail.toLowerCase() === config.associationEmail.toLowerCase();

      if (!(requesterRole === "admin" || isAssoc)) return status(401, { error: "Unauthorized" });

      try {
        const userId = user?.id;
        const token = headers["x-csrf-token"];

        if (!userId || !token || !(await verifyCsrf(token, userId)))
          return status(403, { error: "Invalid CSRF" });

        const {
          name,
          key,
          description,
          isActive = false,
          rolloutPercentage = 0,
          targetUsers = [],
          excludeUsers = [],
          environment = "development",
          metadata = {}
        } = body;

        if (!name || !key) return status(400, { error: "Missing required fields" });

        const created = await createFeatureFlag({
          name,
          key,
          description,
          isActive,
          rolloutPercentage,
          targetUsers,
          excludeUsers,
          environment: environment as "development" | "production",
          createdBy: requesterId || "000000000000000000000000",
          metadata
        });
        return status(200, created as typeof AdminFeatureFlagItem.static);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to create feature flag";
        return status(400, { error: msg });
      }
    },
    {
      headers: t.Object({
        "x-csrf-token": t.String()
      }),
      body: AdminCreateFeatureFlagBody,
      response: {
        200: AdminFeatureFlagItem,
        400: t.Object({ error: t.String() }),
        401: t.Object({ error: t.String() }),
        403: t.Object({ error: t.String() })
      }
    }
  )
  .get(
    "/:key",
    async ({ params: { key }, query: { environment }, user, status }) => {
      const requesterRole = user?.role as string | undefined;
      const requesterEmail = user?.email;
      const isAssoc =
        config.associationEmail &&
        requesterEmail &&
        requesterEmail.toLowerCase() === config.associationEmail.toLowerCase();

      if (!(requesterRole === "admin" || isAssoc)) return status(401, { error: "Unauthorized" });

      const env = environment === "production" ? "production" : "development";
      const flag = await getFeatureFlag(key, env);
      if (!flag) return status(404, { error: "Not found" });
      return status(200, flag as typeof AdminFeatureFlagItem.static);
    },
    {
      params: t.Object({
        key: t.String()
      }),
      query: t.Object({
        environment: t.Optional(t.String())
      }),
      response: {
        200: AdminFeatureFlagItem,
        401: t.Object({ error: t.String() }),
        404: t.Object({ error: t.String() })
      }
    }
  )
  .patch(
    "/:key",
    async ({ params: { key }, headers, body, user, status }) => {
      const requesterRole = user?.role as string | undefined;
      const requesterEmail = user?.email;
      const isAssoc =
        config.associationEmail &&
        requesterEmail &&
        requesterEmail.toLowerCase() === config.associationEmail.toLowerCase();

      if (!(requesterRole === "admin" || isAssoc)) return status(401, { error: "Unauthorized" });

      try {
        const userId = user?.id;
        const token = headers["x-csrf-token"];

        if (!userId || !token || !(await verifyCsrf(token, userId)))
          return status(403, { error: "Invalid CSRF" });

        const { environment = "development", ...updateData } = body;
        const updated = await updateFeatureFlag(
          key,
          environment as "development" | "production",
          updateData
        );
        if (!updated) return status(404, { error: "Not found" });
        return status(200, updated as typeof AdminFeatureFlagItem.static);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to update feature flag";
        return status(400, { error: msg });
      }
    },
    {
      params: t.Object({
        key: t.String()
      }),
      headers: t.Object({
        "x-csrf-token": t.String()
      }),
      body: AdminUpdateFeatureFlagBody,
      response: {
        200: AdminFeatureFlagItem,
        400: t.Object({ error: t.String() }),
        401: t.Object({ error: t.String() }),
        403: t.Object({ error: t.String() }),
        404: t.Object({ error: t.String() })
      }
    }
  )
  .delete(
    "/:key",
    async ({ params: { key }, query: { environment }, headers, user, status }) => {
      const requesterRole = user?.role as string | undefined;
      const requesterEmail = user?.email;
      const isAssoc =
        config.associationEmail &&
        requesterEmail &&
        requesterEmail.toLowerCase() === config.associationEmail.toLowerCase();

      if (!(requesterRole === "admin" || isAssoc)) return status(401, { error: "Unauthorized" });

      const env = environment === "production" ? "production" : "development";
      try {
        const userId = user?.id;
        const token = headers["x-csrf-token"];

        if (!userId || !token || !(await verifyCsrf(token, userId)))
          return status(403, { error: "Invalid CSRF" });

        const ok = await deleteFeatureFlag(key, env);
        if (!ok) return status(404, { error: "Not found" });
        return status(200, { ok: true });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to delete feature flag";
        return status(400, { error: msg });
      }
    },
    {
      params: t.Object({
        key: t.String()
      }),
      query: t.Object({
        environment: t.Optional(t.String())
      }),
      headers: t.Object({
        "x-csrf-token": t.String()
      }),
      response: {
        200: t.Object({ ok: t.Boolean() }),
        400: t.Object({ error: t.String() }),
        401: t.Object({ error: t.String() }),
        403: t.Object({ error: t.String() }),
        404: t.Object({ error: t.String() })
      }
    }
  );
