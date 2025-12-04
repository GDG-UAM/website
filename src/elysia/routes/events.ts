import { Elysia, t } from "elysia";
import { listEvents, getEventBySlug, SortTypes } from "@/lib/controllers/eventController";
import type { EventDateStatus } from "@/lib/models/Event";
import { EventsListResponse, EventDetailResponse } from "../models/events";

export const eventsRoutes = new Elysia({ prefix: "/events" })
  .derive(({ set }) => ({
    status: (code: 200 | 401 | 403 | 404 | 500 | 429, response) => {
      set.status = code;
      return response;
    }
  }))
  .get(
    "/",
    async ({ query: { dateStatus, page, pageSize, sort }, status }) => {
      try {
        const data = await listEvents({
          status: "published",
          dateStatus: dateStatus as EventDateStatus,
          page,
          pageSize,
          sort: sort as SortTypes
        });

        if (data && Array.isArray(data.items)) {
          const items = data.items.map((item) => {
            if (item && typeof item === "object") {
              const obj = { ...(item as unknown as Record<string, unknown>) };
              delete obj.__v;
              delete obj._id;
              delete obj.status;
              delete obj.createdAt;
              delete obj.updatedAt;
              return status(200, obj);
            }
            return item;
          });
          return status(200, { ...data, items });
        }
        return data;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to list events";
        return status(500, { error: msg });
      }
    },
    {
      query: t.Object({
        dateStatus: t.Optional(
          t.Union([t.Literal("past"), t.Literal("upcoming")], { default: "upcoming" })
        ),
        page: t.Optional(t.Number({ default: 1, minimum: 1 })),
        pageSize: t.Optional(t.Number({ default: 10, minimum: 1, maximum: 100 })),
        sort: t.Optional(t.Union([t.Literal("oldest"), t.Literal("newest")], { default: "newest" }))
      }),
      // .transform((body) => ({
      //     page: clamp(body.page, 1),
      //     pageSize: clamp(body.pageSize, 1, 100)
      // }))
      response: {
        200: EventsListResponse,
        500: t.Object({ error: t.String() })
      }
    }
  )
  .get(
    "/:id",
    async ({ params: { id }, status }) => {
      const slug = decodeURIComponent(id || "")
        .trim()
        .toLowerCase();
      const isValidSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);

      if (!isValidSlug) return status(400, { error: "Invalid slug" });

      try {
        const event = await getEventBySlug(slug, true);
        if (!event) return status(404, { error: "Event not found" });
        return status(200, event);
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
        200: EventDetailResponse,
        400: t.Object({ error: t.String() }),
        404: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String() })
      }
    }
  );
