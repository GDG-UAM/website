import { NextResponse } from "next/server";
import FeatureFlag from "@/lib/models/FeatureFlag";

export async function GET() {
  // Non-auth listing for client UI: show flags with environment tag
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
      return NextResponse.json({ items: Array.from(map.values()) as FF[] });
    }
    const items = await FeatureFlag.find({ environment: { $in: ["production", "development"] } })
      .sort({ environment: 1, key: 1 })
      .lean();
    return NextResponse.json({ items });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to list flags";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
