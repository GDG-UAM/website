import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import GiveawayEntryModel from "@/lib/models/GiveawayEntry";

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
