import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isUserSettingsOnboardingRequired } from "@/lib/controllers/userSettingsController";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ required: false });
  const required = await isUserSettingsOnboardingRequired(session.user.id);
  return NextResponse.json({ required });
}
