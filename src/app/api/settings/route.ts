import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOrCreateUserSettings } from "@/lib/controllers/userSettingsController";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const p = (url.searchParams.get("previews") || "").toLowerCase();
  const includePreviews = p === "1" || p === "true" || p === "yes";
  const settings = await getOrCreateUserSettings(
    session.user.id,
    includePreviews ? { includePreviews: true } : undefined
  );
  return NextResponse.json(settings);
}
