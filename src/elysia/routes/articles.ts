import { Elysia, t } from "elysia";
import {
  listArticles,
  selectArticleLocale,
  getArticleById,
  getArticleBySlug
} from "@/lib/controllers/articleController";
import type { ArticleType, IArticle } from "@/lib/models/Article";
import { ArticleItem, ArticleList } from "../models/articles";

export const articlesRoutes = new Elysia({ prefix: "/articles" })
  .derive(({ set }) => ({
    status: (code: 200 | 401 | 403 | 404 | 500 | 429, response) => {
      set.status = code;
      return response;
    }
  }))
  .get(
    "/",
    async ({ query: { type, q, page, pageSize, sort }, cookie: { NEXT_LOCALE }, status }) => {
      try {
        const data = await listArticles({
          type: type as ArticleType,
          status: "published",
          search: q,
          page,
          pageSize,
          sort,
          onlyPublished: true,
          includeContentInSearch: true
        });
        const locale = NEXT_LOCALE?.value || "";
        return status(
          200,
          data.items.map((item) => selectArticleLocale(item, locale, true))
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to list articles";
        return status(500, { error: msg });
      }
    },
    {
      query: t.Object({
        type: t.Optional(t.Union([t.Literal("newsletter"), t.Literal("blog")])),
        q: t.Optional(t.String()),
        page: t.Optional(t.Number({ default: 1, minimum: 1 })),
        pageSize: t.Optional(t.Number({ default: 10, minimum: 1, maximum: 100 })),
        sort: t.Optional(
          t.Union([t.Literal("newest"), t.Literal("oldest"), t.Literal("views")], {
            default: "newest"
          })
        )
      }),
      cookie: t.Cookie({
        NEXT_LOCALE: t.Optional(t.String())
      }),
      response: {
        200: ArticleList,
        500: t.Object({ error: t.String() })
      }
    }
  )
  .get(
    "/:slug",
    async ({ params: { slug }, query: { type }, cookie: { NEXT_LOCALE }, status }) => {
      const idOrSlug = slug;

      try {
        let article: IArticle | null = await getArticleBySlug(
          type as ArticleType | null,
          idOrSlug,
          true
        );
        if (!article) article = await getArticleById(idOrSlug, true);
        if (!article || (article.status !== "published" && article.status !== "url_only"))
          return status(404, { error: "Not found" });

        const locale = NEXT_LOCALE?.value || "";
        return status(200, selectArticleLocale(article, locale, true));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to fetch article";
        return status(500, { error: msg });
      }
    },
    {
      query: t.Object({
        type: t.Optional(t.Union([t.Literal("newsletter"), t.Literal("blog")]))
      }),
      cookie: t.Cookie({
        NEXT_LOCALE: t.Optional(t.String())
      }),
      response: {
        200: ArticleItem,
        404: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String() })
      }
    }
  );
