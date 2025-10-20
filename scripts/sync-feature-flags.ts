import "./load-env";
import db from "../src/lib/db";
import FeatureFlag from "../src/lib/models/FeatureFlag";
import mongoose from "mongoose";
import { siteURL, featureFlagsExportKey } from "@/lib/config";

type OID = { $oid: string };
type DDATE = { $date: string };
type ExportItem = {
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
};

function oid(v: OID) {
  return v?.$oid;
}

function date(v: DDATE) {
  return new Date(v?.$date);
}

// Do not log secrets

async function main() {
  if (!featureFlagsExportKey) {
    console.log("[flags] No FEATURE_FLAGS_EXPORT_KEY set. Skipping sync");
    return;
  }
  try {
    const exportUrl = `${siteURL.replace(/\/$/, "")}/api/feature-flags/export`;
    const res = await fetch(exportUrl, {
      headers: { "x-ff-export-key": featureFlagsExportKey, "cache-control": "no-store" }
    });
    if (!res.ok) {
      console.warn(`[flags] Export fetch failed ${res.status}. Skipping`);
      return;
    }
    const payload = (await res.json()) as { items: ExportItem[] };
    const count = Array.isArray(payload?.items) ? payload.items.length : 0;
    console.log(`[flags] Downloaded ${count} flags from ${siteURL}`);
    if (!count) return;

    await db.connect();
    await FeatureFlag.deleteMany({});
    await FeatureFlag.insertMany(
      payload.items.map((it) => ({
        _id: it._id?.$oid,
        name: it.name,
        key: it.key,
        description: it.description,
        isActive: it.isActive,
        rolloutPercentage: it.rolloutPercentage ?? 0,
        targetUsers: (it.targetUsers || []).map(oid).filter(Boolean),
        excludeUsers: (it.excludeUsers || []).map(oid).filter(Boolean),
        environment: it.environment,
        createdBy: oid(it.createdBy),
        metadata: it.metadata ?? {},
        createdAt: date(it.createdAt),
        updatedAt: date(it.updatedAt)
      }))
    );
    console.log(`[flags] Imported ${count} flags into local DB`);
  } catch (e) {
    console.warn(`[flags] Sync error: ${(e as Error).message}`);
  } finally {
    try {
      await mongoose.disconnect();
    } catch {}
  }
}

void main();
