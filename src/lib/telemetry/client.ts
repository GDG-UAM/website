"use client";
// import { api } from "@/lib/eden";

// Minimal telemetry client with consent gating, batching, and beacon flush.

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };
export type Payload = Record<string, JsonValue>;

let consent = false;
let anonId: string | null = null;
let sessionId: string | null = null;
let queue: Payload[] = [];
let sending = false;

function uuid4() {
  // RFC4122-ish
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 0xf) >> 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function initIds() {
  if (typeof window === "undefined") return;
  try {
    anonId = localStorage.getItem("telemetry_anon_id");
    if (!anonId) {
      anonId = `anon_${uuid4()}`;
      localStorage.setItem("telemetry_anon_id", anonId);
    }
  } catch {
    // ignore
  }
  sessionId = `sess_${uuid4()}`;
}

export function setConsent(v: boolean) {
  consent = !!v;
}

export function track(event_type: string, payload: Payload = {}) {
  if (!consent) return;
  if (!sessionId) initIds();
  const now = new Date();

  const base = {
    event_type,
    event_source: "client",
    timestamp: now.toISOString(),
    client_track_timestamp: now.toISOString(),
    user: {
      anon_id: anonId,
      session_id: sessionId
    }
  };
  queue.push({ ...base, ...payload });
  if (queue.length >= 30) void flush();
}

async function flush() {
  if (!consent || sending || queue.length === 0) return;
  const batch = queue.splice(0, 50);
  sending = true;
  try {
    const blob = new Blob([JSON.stringify(batch)], { type: "application/json" });
    const sent = navigator.sendBeacon?.("/api/telemetry", blob);
    if (!sent) {
      if (!sent) {
        // await api.telemetry.post(batch);
      }
    }
  } catch {
    // requeue on failure (bounded)
    queue = [...batch, ...queue].slice(0, 200);
  } finally {
    sending = false;
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void flush();
  });
}

// Helpers
export function trackRouteView(pathname: string) {
  const rendered = typeof document !== "undefined" ? document.documentElement.lang : undefined;
  const payload: Payload = { path: pathname };
  if (rendered) (payload as Record<string, unknown>).locale = { rendered_locale: rendered };
  track("route_view", payload);
}
