import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import FeatureFlag from "@/lib/models/FeatureFlag";
import { featureFlagsExportKey } from "@/lib/config";

type OID = { $oid: string };
type DDATE = { $date: string };
interface FeatureFlagMongoExport {
  _id: OID;
  name: string;
  key: string;
  description?: string;
  isActive: boolean;
  rolloutPercentage: number;
  targetUsers: OID[];
  excludeUsers: OID[];
  environment: "development" | "production";
  createdBy: OID;
  metadata?: Record<string, unknown>;
  createdAt: DDATE;
  updatedAt: DDATE;
}

// Helper to convert Date/ObjectId fields into Mongo export JSON shape
function serializeFlag(flag: unknown): FeatureFlagMongoExport {
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

export async function GET(request: NextRequest) {
  try {
    // Simple header/param-protected endpoint
    const provided =
      request.headers.get("x-ff-export-key") ||
      request.nextUrl.searchParams.get("key") ||
      undefined;
    if (!featureFlagsExportKey || provided !== featureFlagsExportKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.connect();

    const flags = await FeatureFlag.find().sort({ key: 1 }).lean();

    const items = flags.map((f) => serializeFlag(f));

    return NextResponse.json({ items }, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to export";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
