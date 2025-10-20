import { createTokenForHeaders } from "@/lib/controllers/csrfController";
import { NextRequest, NextResponse } from "next/server";

// Issues an anonymous (header-fingerprint-bound) CSRF token for contact form usage.
export async function GET(req: NextRequest) {
  const ua = req.headers.get("user-agent") ?? "";
  const xff = req.headers.get("x-forwarded-for") ?? "";
  const rec = { "user-agent": ua, "x-forwarded-for": xff } as Record<string, string>;
  const token = await createTokenForHeaders(rec, 5 * 60);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  return NextResponse.json({ token, expiresAt });
}
