import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listUserActiveParticipations } from "@/lib/controllers/giveawayController";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const participations = await listUserActiveParticipations(userId);
    const requirePhotoUsageConsent = participations.some(
      (p) =>
        !!(p.giveaway as unknown as { requirePhotoUsageConsent?: boolean }).requirePhotoUsageConsent
    );
    const requireProfilePublic = participations.some(
      (p) => !!(p.giveaway as unknown as { requireProfilePublic?: boolean }).requireProfilePublic
    );

    return NextResponse.json({
      participating: participations.length > 0,
      participations,
      requirePhotoUsageConsent,
      requireProfilePublic
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
