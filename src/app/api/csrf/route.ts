import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { signCsrf } from "@/lib/controllers/csrfController";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { token, expiresAt } = await signCsrf(session.user.id as string);
  return NextResponse.json({ token, expiresAt });
}
