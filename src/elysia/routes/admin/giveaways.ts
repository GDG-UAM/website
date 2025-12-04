import { Elysia, t } from "elysia";
import { getSession } from "../../utils/auth";
import { verifyCsrf } from "@/lib/controllers/csrfController";
import { emitToRoom } from "@/lib/realtime/io";
import {
  listGiveaways,
  createGiveaway,
  getGiveaway,
  updateGiveaway,
  deleteGiveaway,
  countEntries,
  getWinnersWithDetails,
  drawWinners,
  rerollWinner,
  type GiveawayInput
} from "@/lib/controllers/giveawayController";
import {
  GiveawaysListResponse,
  GiveawayInputBody,
  GiveawayItem,
  GiveawayWinnersResponse,
  RerollWinnerBody
} from "../../models/admin/giveaways";

export const adminGiveawaysRoutes = new Elysia({ prefix: "/giveaways" })
  .derive(async () => {
    const session = await getSession();
    return {
      user: session?.user ?? null,
      session
    };
  })
  .derive(({ set }) => ({
    status: (code: 200 | 401 | 403 | 404 | 500 | 429, response) => {
      set.status = code;
      return response;
    }
  }))
  .get(
    "/",
    async ({ status }) => {
      try {
        const data = await listGiveaways();
        return status(200, { items: data as (typeof GiveawayItem.static)[] });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to list giveaways";
        return status(500, { error: msg });
      }
    },
    {
      response: {
        200: GiveawaysListResponse,
        500: t.Object({ error: t.String() })
      }
    }
  )
  .post(
    "/",
    async ({ headers, body, user, status }) => {
      try {
        const userId = user?.id;
        const token = headers["x-csrf-token"];

        if (!userId || !token || !(await verifyCsrf(token, userId)))
          return status(403, { error: "Invalid CSRF" });

        const created = await createGiveaway(body as GiveawayInput);
        return status(200, created as typeof GiveawayItem.static);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to create giveaway";
        return status(400, { error: msg });
      }
    },
    {
      headers: t.Object({
        "x-csrf-token": t.String()
      }),
      body: GiveawayInputBody,
      response: {
        200: GiveawayItem,
        400: t.Object({ error: t.String() }),
        403: t.Object({ error: t.String() })
      }
    }
  )
  .get(
    "/:id",
    async ({ params: { id }, status }) => {
      try {
        const data = await getGiveaway(id);
        return status(200, data as typeof GiveawayItem.static);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to get giveaway";
        return status(404, { error: msg });
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      response: {
        200: GiveawayItem,
        404: t.Object({ error: t.String() })
      }
    }
  )
  .patch(
    "/:id",
    async ({ params: { id }, headers, body, user, status }) => {
      try {
        const userId = user?.id;
        const token = headers["x-csrf-token"];

        if (!userId || !token || !(await verifyCsrf(token, userId)))
          return status(403, { error: "Invalid CSRF" });

        const current = await getGiveaway(id);
        const updateBody = body;

        type Status = "draft" | "active" | "paused" | "closed" | "cancelled";
        const reqStatus = updateBody.status as Status | undefined;

        const hasEndAt =
          Object.prototype.hasOwnProperty.call(updateBody, "endAt") && !!updateBody.endAt;
        const hasDurationS =
          Object.prototype.hasOwnProperty.call(updateBody, "durationS") && !!updateBody.durationS;

        const reqEndAt = (updateBody.endAt as string | null | undefined) ?? undefined;
        const reqDurationS =
          updateBody.durationS === undefined
            ? undefined
            : updateBody.durationS === null
              ? null
              : Number(updateBody.durationS);

        type Upd = GiveawayInput & { remainingS?: number | null };
        const update: Upd = {} as Upd;

        for (const [k, v] of Object.entries(updateBody)) {
          if (["endAt", "durationS", "startAt", "remainingS", "status"].includes(k)) continue;
          update[k] = v;
        }

        const now = Date.now();
        const curStartAt = current.startAt ? current.startAt.getTime() : null;
        const curDurationS = typeof current.durationS === "number" ? current.durationS : null;
        const curRemainingS = typeof current.remainingS === "number" ? current.remainingS : null;

        if (hasEndAt && hasDurationS && reqEndAt && reqDurationS)
          return status(400, {
            error: "Invalid configuration: endAt and durationS cannot both be set"
          });

        if (hasEndAt) {
          update.endAt = reqEndAt === null ? null : new Date(String(reqEndAt)).toISOString();
          update.durationS = null;
          update.remainingS = null;
          update.startAt = null;
          if (reqStatus !== undefined) update.status = reqStatus;
        } else if (hasDurationS) {
          const requestedDuration =
            reqDurationS === null ? null : Math.max(0, Math.floor(Number(reqDurationS)));
          update.endAt = null;
          update.durationS = requestedDuration;

          if (requestedDuration === null) {
            update.remainingS = null;
            update.startAt = null;
            if (reqStatus !== undefined) update.status = reqStatus;
          } else {
            update.remainingS = requestedDuration;
            if (reqStatus === "active") {
              update.status = "active";
              update.startAt = new Date(now).toISOString();
            } else if (reqStatus === "paused") {
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
            } else
              update.startAt = current.status === "active" ? new Date(now).toISOString() : null;
          }
        } else {
          if (reqStatus !== undefined) {
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
              } else update.status = reqStatus;
            } else update.status = reqStatus;
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
            remainingS: updated.remainingS ?? null
          };
          emitToRoom(`giveaway:${id}`, "giveaway:config", payload);
          emitToRoom(`giveaway:${id}`, "giveaway:status", { id, status: updated.status });
        } catch {}

        return status(200, updated as typeof GiveawayItem.static);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to update giveaway";
        return status(400, { error: msg });
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      headers: t.Object({
        "x-csrf-token": t.String()
      }),
      body: GiveawayInputBody,
      response: {
        200: GiveawayItem,
        400: t.Object({ error: t.String() }),
        403: t.Object({ error: t.String() })
      }
    }
  )
  .delete(
    "/:id",
    async ({ params: { id }, headers, user, status }) => {
      try {
        const userId = user?.id;
        const token = headers["x-csrf-token"];

        if (!userId || !token || !(await verifyCsrf(token, userId)))
          return status(403, { error: "Invalid CSRF" });

        await deleteGiveaway(id);
        return status(200, { success: true });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to delete giveaway";
        return status(404, { error: msg });
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      headers: t.Object({
        "x-csrf-token": t.String()
      }),
      response: {
        200: t.Object({ success: t.Boolean() }),
        403: t.Object({ error: t.String() }),
        404: t.Object({ error: t.String() })
      }
    }
  )
  .get(
    "/:id/count",
    async ({ params: { id }, status }) => {
      try {
        const total = await countEntries(id);
        return status(200, { count: total });
      } catch {
        return status(500, { error: "Failed to count" });
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      response: {
        200: t.Object({ count: t.Number() }),
        500: t.Object({ error: t.String() })
      }
    }
  )
  .get(
    "/:id/winners",
    async ({ params: { id }, status }) => {
      try {
        const data = await getWinnersWithDetails(id);
        return status(200, data);
      } catch {
        return status(400, { error: "Failed to load winners" });
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      response: {
        200: GiveawayWinnersResponse,
        400: t.Object({ error: t.String() })
      }
    }
  )
  .post(
    "/:id/winners",
    async ({ params: { id }, headers, user, status }) => {
      try {
        const userId = user?.id;
        const token = headers["x-csrf-token"];

        if (!userId || !token || !(await verifyCsrf(token, userId)))
          return status(403, { error: "Invalid CSRF" });

        const data = await drawWinners(id);
        return status(200, data);
      } catch {
        return status(400, { error: "Failed to draw winners" });
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      headers: t.Object({
        "x-csrf-token": t.String()
      }),
      response: {
        200: GiveawayWinnersResponse,
        400: t.Object({ error: t.String() }),
        403: t.Object({ error: t.String() })
      }
    }
  )
  .patch(
    "/:id/winners",
    async ({ params: { id }, headers, body, user, status }) => {
      try {
        const userId = user?.id;
        const token = headers["x-csrf-token"];

        if (!userId || !token || !(await verifyCsrf(token, userId)))
          return status(403, { error: "Invalid CSRF" });

        const { position } = body;
        const pos = Number(position);
        if (!Number.isInteger(pos) || pos < 0) return status(400, { error: "Invalid position" });

        const data = await rerollWinner(id, pos);
        return status(200, data);
      } catch {
        return status(400, { error: "Failed to reroll" });
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      headers: t.Object({
        "x-csrf-token": t.String()
      }),
      body: RerollWinnerBody,
      response: {
        200: GiveawayWinnersResponse,
        400: t.Object({ error: t.String() }),
        403: t.Object({ error: t.String() })
      }
    }
  );
