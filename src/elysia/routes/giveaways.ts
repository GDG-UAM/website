import { Elysia, t } from "elysia";
import { getSession } from "../utils/auth";
import {
  listUserActiveParticipations,
  getGiveaway,
  countEntries
} from "@/lib/controllers/giveawayController";
import GiveawayEntryModel from "@/lib/models/GiveawayEntry";
import GiveawayModel from "@/lib/models/Giveaway";
import { emitToRoom } from "@/lib/realtime/io";
import {
  UserParticipation,
  GiveawayPublic,
  CreateEntryBody,
  CreateEntryResponse
} from "../models/giveaways";

export const giveawaysRoutes = new Elysia({ prefix: "/giveaways" })
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
    "/participating",
    async ({ user, status }) => {
      try {
        if (!user?.id) return status(401, { error: "Unauthorized" });
        const userId = user.id;

        const participations = await listUserActiveParticipations(userId);
        const requirePhotoUsageConsent = participations.some(
          (p) =>
            !!(p.giveaway as unknown as { requirePhotoUsageConsent?: boolean })
              .requirePhotoUsageConsent
        );
        const requireProfilePublic = participations.some(
          (p) =>
            !!(p.giveaway as unknown as { requireProfilePublic?: boolean }).requireProfilePublic
        );

        return status(200, {
          participating: participations.length > 0,
          participations: participations as typeof UserParticipation.static.participations,
          requirePhotoUsageConsent,
          requireProfilePublic
        });
      } catch (e) {
        return status(500, { error: e instanceof Error ? e.message : "error" });
      }
    },
    {
      response: {
        200: UserParticipation,
        401: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String() })
      }
    }
  )
  .get(
    "/:id",
    async ({ params: { id }, status }) => {
      try {
        const g = await getGiveaway(id);
        // expose only the public fields the client needs
        return status(200, {
          id: (g._id || g.id).toString(),
          title: g.title,
          mustBeLoggedIn: !!g.mustBeLoggedIn,
          requirePhotoUsageConsent: !!g.requirePhotoUsageConsent,
          requireProfilePublic: !!g.requireProfilePublic,
          startAt: g.startAt ?? null,
          endAt: g.endAt ?? null,
          durationS: g.durationS ?? null,
          remainingS:
            ("remainingS" in g
              ? (g as unknown as { remainingS?: number | null }).remainingS
              : null) ?? null,
          status: g.status ?? null
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Giveaway not found";
        return status(404, { error: msg });
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      response: {
        200: GiveawayPublic,
        404: t.Object({ error: t.String() })
      }
    }
  )
  .get(
    "/:id/entries",
    async ({ params: { id }, query: { anonId }, user, status }) => {
      try {
        const userId = user?.id;

        const query: Record<string, unknown> = { giveawayId: id };
        if (userId) query.userId = userId;
        else if (anonId) query.anonId = anonId;

        const existing = await GiveawayEntryModel.findOne(query).lean().exec();
        return status(200, { registered: !!existing });
      } catch {
        return status(200, { registered: false });
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      query: t.Object({
        anonId: t.Optional(t.String())
      }),
      response: {
        200: t.Object({ registered: t.Boolean() })
      }
    }
  )
  .get(
    "/:id/entries/check",
    async ({ params: { id }, query: { anonId }, user, status }) => {
      try {
        const userId = user?.id;

        const query: Record<string, unknown> = { giveawayId: id };
        if (userId) query.userId = userId;
        else if (anonId) query.anonId = anonId;

        const existing = await GiveawayEntryModel.findOne(query).lean().exec();
        return status(200, { registered: !!existing });
      } catch {
        return status(200, { registered: false });
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      query: t.Object({
        anonId: t.Optional(t.String())
      }),
      response: {
        200: t.Object({ registered: t.Boolean() })
      }
    }
  )
  .post(
    "/:id/entries",
    async ({ params: { id }, body, user, status }) => {
      try {
        const { acceptTerms, finalConfirmations, anonId: bodyAnonId } = body;
        if (!acceptTerms) return status(400, { error: "Terms not accepted" });

        const userId = user?.id;

        // prefer server-side anon id from cookie if present, otherwise client may send anonId
        const anonId = bodyAnonId ?? null;

        // check giveaway exists
        const giveaway = await GiveawayModel.findById(id).lean().exec();
        if (!giveaway) return status(404, { error: "Giveaway not found" });

        // validate that the giveaway is open for joining
        const now = Date.now();
        const endAtMs = giveaway.endAt
          ? new Date(giveaway.endAt as unknown as string).getTime()
          : null;
        const hasEndAt = typeof endAtMs === "number" && !Number.isNaN(endAtMs);
        const remaining =
          typeof (giveaway as unknown as { remainingS?: number | null }).remainingS === "number"
            ? (giveaway as unknown as { remainingS?: number | null }).remainingS
            : null;
        const startAtMs = giveaway.startAt
          ? new Date(giveaway.startAt as unknown as string).getTime()
          : null;
        const durationExpiredActive =
          !hasEndAt &&
          giveaway.status === "active" &&
          typeof startAtMs === "number" &&
          typeof remaining === "number" &&
          startAtMs + remaining * 1000 <= now;
        const isClosedByTime =
          // explicit closed/cancelled statuses
          giveaway.status === "closed" ||
          giveaway.status === "cancelled" ||
          // endAt mode: end time passed
          (hasEndAt && endAtMs! <= now) ||
          // duration mode: remainingS missing/<=0 or active period elapsed using startAt+remainingS
          (!hasEndAt && (remaining == null || remaining <= 0 || durationExpiredActive));
        if (isClosedByTime) return status(403, { error: "Giveaway is closed" });

        // prevent duplicates
        const query: Record<string, unknown> = { giveawayId: id };
        if (userId) query.userId = userId;
        else if (anonId) query.anonId = anonId;

        const existing = await GiveawayEntryModel.findOne(query).lean().exec();
        if (existing) return status(409, { error: "Already registered" });

        // validate requirements from giveaway
        if (giveaway.mustBeLoggedIn && !userId)
          return status(403, { error: "Authentication required" });
        if (giveaway.requirePhotoUsageConsent) {
          // if user is logged in, server should verify user settings; skip deep verification for anon
          // trust client finalConfirmations.photoConsent when provided, but record it on the entry
        }

        // create entry and persist final confirmations so they are locked to this entry
        const created = await GiveawayEntryModel.create({
          giveawayId: id,
          userId: userId ?? null,
          anonId: anonId ?? null,
          isWinner: false,
          finalConfirmations: finalConfirmations ?? {}
        });

        // Emit updated count to room subscribers
        try {
          const total = await countEntries(id);
          emitToRoom(`giveaway:${id}`, "giveaway:count", { count: total });
        } catch {}

        return status(200, { ok: true, id: created._id });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to create entry";
        return status(500, { error: msg });
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      body: CreateEntryBody,
      response: {
        200: CreateEntryResponse,
        400: t.Object({ error: t.String() }),
        403: t.Object({ error: t.String() }),
        404: t.Object({ error: t.String() }),
        409: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String() })
      }
    }
  );
