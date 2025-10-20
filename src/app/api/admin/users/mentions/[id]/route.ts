import { NextResponse } from "next/server";
import { getUserMentionData } from "@/lib/controllers/userController";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const result = await getUserMentionData(id, true);
    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    console.error("/api/users/mentions/[id] error", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
