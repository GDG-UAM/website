import { Elysia, t } from "elysia";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { signCsrf, createTokenForHeaders } from "@/lib/controllers/csrfController";
import { CsrfTokenResponse } from "../models/csrf";

export const csrfRoutes = new Elysia({ prefix: "/csrf" })
  .derive(({ set }) => ({
    status: (code: 200 | 401 | 403 | 404 | 500 | 429, response) => {
      set.status = code;
      return response;
    }
  }))
  .get(
    "/",
    async ({ status }) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return status(401, { error: "Unauthorized" });
      }
      const { token, expiresAt } = await signCsrf(session.user.id as string);
      return status(200, { token, expiresAt });
    },
    {
      response: {
        200: CsrfTokenResponse,
        401: t.Object({ error: t.String() })
      }
    }
  )
  .get(
    "/public",
    async ({ request, status }) => {
      const ua = request.headers.get("user-agent") ?? "";
      const xff = request.headers.get("x-forwarded-for") ?? "";
      const rec = { "user-agent": ua, "x-forwarded-for": xff } as Record<string, string>;
      const token = await createTokenForHeaders(rec, 5 * 60);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      return status(200, { token, expiresAt });
    },
    {
      response: {
        200: CsrfTokenResponse
      }
    }
  );
