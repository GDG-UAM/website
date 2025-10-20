import crypto from "crypto";
import config from "@/lib/config";

const SECRET = process.env.TELEMETRY_SECRET || config.sessionSecret || "telemetry_default";

export default function hashUserId(userId: string): string {
  // Stable, non-reversible HMAC for pseudonymous linkage
  return crypto.createHmac("sha256", SECRET).update(userId).digest("hex");
}
