import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import config from "@/lib/config";
import { createFeatureFlag, listFeatureFlags } from "@/lib/controllers/featureFlagController";
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
    id: (token?.id as string) || null,
    role: ((token?.role as string) || "user") as "user" | "team" | "admin",
    email: (token?.email as string) || null
  };
}

export async function GET(req: NextRequest) {
  const { role: requesterRole, email: requesterEmail } = await getRequester(req);
  const isAssoc =
    config.associationEmail &&
    requesterEmail &&
    requesterEmail.toLowerCase() === config.associationEmail.toLowerCase();
  if (!(requesterRole === "admin" || isAssoc))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const environmentParam = searchParams.get("environment");
  const environment =
    environmentParam === "development" || environmentParam === "production"
      ? (environmentParam as "development" | "production")
      : undefined;
  const isActiveParam = searchParams.get("isActive");
  const isActive = isActiveParam === "true" ? true : isActiveParam === "false" ? false : undefined;
  const q = searchParams.get("q") || undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.max(1, Math.min(parseInt(searchParams.get("pageSize") || "20", 10), 100));

  try {
    const data = await listFeatureFlags({ environment, isActive, q, page, pageSize });
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to list feature flags";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { id: requesterId, role: requesterRole, email: requesterEmail } = await getRequester(req);
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
    const {
      name,
      key,
      description,
      isActive = false,
      rolloutPercentage = 0,
      targetUsers = [],
      excludeUsers = [],
      environment = "development",
      metadata = {}
    } = body as Record<string, unknown> as {
      name: string;
      key: string;
      description?: string;
      isActive?: boolean;
      rolloutPercentage?: number;
      targetUsers?: string[];
      excludeUsers?: string[];
      environment?: "development" | "production";
      metadata?: Record<string, unknown>;
    };

    if (!name || !key)
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const created = await createFeatureFlag({
      name,
      key,
      description,
      isActive,
      rolloutPercentage,
      targetUsers,
      excludeUsers,
      environment,
      createdBy: requesterId || "000000000000000000000000",
      metadata
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create feature flag";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
