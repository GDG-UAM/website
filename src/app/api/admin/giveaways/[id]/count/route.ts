import { NextResponse } from "next/server";
import { countEntries } from "@/lib/controllers/giveawayController";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const total = await countEntries(id);
    return NextResponse.json({ count: total });
  } catch {
    return NextResponse.json({ error: "Failed to count" }, { status: 500 });
  }
}
