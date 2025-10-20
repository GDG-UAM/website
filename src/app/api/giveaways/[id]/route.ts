import { NextRequest, NextResponse } from "next/server";
import { getGiveaway } from "@/lib/controllers/giveawayController";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const g = await getGiveaway(id);
    // expose only the public fields the client needs
    const out: Record<string, unknown> = {
      id: g._id || g.id,
      title: g.title,
      mustBeLoggedIn: !!g.mustBeLoggedIn,
      requirePhotoUsageConsent: !!g.requirePhotoUsageConsent,
      requireProfilePublic: !!g.requireProfilePublic,
      startAt: g.startAt ?? null,
      endAt: g.endAt ?? null,
      durationS: g.durationS ?? null,
      remainingS:
        ("remainingS" in g ? (g as unknown as { remainingS?: number | null }).remainingS : null) ??
        null,
      status: g.status ?? null
    };
    return NextResponse.json(out);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Giveaway not found";
    return NextResponse.json({ error: msg }, { status: 404 });
  }
}
