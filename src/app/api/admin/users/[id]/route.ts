import { NextResponse } from "next/server";
import { getPublicUserProfile } from "@/lib/controllers/userController";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    // Simulate fetching own profile
    const result = await getPublicUserProfile(id, id);
    if (!result) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }
    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    console.error("/api/users/[id] error", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
