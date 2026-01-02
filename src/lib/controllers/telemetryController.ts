import db from "@/lib/db";
import TelemetryEvent from "@/lib/models/TelemetryEvent";
import hashUserId from "@/lib/utils/hash";

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };
export type IncomingEvent = Record<string, JsonValue>;

type SanitizedDoc = {
  source: "client" | "server";
  eventType: string;
  ts: Date;
  domain?: string;
  path?: string;
  referrer?: string;
  sessionId?: string;
  anonId?: string;
  locale?: unknown;
  environment?: unknown;
  api?: unknown;
  geo?: unknown;
  error?: unknown;
  eventProps?: unknown;
  pseudoUserId?: string;
};

function sanitizeEvent(raw: unknown): Omit<SanitizedDoc, "pseudoUserId"> {
  const clamp = (v: unknown, maxBytes = 4096) => {
    try {
      const s = JSON.stringify(v);
      if (s.length > maxBytes) return { _truncated: true };
      return v;
    } catch {
      return {};
    }
  };
  const safeString = (v: unknown, max = 512) =>
    typeof v === "string" ? v.slice(0, max) : undefined;

  const maybeUser =
    raw && typeof raw === "object" && "user" in (raw as Record<string, unknown>)
      ? (raw as Record<string, unknown>).user
      : undefined;
  const userObj: Record<string, unknown> | undefined =
    maybeUser && typeof maybeUser === "object" ? (maybeUser as Record<string, unknown>) : undefined;

  return {
    source: (raw as Record<string, unknown>)?.event_source === "server" ? "server" : "client",
    eventType: safeString((raw as Record<string, unknown>)?.event_type) || "unknown",
    ts:
      (raw as Record<string, unknown>)?.timestamp &&
      typeof (raw as Record<string, unknown>)?.timestamp === "string"
        ? new Date((raw as Record<string, unknown>)?.timestamp as string)
        : new Date(),
    domain: safeString((raw as Record<string, unknown>)?.domain),
    path: safeString((raw as Record<string, unknown>)?.path),
    referrer: safeString((raw as Record<string, unknown>)?.referrer),
    sessionId: safeString(userObj?.session_id, 128),
    anonId: safeString(userObj?.anon_id, 128),
    locale: clamp((raw as Record<string, unknown>)?.locale, 1024),
    environment: clamp((raw as Record<string, unknown>)?.environment, 2048),
    api: clamp((raw as Record<string, unknown>)?.api, 2048),
    geo: clamp((raw as Record<string, unknown>)?.geo, 512),
    error: clamp((raw as Record<string, unknown>)?.error, 4096),
    eventProps: clamp((raw as Record<string, unknown>)?.event_props, 4096)
  };
}

export async function ingestTelemetryBatch(
  batch: IncomingEvent[],
  opts: { userId?: string; allowAnon: boolean }
): Promise<number> {
  // Respect consent strictly: if not allowed, do not save anything
  if (!opts.allowAnon) return 0;
  await db.connect();

  const docs: SanitizedDoc[] = batch.map((evt) => {
    const sanitized = sanitizeEvent(evt);
    const base: SanitizedDoc = { ...sanitized } as SanitizedDoc;
    if (opts.userId && opts.allowAnon) {
      base.pseudoUserId = hashUserId(opts.userId);
    }
    return base;
  });

  // At this point allowAnon is true, so we keep pseudoUserId when present

  if (!docs.length) return 0;

  await TelemetryEvent.insertMany(docs, { ordered: false });
  return docs.length;
}

export async function listTelemetryForUser(userId: string) {
  await db.connect();
  const pseudo = hashUserId(userId);
  const events = await TelemetryEvent.find({ pseudoUserId: pseudo }).sort({ ts: 1 }).lean();
  return events;
}

// Server-side helpers
export async function trackServerEvent({
  reqHeaders,
  userId,
  allowAnon,
  eventType,
  path,
  domain,
  referrer,
  props
}: {
  reqHeaders: Headers | Record<string, string | null | undefined>;
  userId?: string;
  allowAnon: boolean;
  eventType: string;
  path?: string;
  domain?: string;
  referrer?: string;
  props?: Record<string, unknown>;
}) {
  // Only persist when a user exists and has allowed anonymized usage
  if (!allowAnon || !userId) return;
  await db.connect();
  const now = new Date();
  const h = (name: string) => {
    if (typeof (reqHeaders as Headers).get === "function")
      return (reqHeaders as Headers).get(name) || undefined;
    const rec = reqHeaders as Record<string, string | null | undefined>;
    return (rec[name] ?? rec[name.toLowerCase()] ?? undefined) || undefined;
  };
  const ua = h("user-agent") || "";
  // Prefer Cloudflare headers when behind CF proxy; fall back to Vercel-style or generic headers
  const cfCountry = h("cf-ipcountry") || h("x-vercel-ip-country") || h("x-country") || undefined;
  const cfRegionCode =
    h("cf-region") || h("cf-ipregion") || h("x-vercel-ip-country-region") || undefined;
  const city = h("cf-ipcity") || h("x-vercel-ip-city") || undefined;
  const tz = h("cf-timezone") || h("x-vercel-ip-timezone") || undefined;
  const ip =
    h("cf-connecting-ip") || h("x-forwarded-for")?.split(",")[0] || h("x-real-ip") || undefined;
  // naive parsing to browser/os
  const browser = /edg\//i.test(ua)
    ? "Edge"
    : /chrome|crios|crmo/i.test(ua)
      ? "Chrome"
      : /firefox|fxios/i.test(ua)
        ? "Firefox"
        : /safari/i.test(ua) && !/chrome|crios|crmo/i.test(ua)
          ? "Safari"
          : /android/i.test(ua)
            ? "Android WebView"
            : /iphone|ipad|ipod/i.test(ua)
              ? "iOS WebView"
              : "Unknown";
  const browserVersionMatch = ua.match(/(chrome|crios|firefox|fxios|edg|version)\/(\d+[\.\d+]*)/i);
  const browser_version = browserVersionMatch?.[2];
  const os_version =
    /windows nt ([\d\.]+)/i.exec(ua)?.[1] ||
    /android ([\d\.]+)/i.exec(ua)?.[1] ||
    /cpu (?:iphone )?os ([\d_]+)/i.exec(ua)?.[1]?.replace(/_/g, ".") ||
    undefined;

  const environment = {
    commit: process.env.NEXT_PUBLIC_GIT_SHA || undefined,
    browser,
    browser_version,
    os_version
  };
  const geo = {
    country_code: cfCountry,
    region_code: cfRegionCode,
    region: city,
    time_zone: tz,
    ip
  };

  const base: Record<string, unknown> = {
    event_type: eventType,
    event_source: "server",
    timestamp: now.toISOString(),
    domain,
    path,
    referrer,
    environment,
    geo,
    ...(props || {})
  };

  const doc = sanitizeEvent(base) as SanitizedDoc;
  if (userId && allowAnon) {
    doc.pseudoUserId = hashUserId(userId);
  }
  // await TelemetryEvent.create(doc);
}
