import crypto from "crypto";
import db from "@/lib/db";
import CsrfToken from "@/lib/models/CsrfToken";

const SECRET = process.env.SESSION_SECRET || "dev_secret";

function b64url(input: Buffer | string) {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return b.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function fingerprintFromHeaders(h: Headers | Record<string, string | string[] | undefined>) {
  const get = (k: string) => {
    if (h instanceof Headers) return h.get(k) || "";
    const v = h[k.toLowerCase()];
    if (Array.isArray(v)) return v.join(",");
    return v || "";
  };
  const ua = get("user-agent") || "";
  const xff = get("x-forwarded-for") || "";
  const ip = (xff.split(",")[0] || "").trim();
  const raw = `${ua}::${ip}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function signToken(uid: string, ttlMs: number) {
  const exp = Date.now() + ttlMs;
  const payload = { uid, exp };
  const json = JSON.stringify(payload);
  const sig = crypto.createHmac("sha256", SECRET).update(json).digest();
  const token = `${b64url(json)}.${b64url(sig)}`;
  return { token, exp: new Date(exp) };
}

function verifySignature(token: string, uid: string) {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  try {
    const json = Buffer.from(parts[0].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString();
    const payload = JSON.parse(json) as { uid: string; exp: number };
    if (!payload?.uid || !payload?.exp) return false;
    if (payload.uid !== uid) return false;
    if (Date.now() > payload.exp) return false;
    const expected = crypto.createHmac("sha256", SECRET).update(json).digest();
    const provided = Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64");
    return expected.length === provided.length && crypto.timingSafeEqual(expected, provided);
  } catch {
    return false;
  }
}

// Header-bound tokens (fingerprint)
export async function createTokenForHeaders(
  headersLike: Headers | Record<string, string | string[] | undefined>,
  ttlSeconds = 5 * 60
) {
  await db.connect();
  const uid = fingerprintFromHeaders(headersLike);
  const { token, exp } = signToken(uid, ttlSeconds * 1000);
  await CsrfToken.create({ token, uid, exp });
  return token;
}

// NOTE: We check exp during verification because Mongo TTL cleanup is not instantaneous.
export async function verifyTokenForHeaders(
  headersLike: Headers | Record<string, string | string[] | undefined>,
  token?: string | null
) {
  if (!token) return false;
  await db.connect();
  const uid = fingerprintFromHeaders(headersLike);
  if (!verifySignature(token, uid)) return false;
  const doc = await CsrfToken.findOne({ token }).lean<{ token: string; uid: string; exp: Date }>();
  if (!doc) return false;
  if (Date.now() > new Date(doc.exp).getTime()) return false; // extra exp check
  return true;
}

// User-bound tokens (session user id)
export async function signCsrf(userId: string, ttlMs = 5 * 60 * 1000) {
  await db.connect();
  const { token, exp } = signToken(userId, ttlMs);
  await CsrfToken.create({ token, uid: userId, exp });
  return { token, expiresAt: exp };
}

export async function verifyCsrf(token: string, userId: string) {
  await db.connect();
  if (!verifySignature(token, userId)) return false;
  const doc = await CsrfToken.findOne({ token, uid: userId }).lean<{ token: string; exp: Date }>();
  if (!doc) return false;
  if (Date.now() > new Date(doc.exp).getTime()) return false; // extra exp check
  return true;
}

export async function revokeToken(token: string) {
  await db.connect();
  await CsrfToken.deleteOne({ token });
}
