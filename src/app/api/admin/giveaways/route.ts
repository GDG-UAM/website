import { NextRequest, NextResponse } from "next/server";
import { listGiveaways, createGiveaway } from "@/lib/controllers/giveawayController";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyCsrf } from "@/lib/controllers/csrfController";

export async function GET() {
  try {
    const data = await listGiveaways();
    return NextResponse.json({ items: data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to list giveaways";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string | undefined;
    const token = req.headers.get("x-csrf-token") || "";
    if (!userId || !token || !(await verifyCsrf(token, userId))) {
      return NextResponse.json({ error: "Invalid CSRF" }, { status: 403 });
    }
    const body = await req.json();
    const created = await createGiveaway(body);
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create giveaway";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
