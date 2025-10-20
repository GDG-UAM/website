import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  updateUserSettingsCategory,
  getOrCreateUserSettings
} from "@/lib/controllers/userSettingsController";
import { SettingsCategoryKey } from "@/lib/validation/settingsSchemas";
import { trackServerEvent } from "@/lib/controllers/telemetryController";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ category: SettingsCategoryKey }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const category = (await context.params).category;
  if (!category) return NextResponse.json({ error: "Category required" }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const url = new URL(req.url);
    const p = (url.searchParams.get("previews") || "").toLowerCase();
    const includePreviews = p === "1" || p === "true" || p === "yes";
    const updated = await updateUserSettingsCategory(session.user.id, category, body);
    // Fire telemetry for settings change (non-blocking)
    try {
      // Compute changed keys from incoming body and read final values from updated doc
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
        reqHeaders: req.headers,
        userId: session.user.id,
        allowAnon: !!session.user.allowAnonUsage,
        eventType: "settings_changed",
        path: `/api/settings/${category}`,
        domain: url.hostname,
        referrer: req.headers.get("referer") || undefined,
        props: { event_props: { category, changes: diffs, changed_fields: Object.keys(diffs) } }
      });
    } catch {}
    if (updated && !includePreviews) {
      const obj = updated as unknown as Record<string, unknown>;
      if (Object.prototype.hasOwnProperty.call(obj, "previews")) delete obj.previews;
    }
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ category: SettingsCategoryKey }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const settings = await getOrCreateUserSettings(session.user.id);
  const cat = (await context.params).category as SettingsCategoryKey;
  type SettingsIndexable = Record<string, unknown>;
  const indexable = settings as unknown as SettingsIndexable;
  const slice = indexable[cat];
  return NextResponse.json(slice || {});
}
