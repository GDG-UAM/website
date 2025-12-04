import { Elysia, t } from "elysia";
import { getSession } from "../../utils/auth";
import { verifyCsrf } from "@/lib/controllers/csrfController";
import {
  createArticle,
  listArticles,
  selectArticleLocale,
  deleteArticle,
  getArticleByIdForEdit,
  getArticleBySlug,
  updateArticle,
  type ArticleInput,
  type SortTypes
} from "@/lib/controllers/articleController";
import { mapsToObjects } from "@/lib/utils";
import type { ArticleType, ArticleStatus } from "@/lib/models/Article";
import {
  AdminArticlesListResponse,
  AdminCreateArticleBody,
  AdminArticleDetailResponse,
  AdminUpdateArticleBody
} from "../../models/admin/articles";

export const adminArticlesRoutes = new Elysia({ prefix: "/articles" })
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
    async ({
      query: { type, status, q, page, pageSize, sort, onlyPublished, includeContentInSearch, full },
      cookie: { NEXT_LANG },
      status: httpStatus
    }) => {
      const resolvedStatus =
        status === "draft" || status === "published" || (status === "url_only" && type === "blog")
          ? (status as ArticleStatus)
          : undefined;

      try {
        const data = await listArticles({
          type: type as ArticleType,
          status: resolvedStatus,
          search: q,
          page,
          pageSize,
          sort: sort as SortTypes,
          onlyPublished: onlyPublished === "true",
          includeContentInSearch: includeContentInSearch === "true"
        });

        if (full === "true")
          return httpStatus(200, data as unknown as typeof AdminArticlesListResponse.static);

        const locale = NEXT_LANG?.value || "";
        return httpStatus(
          200,
          data.items.map((item) => selectArticleLocale(item, locale, false))
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to list articles";
        return httpStatus(500, { error: msg });
      }
    },
    {
      query: t.Object({
        type: t.Optional(t.Union([t.Literal("newsletter"), t.Literal("blog")])),
        status: t.Optional(t.String()),
        q: t.Optional(t.String()),
        page: t.Optional(t.Number({ default: 1, minimum: 1 })),
        pageSize: t.Optional(t.Number({ default: 10, minimum: 1, maximum: 100 })),
        sort: t.Optional(
          t.Union([t.Literal("newest"), t.Literal("oldest"), t.Literal("views")], {
            default: "newest"
          })
        ),
        onlyPublished: t.Optional(t.String()),
        includeContentInSearch: t.Optional(t.String()),
        full: t.Optional(t.String())
      }),
      cookie: t.Cookie({
        NEXT_LANG: t.Optional(t.String())
      }),
      response: {
        200: AdminArticlesListResponse,
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

        const created = await createArticle(body as ArticleInput);
        return status(200, created as unknown as typeof AdminArticleDetailResponse.static);
      } catch (e) {
        console.error(e);
        const msg = e instanceof Error ? e.message : "Failed to create article";
        return status(400, { error: msg });
      }
    },
    {
      headers: t.Object({
        "x-csrf-token": t.String()
      }),
      body: AdminCreateArticleBody,
      response: {
        200: AdminArticleDetailResponse,
        400: t.Object({ error: t.String() }),
        403: t.Object({ error: t.String() })
      }
    }
  )
  .get(
    "/:id",
    async ({ params: { id }, query: { full }, cookie: { NEXT_LANG }, status }) => {
      try {
        const isFull = full === "1" || full === "true" || full === "yes";
        const locale = NEXT_LANG?.value || "";

        try {
          // Use getArticleByIdForEdit for admin routes to get clean markdown syntax
          const article = await getArticleByIdForEdit(id);
          if (article) {
            return status(
              200,
              isFull ? mapsToObjects(article) : selectArticleLocale(article, locale, false)
            );
          }
        } catch {}

        const article = await getArticleBySlug(null, id, false);
        if (!article) return status(404, { error: "Not found" });
        return status(
          200,
          isFull ? mapsToObjects(article.toObject()) : selectArticleLocale(article, locale, false)
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to fetch";
        return status(500, { error: msg });
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      query: t.Object({
        full: t.Optional(t.String())
      }),
      cookie: t.Cookie({
        NEXT_LANG: t.Optional(t.String())
      }),
      response: {
        200: t.Any(), // Can be full article or localized article
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

        const updated = await updateArticle(id, body as Partial<ArticleInput>);
        if (!updated) return status(404, { error: "Not found" });
        return status(200, updated as unknown as typeof AdminArticleDetailResponse.static);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to update";
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
      body: AdminUpdateArticleBody,
      response: {
        200: AdminArticleDetailResponse,
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

        const ok = await deleteArticle(id);
        return status(200, { success: ok });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to delete";
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
        403: t.Object({ error: t.String() })
      }
    }
  );
