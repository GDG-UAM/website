import { NextRequest, NextResponse } from "next/server";
import {
  getGiveaway,
  updateGiveaway,
  deleteGiveaway,
  GiveawayInput
} from "@/lib/controllers/giveawayController";
import type { IGiveaway } from "@/lib/models/Giveaway";
import { emitToRoom } from "@/lib/realtime/io";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyCsrf } from "@/lib/controllers/csrfController";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const data = await getGiveaway(id);
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to get giveaway";
    return NextResponse.json({ error: msg }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string | undefined;
    const token = req.headers.get("x-csrf-token") || "";
    if (!userId || !token || !(await verifyCsrf(token, userId))) {
      return NextResponse.json({ error: "Invalid CSRF" }, { status: 403 });
    }
    const { id } = await context.params;
    await deleteGiveaway(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to delete giveaway";
    return NextResponse.json({ error: msg }, { status: 404 });
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string | undefined;
    const token = req.headers.get("x-csrf-token") || "";
    if (!userId || !token || !(await verifyCsrf(token, userId))) {
      return NextResponse.json({ error: "Invalid CSRF" }, { status: 403 });
    }
    const { id } = await context.params;
    const body = (await req.json()) as Record<string, unknown>;

    const current = await getGiveaway(id);

    type Status = "draft" | "active" | "paused" | "closed" | "cancelled";
    const reqStatus = body.status as Status | undefined;

    const hasEndAt = Object.prototype.hasOwnProperty.call(body, "endAt") && !!body.endAt;
    const hasDurationS =
      Object.prototype.hasOwnProperty.call(body, "durationS") && !!body.durationS;

    const reqEndAt = (body.endAt as string | null | undefined) ?? undefined;
    const reqDurationS =
      body.durationS === undefined
        ? undefined
        : body.durationS === null
          ? null
          : Number(body.durationS);

    type Upd = GiveawayInput & { remainingS?: number | null };
    const update: Upd = {} as Upd;

    // Pass-through for non-timing fields (e.g., description) without strict checks
    for (const [k, v] of Object.entries(body)) {
      if (["endAt", "durationS", "startAt", "remainingS", "status"].includes(k)) continue;
      update[k] = v;
    }

    const now = Date.now();
    const curStartAt = current.startAt ? current.startAt.getTime() : null;
    const curDurationS = typeof current.durationS === "number" ? current.durationS : null;
    const curRemainingS =
      typeof (current as IGiveaway & { remainingS?: number | null }).remainingS === "number"
        ? (current as IGiveaway & { remainingS?: number | null }).remainingS!
        : null;

    // Only enforce exclusivity if both timing fields are being changed in this request
    if (hasEndAt && hasDurationS && reqEndAt && reqDurationS) {
      return NextResponse.json(
        { error: "Invalid configuration: endAt and durationS cannot both be set" },
        { status: 400 }
      );
    }

    if (hasEndAt) {
      // Switch to endAt mode
      update.endAt = reqEndAt === null ? null : new Date(String(reqEndAt)).toISOString();
      update.durationS = null;
      update.remainingS = null;
      update.startAt = null;

      if (reqStatus !== undefined) {
        // Be lenient: allow any status updates
        update.status = reqStatus;
      }
    } else if (hasDurationS) {
      // Switch to/update duration mode
      const requestedDuration =
        reqDurationS === null ? null : Math.max(0, Math.floor(Number(reqDurationS)));
      update.endAt = null;
      update.durationS = requestedDuration;

      if (requestedDuration === null) {
        update.remainingS = null;
        update.startAt = null;
        if (reqStatus !== undefined) update.status = reqStatus;
      } else {
        // If duration is explicitly provided, reset remaining
        update.remainingS = requestedDuration;

        if (reqStatus === "active") {
          update.status = "active";
          update.startAt = new Date(now).toISOString();
        } else if (reqStatus === "paused") {
          // Pause: compute remaining based on current if it was running
          let remaining = curRemainingS ?? requestedDuration;
          if (current.status === "active" && curStartAt != null) {
            const elapsed = Math.max(0, Math.floor((now - curStartAt) / 1000));
            const base = curRemainingS ?? curDurationS ?? requestedDuration;
            remaining = Math.max(0, base - elapsed);
          }
          update.status = "paused";
          update.remainingS = remaining;
          update.startAt = null;
        } else if (reqStatus !== undefined) {
          update.status = reqStatus;
        } else {
          // If status not provided, keep timer stopped unless currently active
          update.startAt = current.status === "active" ? new Date(now).toISOString() : null;
        }
      }
    } else {
      // No timing fields changed. Be lenient: allow status/description/etc.
      if (reqStatus !== undefined) {
        // If in duration mode, apply start/pause helpers; otherwise just set status
        if (current.durationS && !current.endAt) {
          if (reqStatus === "active") {
            const remaining = curRemainingS ?? current.durationS;
            update.status = "active";
            update.startAt = new Date(now).toISOString();
            update.remainingS = remaining;
          } else if (reqStatus === "paused") {
            let remaining = curRemainingS ?? current.durationS;
            if (current.status === "active" && curStartAt != null) {
              const elapsed = Math.max(0, Math.floor((now - curStartAt) / 1000));
              const base = curRemainingS ?? current.durationS;
              remaining = Math.max(0, base - elapsed);
            }
            update.status = "paused";
            update.remainingS = remaining;
            update.startAt = null;
          } else {
            update.status = reqStatus;
          }
        } else {
          // endAt mode or no timing configured: just set status
          update.status = reqStatus;
        }
      }
    }

    const updated = await updateGiveaway(id, update);

    try {
      const payload = {
        id,
        status: updated.status,
        startAt: updated.startAt,
        endAt: updated.endAt,
        durationS: updated.durationS,
        remainingS: (updated as IGiveaway & { remainingS?: number | null }).remainingS ?? null
      } as Record<string, unknown>;
      emitToRoom(`giveaway:${id}`, "giveaway:config", payload);
      emitToRoom(`giveaway:${id}`, "giveaway:status", { id, status: updated.status });
    } catch {}

    return NextResponse.json(updated);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update giveaway";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
