import { Elysia, t } from "elysia";
import { getSession } from "../../utils/auth";
import { verifyCsrf } from "@/lib/controllers/csrfController";
import {
  createLink,
  listLinks,
  getLinkById,
  updateLink,
  deleteLink,
  type LinkInput
} from "@/lib/controllers/linkController";
import { LinksListResponse, LinkInputBody, LinkItem } from "../../models/admin/links";

export const adminLinksRoutes = new Elysia({ prefix: "/links" })
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
    async ({ query: { page, pageSize, search, activeOnly }, status }) => {
      const pageNum = Math.max(1, page || 1);
      const pageSizeNum = Math.max(1, Math.min(pageSize || 50, 100));
      const active = activeOnly === "true";

      try {
        const data = await listLinks({
          page: pageNum,
          pageSize: pageSizeNum,
          search,
          activeOnly: active
        });
        return status(200, data);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to list links";
        return status(500, { error: msg });
      }
    },
    {
      query: t.Object({
        page: t.Optional(t.Number({ default: 1, minimum: 1 })),
        pageSize: t.Optional(t.Number({ default: 50, minimum: 1, maximum: 100 })),
        search: t.Optional(t.String()),
        activeOnly: t.Optional(t.String())
      }),
      response: {
        200: LinksListResponse,
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

        const { slug, destination, title } = body;
        if (!slug || !destination || !title)
          return status(400, { error: "Missing required fields: slug, destination, title" });

        const created = await createLink(body as LinkInput);
        return status(200, created as typeof LinkItem.static);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to create link";
        return status(400, { error: msg });
      }
    },
    {
      headers: t.Object({
        "x-csrf-token": t.String()
      }),
      body: LinkInputBody,
      response: {
        200: LinkItem,
        400: t.Object({ error: t.String() }),
        403: t.Object({ error: t.String() })
      }
    }
  )
  .get(
    "/:id",
    async ({ params: { id }, status }) => {
      try {
        const link = await getLinkById(id);
        if (!link) return status(404, { error: "Not found" });
        return link;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to fetch link";
        return status(500, { error: msg });
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      response: {
        200: LinkItem,
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

        const updated = await updateLink(id, body as Partial<LinkInput>);
        if (!updated) return status(404, { error: "Not found" });
        return updated;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to update link";
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
      body: t.Partial(LinkInputBody),
      response: {
        200: LinkItem,
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

        const ok = await deleteLink(id);
        if (!ok) return status(404, { error: "Not found" });
        return status(200, { success: true });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to delete link";
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
