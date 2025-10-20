import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buildUserDataExport } from "@/lib/controllers/dataExportController";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = typeof session?.user?.id === "string" ? (session.user.id as string) : undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { arrayBuffer, filename, nextAllowed } = await buildUserDataExport(userId);
    const blob = new Blob([arrayBuffer], { type: "application/zip" });
    return new NextResponse(blob, {
      status: 200,
      headers: new Headers({
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=\"${filename}\"`,
        "X-Data-Export-Next-Allowed": nextAllowed.toISOString()
      })
    });
  } catch (e: unknown) {
    const err = e as { status?: number; nextAvailable?: string; message?: string };
    if (err?.status === 404) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (err?.status === 429) {
      return NextResponse.json(
        { error: "Too Many Requests", nextAvailable: err.nextAvailable },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
