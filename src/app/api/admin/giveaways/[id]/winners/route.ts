import { NextRequest, NextResponse } from "next/server";
import {
  getWinnersWithDetails,
  drawWinners,
  rerollWinner
} from "@/lib/controllers/giveawayController";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyCsrf } from "@/lib/controllers/csrfController";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await getWinnersWithDetails(id);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to load winners" }, { status: 400 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string | undefined;
    const token = req.headers.get("x-csrf-token") || "";
    if (!userId || !token || !(await verifyCsrf(token, userId))) {
      return NextResponse.json({ error: "Invalid CSRF" }, { status: 403 });
    }
    const { id } = await params;
    const data = await drawWinners(id);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to draw winners" }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Reroll a specific winner position deterministically with a new per-position seed
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string | undefined;
    const token = req.headers.get("x-csrf-token") || "";
    if (!userId || !token || !(await verifyCsrf(token, userId))) {
      return NextResponse.json({ error: "Invalid CSRF" }, { status: 403 });
    }
    const { id } = await params;
    const body = await req.json();
    const position = Number(body.position);
    if (!Number.isInteger(position) || position < 0)
      return NextResponse.json({ error: "Invalid position" }, { status: 400 });
    const data = await rerollWinner(id, position);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to reroll" }, { status: 400 });
  }
}
