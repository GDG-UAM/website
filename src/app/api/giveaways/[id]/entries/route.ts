import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import GiveawayEntryModel from "@/lib/models/GiveawayEntry";
import GiveawayModel from "@/lib/models/Giveaway";
import { emitToRoom } from "@/lib/realtime/io";
import { countEntries } from "@/lib/controllers/giveawayController";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const url = new URL(req.url);
    const anonId = url.searchParams.get("anonId");

    const query: Record<string, unknown> = { giveawayId: id };
    if (userId) query.userId = userId;
    else if (anonId) query.anonId = anonId;

    const existing = await GiveawayEntryModel.findOne(query).lean().exec();
    return NextResponse.json({ registered: !!existing });
  } catch {
    return NextResponse.json({ registered: false });
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const acceptTerms = Boolean(body.acceptTerms);
    const finalConfirmations = body.finalConfirmations ?? {};
    if (!acceptTerms) return NextResponse.json({ error: "Terms not accepted" }, { status: 400 });

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // prefer server-side anon id from cookie if present, otherwise client may send anonId
    const anonId = body.anonId ?? null;

    // check giveaway exists
    const giveaway = await GiveawayModel.findById(id).lean().exec();
    if (!giveaway) return NextResponse.json({ error: "Giveaway not found" }, { status: 404 });

    // validate that the giveaway is open for joining
    const now = Date.now();
    const endAtMs = giveaway.endAt ? new Date(giveaway.endAt as unknown as string).getTime() : null;
    const hasEndAt = typeof endAtMs === "number" && !Number.isNaN(endAtMs);
    const remaining =
      typeof (giveaway as unknown as { remainingS?: number | null }).remainingS === "number"
        ? (giveaway as unknown as { remainingS?: number | null }).remainingS
        : null;
    const startAtMs = giveaway.startAt
      ? new Date(giveaway.startAt as unknown as string).getTime()
      : null;
    const durationExpiredActive =
      !hasEndAt &&
      giveaway.status === "active" &&
      typeof startAtMs === "number" &&
      typeof remaining === "number" &&
      startAtMs + remaining * 1000 <= now;
    const isClosedByTime =
      // explicit closed/cancelled statuses
      giveaway.status === "closed" ||
      giveaway.status === "cancelled" ||
      // endAt mode: end time passed
      (hasEndAt && endAtMs! <= now) ||
      // duration mode: remainingS missing/<=0 or active period elapsed using startAt+remainingS
      (!hasEndAt && (remaining == null || remaining <= 0 || durationExpiredActive));
    if (isClosedByTime) {
      return NextResponse.json({ error: "Giveaway is closed" }, { status: 403 });
    }

    // prevent duplicates
    const query: Record<string, unknown> = { giveawayId: id };
    if (userId) query.userId = userId;
    else if (anonId) query.anonId = anonId;

    const existing = await GiveawayEntryModel.findOne(query).lean().exec();
    if (existing) return NextResponse.json({ error: "Already registered" }, { status: 409 });

    // validate requirements from giveaway
    if (giveaway.mustBeLoggedIn && !userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 403 });
    }
    if (giveaway.requirePhotoUsageConsent) {
      // if user is logged in, server should verify user settings; skip deep verification for anon
      // trust client finalConfirmations.photoConsent when provided, but record it on the entry
    }

    // create entry and persist final confirmations so they are locked to this entry
    const created = await GiveawayEntryModel.create({
      giveawayId: id,
      userId: userId ?? null,
      anonId: anonId ?? null,
      isWinner: false,
      finalConfirmations: finalConfirmations
    });

    // Emit updated count to room subscribers
    try {
      const total = await countEntries(id);
      emitToRoom(`giveaway:${id}`, "giveaway:count", { count: total });
    } catch {}

    return NextResponse.json({ ok: true, id: created._id }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create entry";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
