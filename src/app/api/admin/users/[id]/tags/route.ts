import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import config from "@/lib/config";
import { updateUserCustomTags } from "@/lib/controllers/userController";
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

/**
 * PATCH /api/admin/users/[id]/tags
 * Update custom profile tags for a user (admin only)
 * Body: { customTags: Array<"founder" | "president" | "vice-president" | "treasurer" | "secretary"> }
 */
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { role: requesterRole, email: requesterEmail } = await getRequester(req);

  const isAssoc =
    config.associationEmail &&
    requesterEmail &&
    requesterEmail.toLowerCase() === config.associationEmail.toLowerCase();

  if (!(requesterRole === "admin" || isAssoc)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = req.headers.get("x-csrf-token") || "";
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id as string | undefined;

  if (!sessionUserId || !token || !(await verifyCsrf(token, sessionUserId))) {
    return NextResponse.json({ error: "Invalid CSRF" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { customTags } = body as {
      customTags?: Array<"founder" | "president" | "vice-president" | "treasurer" | "secretary">;
    };

    if (!customTags || !Array.isArray(customTags)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const validTags = ["founder", "president", "vice-president", "treasurer", "secretary"];
    const allValid = customTags.every((tag) => validTags.includes(tag));

    if (!allValid) {
      return NextResponse.json({ error: "Invalid tag value" }, { status: 400 });
    }

    const result = await updateUserCustomTags(id, customTags, {
      requesterRole,
      requesterEmail
    });

    return NextResponse.json(result);
  } catch (err) {
    const e = err as Error & { status?: number };
    if (e.message === "NotFound") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (e.status === 403 || e.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
