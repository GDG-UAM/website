import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ingestTelemetryBatch, IncomingEvent } from "@/lib/controllers/telemetryController";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = (await req.json()) as unknown;
    const batch: IncomingEvent[] = Array.isArray(body)
      ? (body as IncomingEvent[])
      : [body as IncomingEvent];

    // If user is authenticated and has consent, compute pseudoUserId
    const rawUser = (session?.user ?? {}) as Record<string, unknown>;
    const userId = typeof rawUser.id === "string" ? rawUser.id : undefined;
    const allowAnon =
      typeof rawUser.allowAnonUsage === "boolean"
        ? rawUser.allowAnonUsage && (rawUser.active as boolean)
        : false;

    const saved = await ingestTelemetryBatch(batch, { userId, allowAnon });
    return NextResponse.json({ saved }, { status: 200 });
  } catch (err) {
    console.error("/api/telemetry POST failed", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
