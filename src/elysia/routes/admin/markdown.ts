import { Elysia, t } from "elysia";
import { getSession } from "../../utils/auth";
import { verifyCsrf } from "@/lib/controllers/csrfController";
import { renderMarkdown } from "@/lib/markdown";

export const adminMarkdownRoutes = new Elysia({ prefix: "/markdown" })
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
  .post(
    "/",
    async ({ headers, body, user, status }) => {
      try {
        const userId = user?.id;
        const token = headers["x-csrf-token"];

        if (!userId || !token || !(await verifyCsrf(token, userId))) {
          return status(403, { error: "Invalid CSRF" });
        }

        const { html } = await renderMarkdown(body || "");
        return status(200, html);
      } catch (err) {
        console.error("/api/admin/markdown error:", err);
        return status(500, { error: "Markdown render failed" });
      }
    },
    {
      headers: t.Object({
        "x-csrf-token": t.String()
      }),
      body: t.String(),
      response: {
        200: t.String(),
        403: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String() })
      }
    }
  );
