import { Elysia, t } from "elysia";
import FeatureFlag from "@/lib/models/FeatureFlag";
import db from "@/lib/db";
import { featureFlagsExportKey } from "@/lib/config";
import { FeatureFlagsResponse, FeatureFlagsExportResponse } from "../models/feature-flags";

// Helper to convert Date/ObjectId fields into Mongo export JSON shape
function serializeFlag(flag: unknown) {
  const f = flag as Record<string, unknown>;
  return {
    _id: { $oid: String(f._id) },
    name: String(f.name),
    key: String(f.key),
    description: (f.description as string | undefined) ?? undefined,
    isActive: Boolean(f.isActive),
    rolloutPercentage:
      typeof f.rolloutPercentage === "number" ? (f.rolloutPercentage as number) : 0,
    targetUsers: Array.isArray(f.targetUsers)
      ? (f.targetUsers as unknown[]).map((id: unknown) => ({ $oid: String(id) }))
      : [],
    excludeUsers: Array.isArray(f.excludeUsers)
      ? (f.excludeUsers as unknown[]).map((id: unknown) => ({ $oid: String(id) }))
      : [],
    environment: f.environment === "production" ? "production" : "development",
    createdBy: { $oid: String(f.createdBy) },
    metadata: (f.metadata as Record<string, unknown> | undefined) ?? undefined,
    createdAt: { $date: new Date(f.createdAt as string | number | Date).toISOString() },
    updatedAt: {
      $date: new Date((f.updatedAt ?? f.createdAt) as string | number | Date).toISOString()
    }
  };
}

export const featureFlagsRoutes = new Elysia({ prefix: "/feature-flags" })
  .derive(({ set }) => ({
    status: (code: 200 | 401 | 403 | 404 | 500 | 429, response) => {
      set.status = code;
      return response;
    }
  }))
  .get(
    "/",
    async ({ status }) => {
      const env = process.env.NODE_ENV === "development" ? "development" : "production";
      try {
        if (env === "development") {
          const [prod, dev] = await Promise.all([
            FeatureFlag.find({ environment: "production" }).sort({ key: 1 }).lean(),
            FeatureFlag.find({ environment: "development" }).sort({ key: 1 }).lean()
          ]);
          // Merge by key with prod first
          type FF = { key: string; environment: "development" | "production" } & Record<
            string,
            unknown
          >;
          const map = new Map<string, FF>();
          for (const f of prod as FF[]) map.set(f.key, f);
          for (const f of dev as FF[]) if (!map.has(f.key)) map.set(f.key, f);
          return status(200, { items: Array.from(map.values()) as FF[] });
        }
        const items = await FeatureFlag.find({
          environment: { $in: ["production", "development"] }
        })
          .sort({ environment: 1, key: 1 })
          .lean();
        return { items };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to list flags";
        return status(500, { error: msg });
      }
    },
    {
      response: {
        200: FeatureFlagsResponse,
        500: t.Object({ error: t.String() })
      }
    }
  )
  .get(
    "/export",
    async ({ request, query: { key }, status, set }) => {
      try {
        const provided = request.headers.get("x-ff-export-key") || key || undefined;

        if (!featureFlagsExportKey || provided !== featureFlagsExportKey) {
          return status(401, { error: "Unauthorized" });
        }

        await db.connect();

        const flags = await FeatureFlag.find().sort({ key: 1 }).lean();
        const items = flags.map((f) => serializeFlag(f));

        set.headers["cache-control"] = "no-store";
        return status(200, { items });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to export";
        return status(500, { error: msg });
      }
    },
    {
      query: t.Object({
        key: t.Optional(t.String())
      }),
      response: {
        200: FeatureFlagsExportResponse,
        401: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String() })
      }
    }
  );
