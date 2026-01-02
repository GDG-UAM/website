import { Elysia, t } from "elysia";
import { getSession } from "../../../utils/auth";
import { verifyCsrf } from "@/lib/controllers/csrfController";
import {
  createTeam,
  listTeams,
  updateTeam,
  deleteTeam,
  getTeamById
} from "@/lib/controllers/teamController";
import {
  AdminTeamsListResponse,
  AdminCreateTeamBody,
  AdminUpdateTeamBody,
  AdminTeamItem
} from "../../../models/admin/teams";

export const adminTeamsRoutes = new Elysia({ prefix: "/teams" })
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
        const teams = await listTeams(hackathonId);
        return status(200, teams as typeof AdminTeamsListResponse.static);
      } catch (e) {
        return status(500, { error: e instanceof Error ? e.message : "Failed to list teams" });
      }
    },
    {
      query: t.Object({
        hackathonId: t.String()
      }),
      response: {
        200: AdminTeamsListResponse,
        500: t.Object({ error: t.String() })
      }
    }
  )
  .get(
    "/:teamId",
    async ({ params: { teamId }, status }) => {
      try {
        const team = await getTeamById(teamId);
        return status(200, team as typeof AdminTeamItem.static);
      } catch (e) {
        return status(500, { error: e instanceof Error ? e.message : "Failed to get team" });
      }
    },
    {
      params: t.Object({
        teamId: t.String()
      }),
      response: {
        200: AdminTeamItem,
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

        const created = await createTeam({
          name: body.name,
          hackathonId,
          trackId: body.trackId,
          users: body.users
        });
        return status(200, created as typeof AdminTeamItem.static);
      } catch (e) {
        return status(500, { error: e instanceof Error ? e.message : "Failed to create team" });
      }
    },
    {
      query: t.Object({
        hackathonId: t.String()
      }),
      headers: t.Object({ "x-csrf-token": t.String() }),
      body: AdminCreateTeamBody,
      response: {
        200: AdminTeamItem,
        403: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String() })
      }
    }
  )
  .patch(
    "/:teamId",
    async ({ params: { teamId }, headers, body, user, status }) => {
      try {
        const userId = user?.id;
        const token = headers["x-csrf-token"];
        if (!userId || !token || !(await verifyCsrf(token, userId)))
          return status(403, { error: "Invalid CSRF" });

        const updated = await updateTeam(teamId, body);
        if (!updated) return status(404, { error: "Team not found" });
        return status(200, updated as typeof AdminTeamItem.static);
      } catch (e) {
        return status(500, { error: e instanceof Error ? e.message : "Failed to update team" });
      }
    },
    {
      params: t.Object({ teamId: t.String() }),
      headers: t.Object({ "x-csrf-token": t.String() }),
      body: AdminUpdateTeamBody,
      response: {
        200: AdminTeamItem,
        403: t.Object({ error: t.String() }),
        404: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String() })
      }
    }
  )
  .delete(
    "/:teamId",
    async ({ params: { teamId }, headers, user, status }) => {
      try {
        const userId = user?.id;
        const token = headers["x-csrf-token"];
        if (!userId || !token || !(await verifyCsrf(token, userId)))
          return status(403, { error: "Invalid CSRF" });

        const ok = await deleteTeam(teamId);
        if (!ok) return status(404, { error: "Team not found" });
        return status(200, { success: true });
      } catch (e) {
        return status(500, { error: e instanceof Error ? e.message : "Failed to delete team" });
      }
    },
    {
      params: t.Object({ teamId: t.String() }),
      headers: t.Object({ "x-csrf-token": t.String() }),
      response: {
        200: t.Object({ success: t.Boolean() }),
        403: t.Object({ error: t.String() }),
        404: t.Object({ error: t.String() }),
        500: t.Object({ error: t.String() })
      }
    }
  );
