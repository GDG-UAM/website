import { Elysia, t } from "elysia";
import { getSession } from "../../utils/auth";
import { verifyCsrf } from "@/lib/controllers/csrfController";
import {
  createHackathon,
  listHackathons,
  getHackathonById,
  updateHackathon,
  deleteHackathon,
  type HackathonInput,
  type SortTypes
} from "@/lib/controllers/hackathonController";
import { emitToRoom } from "@/lib/realtime/io";
import {
  AdminHackathonsListResponse,
  AdminCreateHackathonBody,
  AdminUpdateHackathonBody,
  AdminHackathonItem
} from "../../models/admin/hackathons";

export const adminHackathonsRoutes = new Elysia({ prefix: "/hackathons" })
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
    async ({ query: { page, pageSize, sort }, status: httpStatus }) => {
      const pageNum = Math.max(1, page || 1);
      const pageSizeNum = Math.max(1, Math.min(pageSize || 10, 100));
      const sortType = sort === "oldest" ? "oldest" : "newest";

      try {
        const data = await listHackathons({
          page: pageNum,
          pageSize: pageSizeNum,
          sort: sortType as SortTypes
        });
        return httpStatus(200, data);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to list hackathons";
        return httpStatus(500, { error: msg });
      }
    },
    {
      query: t.Object({
        page: t.Optional(t.Number({ default: 1, minimum: 1 })),
        pageSize: t.Optional(t.Number({ default: 10, minimum: 1, maximum: 100 })),
        sort: t.Optional(t.Union([t.Literal("newest"), t.Literal("oldest")], { default: "newest" }))
      }),
      response: {
        200: AdminHackathonsListResponse,
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

        const hackathonBody: HackathonInput = {
          title: body.title,
          date: new Date(body.date),
          endDate: new Date(body.endDate),
          location: body.location,
          intermission: body.intermission
        };

        const created = await createHackathon(hackathonBody);
        return status(200, created as typeof AdminHackathonItem.static);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to create hackathon";
        return status(400, { error: msg });
      }
    },
    {
      headers: t.Object({
        "x-csrf-token": t.String()
      }),
      body: AdminCreateHackathonBody,
      response: {
        200: AdminHackathonItem,
        400: t.Object({ error: t.String() }),
        403: t.Object({ error: t.String() })
      }
    }
  )
  .get(
    "/:id",
    async ({ params: { id }, status }) => {
      try {
        const hackathon = await getHackathonById(id);
        if (!hackathon) return status(404, { error: "Not found" });
        return status(200, hackathon as typeof AdminHackathonItem.static);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to fetch hackathon";
        return status(500, { error: msg });
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      response: {
        200: AdminHackathonItem,
        404: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String() })
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

        const updateBody: Partial<HackathonInput> = {};
        if (body.title) updateBody.title = body.title;
        if (body.date) updateBody.date = new Date(body.date);
        if (body.endDate) updateBody.endDate = new Date(body.endDate);
        if (body.location) updateBody.location = body.location;
        if (body.intermission) updateBody.intermission = body.intermission;

        const updated = await updateHackathon(id, updateBody);
        if (!updated) return status(404, { error: "Not found" });

        // Broadcast update via Socket.io
        if (body.intermission) {
          emitToRoom(`hackathon:${id}`, "intermission_update", updated.intermission);
        }

        return status(200, updated as typeof AdminHackathonItem.static);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to update hackathon";
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
      body: AdminUpdateHackathonBody,
      response: {
        200: AdminHackathonItem,
        400: t.Object({ error: t.String() }),
        403: t.Object({ error: t.String() }),
        404: t.Object({ error: t.String() })
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

        const ok = await deleteHackathon(id);
        if (!ok) return status(404, { error: "Not found" });
        return status(200, { success: true });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to delete hackathon";
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
      response: {
        200: t.Object({ success: t.Boolean() }),
        400: t.Object({ error: t.String() }),
        403: t.Object({ error: t.String() }),
        404: t.Object({ error: t.String() })
      }
    }
  );
