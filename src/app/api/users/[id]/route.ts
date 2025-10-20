import { NextResponse } from "next/server";
import { getPublicUserProfile } from "@/lib/controllers/userController";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    let requesterId: string | null = null;
    try {
      let session;
      try {
        session = await getServerSession(authOptions);
      } catch {
        session = await getServerSession();
      }
      requesterId = session?.user?.id ?? null;
    } catch {}

    const result = await getPublicUserProfile(id, requesterId);
    if (!result) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }
    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    console.error("/api/users/[id] error", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
