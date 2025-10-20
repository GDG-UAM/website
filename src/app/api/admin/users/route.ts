import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import config from "@/lib/config";
import { listUsers, updateUserRole } from "@/lib/controllers/userController";
import { verifyCsrf } from "@/lib/controllers/csrfController";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

export async function GET(req: NextRequest) {
  const { role: requesterRole, email: requesterEmail } = await getRequester(req);
  const isAssoc =
    config.associationEmail &&
    requesterEmail &&
    requesterEmail.toLowerCase() === config.associationEmail.toLowerCase();
  if (!(requesterRole === "admin" || isAssoc))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.max(1, Math.min(parseInt(searchParams.get("pageSize") || "20", 10), 100));
  const { items, total } = await listUsers({ q, page, pageSize });
  return NextResponse.json({ items, total, page, pageSize });
}

export async function PATCH(req: NextRequest) {
  const { role: requesterRole, email: requesterEmail } = await getRequester(req);
  const isAssoc =
    config.associationEmail &&
    requesterEmail &&
    requesterEmail.toLowerCase() === config.associationEmail.toLowerCase();
  if (!(requesterRole === "admin" || isAssoc))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const token = req.headers.get("x-csrf-token") || "";
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id as string | undefined;
  if (!sessionUserId || !token || !(await verifyCsrf(token, sessionUserId))) {
    return NextResponse.json({ error: "Invalid CSRF" }, { status: 403 });
  }
  const body = await req.json();
  const { id, role: newRole } = body as { id?: string; role?: "user" | "team" | "admin" };
  if (!id || !newRole) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  try {
    const result = await updateUserRole(id, newRole as "user" | "team" | "admin", {
      requesterRole,
      requesterEmail
    });
    return NextResponse.json(result);
  } catch (err) {
    const e = err as Error & { status?: number };
    if (e.message === "NotFound") return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (e.status === 403 || e.message === "Forbidden")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
