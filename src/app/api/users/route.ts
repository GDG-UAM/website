import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteUserAccount } from "@/lib/controllers/userController";
import { trackServerEvent } from "@/lib/controllers/telemetryController";
import { verifyCsrf } from "@/lib/controllers/csrfController";

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = req.headers.get("x-csrf-token") || "";
  if (!token || !(await verifyCsrf(token, session.user.id as string))) {
    return NextResponse.json({ error: "Invalid CSRF" }, { status: 403 });
  }

  const userId = session.user.id as string;

  try {
    // Best-effort telemetry audit before deletion (will be stored under pseudo id)
    try {
      await trackServerEvent({
        reqHeaders: req.headers,
        userId,
        allowAnon: Boolean(
          (session.user as unknown as { allowAnonUsage?: boolean })?.allowAnonUsage
        ),
        eventType: "account_delete",
        path: "/api/users",
        domain: new URL(req.url).hostname,
        referrer: req.headers.get("referer") || undefined,
        props: { event_props: { reason: "user_initiated" } }
      });
    } catch {
      /* ignore */
    }
    // Delete account and related data via controller
    const ok = await deleteUserAccount(userId);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Return success so client can sign out
    return NextResponse.json({ ok: true });
  } catch (e) {
    const err = e as Error & { status?: number };
    const code = typeof err.status === "number" ? err.status : 500;
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: code });
  }
}
