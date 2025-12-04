import { Elysia, t } from "elysia";
import { getToken } from "next-auth/jwt";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import config from "@/lib/config";
import { listUsers, updateUserRole, getPublicUserProfile } from "@/lib/controllers/userController";
import { verifyCsrf } from "@/lib/controllers/csrfController";
import {
  AdminUsersListResponse,
  AdminUpdateUserRoleBody,
  AdminUserItem
} from "../../models/admin/users";
import { NextRequest } from "next/server";

const NEXTAUTH_SECRET = process.env.SESSION_SECRET;

async function getRequester(req: Request) {
  // getToken expects a NextRequest-like object.
  // We might need to cast or ensure compatibility.
  // If this fails, we might need to rely on getServerSession if it exposes role.
  const token = await getToken({
    req: req as NextRequest,
    secret: NEXTAUTH_SECRET,
    cookieName: "next-auth.session-token"
  });
  return {
    role: ((token?.role as string) || "user") as "user" | "team" | "admin",
    email: (token?.email as string) || null
  };
}

export const adminUsersRoutes = new Elysia({ prefix: "/users" })
  .derive(({ set }) => ({
    status: (code: 200 | 401 | 403 | 404 | 500 | 429, response) => {
      set.status = code;
      return response;
    }
  }))
  .get(
    "/",
    async ({ request, query: { q, page, pageSize }, status }) => {
      const { role: requesterRole, email: requesterEmail } = await getRequester(request);
      const isAssoc =
        config.associationEmail &&
        requesterEmail &&
        requesterEmail.toLowerCase() === config.associationEmail.toLowerCase();

      if (!(requesterRole === "admin" || isAssoc)) return status(401, { error: "Unauthorized" });

      const pageNum = Math.max(1, page || 1);
      const pageSizeNum = Math.max(1, Math.min(pageSize || 20, 100));
      const queryStr = (q || "").trim();

      const { items, total } = await listUsers({
        q: queryStr,
        page: pageNum,
        pageSize: pageSizeNum
      });
      return status(200, { items, total, page: pageNum, pageSize: pageSizeNum });
    },
    {
      query: t.Object({
        q: t.Optional(t.String()),
        page: t.Optional(t.Number({ default: 1, minimum: 1 })),
        pageSize: t.Optional(t.Number({ default: 20, minimum: 1, maximum: 100 }))
      }),
      response: {
        200: AdminUsersListResponse,
        401: t.Object({ error: t.String() })
      }
    }
  )
  .patch(
    "/",
    async ({ request, body, status }) => {
      const { role: requesterRole, email: requesterEmail } = await getRequester(request);
      const isAssoc =
        config.associationEmail &&
        requesterEmail &&
        requesterEmail.toLowerCase() === config.associationEmail.toLowerCase();

      if (!(requesterRole === "admin" || isAssoc)) return status(401, { error: "Unauthorized" });

      const token = request.headers.get("x-csrf-token") || "";
      const session = await getServerSession(authOptions);
      const sessionUserId = session?.user?.id as string | undefined;

      if (!sessionUserId || !token || !(await verifyCsrf(token, sessionUserId)))
        return status(403, { error: "Invalid CSRF" });

      const { id, role: newRole } = body;
      if (!id || !newRole) return status(400, { error: "Invalid payload" });

      try {
        const result = await updateUserRole(id, newRole, {
          requesterRole,
          requesterEmail
        });
        return status(200, result);
      } catch (err) {
        const e = err as Error & { status?: number };
        if (e.message === "NotFound") return status(404, { error: "Not found" });
        if (e.status === 403 || e.message === "Forbidden")
          return status(403, { error: "Forbidden" });
        return status(500, { error: "Server error" });
      }
    },
    {
      body: AdminUpdateUserRoleBody,
      response: {
        200: t.Boolean(),
        400: t.Object({ error: t.String() }),
        401: t.Object({ error: t.String() }),
        403: t.Object({ error: t.String() }),
        404: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String() })
      }
    }
  )
  .get(
    "/:id",
    async ({ params: { id }, status }) => {
      try {
        // Simulate fetching own profile as per original code
        const result = await getPublicUserProfile(id, id);
        if (!result) return status(404, { error: "Not Found" });
        return status(200, result);
      } catch {
        return status(500, { error: "Internal Server Error" });
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      response: {
        200: AdminUserItem,
        404: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String() })
      }
    }
  );
