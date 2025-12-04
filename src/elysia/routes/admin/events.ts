import { Elysia, t } from "elysia";
import { getSession } from "../../utils/auth";
import { verifyCsrf } from "@/lib/controllers/csrfController";
import {
  createEvent,
  listEvents,
  getEventByIdForEdit,
  updateEvent,
  deleteEvent,
  type EventInput,
  type SortTypes
} from "@/lib/controllers/eventController";
import type { EventStatus } from "@/lib/models/Event";
import {
  AdminEventsListResponse,
  AdminCreateEventBody,
  AdminUpdateEventBody,
  AdminEventItem
} from "../../models/admin/events";

export const adminEventsRoutes = new Elysia({ prefix: "/events" })
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
    async ({ query: { status, page, pageSize, sort }, status: httpStatus }) => {
      const resolvedStatus = status === "draft" ? "draft" : "published";
      const pageNum = Math.max(1, page || 1);
      const pageSizeNum = Math.max(1, Math.min(pageSize || 10, 100));
      const sortType = sort === "oldest" ? "oldest" : "newest";

      try {
        const data = await listEvents({
          status: resolvedStatus as EventStatus,
          page: pageNum,
          pageSize: pageSizeNum,
          sort: sortType as SortTypes
        });
        return httpStatus(200, data);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to list events";
        return httpStatus(500, { error: msg });
      }
    },
    {
      query: t.Object({
        status: t.Optional(t.String()),
        page: t.Optional(t.Number({ default: 1, minimum: 1 })),
        pageSize: t.Optional(t.Number({ default: 10, minimum: 1, maximum: 100 })),
        sort: t.Optional(t.Union([t.Literal("newest"), t.Literal("oldest")], { default: "newest" }))
      }),
      response: {
        200: AdminEventsListResponse,
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

        const raw = body;
        const eventBody: EventInput = {
          ...raw,
          markdownContent: raw.markdownContent ?? "",
          title: raw.title || "",
          description: raw.description || "",
          date: raw.date ? new Date(raw.date) : new Date(),
          location: raw.location || "",
          status: raw.status as EventStatus,
          image: raw.image,
          slug: raw.slug,
          url: raw.url,
          blogUrl: raw.blogUrl
        };

        const created = await createEvent(eventBody);
        return status(200, created as typeof AdminEventItem.static);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to create event";
        return status(400, { error: msg });
      }
    },
    {
      headers: t.Object({
        "x-csrf-token": t.String()
      }),
      body: AdminCreateEventBody,
      response: {
        200: AdminEventItem,
        400: t.Object({ error: t.String() }),
        403: t.Object({ error: t.String() })
      }
    }
  )
  .get(
    "/:id",
    async ({ params: { id }, status }) => {
      try {
        const event = await getEventByIdForEdit(id);
        if (!event) return status(404, { error: "Not found" });
        return status(200, event as typeof AdminEventItem.static);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to fetch event";
        return status(500, { error: msg });
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      response: {
        200: AdminEventItem,
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

        const updated = await updateEvent(id, body as Partial<EventInput>);
        if (!updated) return status(404, { error: "Not found" });
        return status(200, updated as typeof AdminEventItem.static);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to update event";
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
      body: AdminUpdateEventBody,
      response: {
        200: AdminEventItem,
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

        const ok = await deleteEvent(id);
        if (!ok) return status(404, { error: "Not found" });
        return status(200, { success: true });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to delete event";
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
