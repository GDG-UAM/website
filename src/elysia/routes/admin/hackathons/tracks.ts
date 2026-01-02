import { Elysia, t } from "elysia";
import { ITrack } from "@/lib/models/Track";
import { getSession } from "../../../utils/auth";
import { verifyCsrf } from "@/lib/controllers/csrfController";
import {
  createTrack,
  listTracks,
  updateTrack,
  deleteTrack,
  getTrackById
} from "@/lib/controllers/trackController";
import {
  AdminTracksListResponse,
  AdminCreateTrackBody,
  AdminUpdateTrackBody,
  AdminTrackItem
} from "../../../models/admin/tracks";

const mapTrackToAdmin = (track: ITrack): typeof AdminTrackItem.static => ({
  _id: track._id.toString(),
  name: track.name,
  hackathonId: track.hackathonId.toString(),
  judges: track.judges?.map((j) => j.toString()),
  rubrics: track.rubrics.map((r) => ({
    name: r.name,
    maxScore: r.maxScore,
    weight: r.weight
  })),
  createdAt: track.createdAt.toISOString(),
  updatedAt: track.updatedAt.toISOString()
});

export const adminTracksRoutes = new Elysia({ prefix: "/tracks" })
  .derive(async () => {
    const session = await getSession();
    return {
      user: session?.user ?? null,
      session
    };
  })
  .derive(({ set }) => ({
    status: (code: 200 | 201 | 401 | 403 | 404 | 500 | 429, response) => {
      set.status = code;
      return response;
    }
  }))
  .get(
    "/",
    async ({ query: { hackathonId }, status }) => {
      try {
        const tracks = await listTracks(hackathonId);
        return status(200, tracks.map(mapTrackToAdmin));
      } catch (e) {
        return status(500, { error: e instanceof Error ? e.message : "Failed to list tracks" });
      }
    },
    {
      query: t.Object({
        hackathonId: t.String()
      }),
      response: {
        200: AdminTracksListResponse,
        500: t.Object({ error: t.String() })
      }
    }
  )
  .post(
    "/",
    async ({ headers, body, user, query: { hackathonId }, status }) => {
      try {
        const userId = user?.id;
        const token = headers["x-csrf-token"];
        if (!userId || !token || !(await verifyCsrf(token, userId)))
          return status(403, { error: "Invalid CSRF" });

        const created = await createTrack({ ...body, hackathonId });
        return status(200, mapTrackToAdmin(created));
      } catch (e) {
        return status(500, { error: e instanceof Error ? e.message : "Failed to create track" });
      }
    },
    {
      query: t.Object({
        hackathonId: t.String()
      }),
      headers: t.Object({ "x-csrf-token": t.String() }),
      body: AdminCreateTrackBody,
      response: {
        200: AdminTrackItem,
        403: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String() })
      }
    }
  )
  .get(
    "/:trackId",
    async ({ params: { trackId }, status }) => {
      try {
        const track = await getTrackById(trackId);
        if (!track) return status(404, { error: "Track not found" });
        return status(200, mapTrackToAdmin(track));
      } catch (e) {
        return status(500, { error: e instanceof Error ? e.message : "Failed to get track" });
      }
    },
    {
      params: t.Object({
        trackId: t.String()
      }),
      response: {
        200: AdminTrackItem,
        500: t.Object({ error: t.String() })
      }
    }
  )
  .patch(
    "/:trackId",
    async ({ params: { trackId }, headers, body, user, status }) => {
      try {
        const userId = user?.id;
        const token = headers["x-csrf-token"];
        if (!userId || !token || !(await verifyCsrf(token, userId)))
          return status(403, { error: "Invalid CSRF" });

        const updated = await updateTrack(trackId, body);
        if (!updated) return status(404, { error: "Track not found" });
        return status(200, mapTrackToAdmin(updated));
      } catch (e) {
        return status(500, { error: e instanceof Error ? e.message : "Failed to update track" });
      }
    },
    {
      params: t.Object({ trackId: t.String() }),
      headers: t.Object({ "x-csrf-token": t.String() }),
      body: AdminUpdateTrackBody,
      response: {
        200: AdminTrackItem,
        403: t.Object({ error: t.String() }),
        404: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String() })
      }
    }
  )
  .delete(
    "/:trackId",
    async ({ params: { trackId }, headers, user, status }) => {
      try {
        const userId = user?.id;
        const token = headers["x-csrf-token"];
        if (!userId || !token || !(await verifyCsrf(token, userId)))
          return status(403, { error: "Invalid CSRF" });

        const ok = await deleteTrack(trackId);
        if (!ok) return status(404, { error: "Track not found" });
        return status(200, { success: true });
      } catch (e) {
        return status(500, { error: e instanceof Error ? e.message : "Failed to delete track" });
      }
    },
    {
      params: t.Object({ trackId: t.String() }),
      headers: t.Object({ "x-csrf-token": t.String() }),
      response: {
        200: t.Object({ success: t.Boolean() }),
        403: t.Object({ error: t.String() }),
        404: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String() })
      }
    }
  );
