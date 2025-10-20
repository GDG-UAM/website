import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import config from "@/lib/config";
import {
  getFeatureFlag,
  updateFeatureFlag,
  deleteFeatureFlag
} from "@/lib/controllers/featureFlagController";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyCsrf } from "@/lib/controllers/csrfController";

const NEXTAUTH_SECRET = process.env.SESSION_SECRET;

async function getRequester(req: NextRequest) {
  const token = await getToken({
    req,
    secret: NEXTAUTH_SECRET,
    cookieName: "next-auth.session-token"
  });
  return {
    role: ((token?.role as string) || "user") as "user" | "team" | "admin",
    email: (token?.email as string) || null
  };
}

export async function GET(req: NextRequest, context: { params: Promise<{ key: string }> }) {
  const { role: requesterRole, email: requesterEmail } = await getRequester(req);
  const isAssoc =
    config.associationEmail &&
    requesterEmail &&
    requesterEmail.toLowerCase() === config.associationEmail.toLowerCase();
  if (!(requesterRole === "admin" || isAssoc))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const envParam = searchParams.get("environment") || "development";
  const environment = envParam === "production" ? "production" : "development";
  const flag = await getFeatureFlag((await context.params).key, environment);
  if (!flag) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(flag);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ key: string }> }) {
  const { role: requesterRole, email: requesterEmail } = await getRequester(req);
  const isAssoc =
    config.associationEmail &&
    requesterEmail &&
    requesterEmail.toLowerCase() === config.associationEmail.toLowerCase();
  if (!(requesterRole === "admin" || isAssoc))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string | undefined;
    const token = req.headers.get("x-csrf-token") || "";
    if (!userId || !token || !(await verifyCsrf(token, userId))) {
      return NextResponse.json({ error: "Invalid CSRF" }, { status: 403 });
    }
    const body = await req.json();
    const { environment = "development", ...updateData } = body as Record<string, unknown> & {
      environment?: "development" | "production";
    };
    const updated = await updateFeatureFlag((await context.params).key, environment, updateData);
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update feature flag";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ key: string }> }) {
  const { role: requesterRole, email: requesterEmail } = await getRequester(req);
  const isAssoc =
    config.associationEmail &&
    requesterEmail &&
    requesterEmail.toLowerCase() === config.associationEmail.toLowerCase();
  if (!(requesterRole === "admin" || isAssoc))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const envParam = searchParams.get("environment") || "development";
  const environment = envParam === "production" ? "production" : "development";
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string | undefined;
    const token = req.headers.get("x-csrf-token") || "";
    if (!userId || !token || !(await verifyCsrf(token, userId))) {
      return NextResponse.json({ error: "Invalid CSRF" }, { status: 403 });
    }
    const ok = await deleteFeatureFlag((await context.params).key, environment);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to delete feature flag";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
