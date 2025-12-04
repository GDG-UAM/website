import { Elysia } from "elysia";
import { publicGetTeamMembers } from "@/lib/controllers/userController";
import { TeamResponse } from "../models/team";

export const teamRoutes = new Elysia({ prefix: "/team" })
  .derive(({ set }) => ({
    status: (code: 200 | 401 | 403 | 404 | 500 | 429, response) => {
      set.status = code;
      return response;
    }
  }))
  .get(
    "/",
    async ({ status }) => {
      const users = await publicGetTeamMembers();

      const organizers = users
        .filter((u) => u.role === "admin")
        .map(({ name, displayName, ...rest }) => ({ ...rest, name: displayName || name }))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

      const team = users
        .filter((u) => u.role === "team")
        .map(({ name, displayName, ...rest }) => ({ ...rest, name: displayName || name }))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

      return status(200, { organizers, team });
    },
    {
      response: {
        200: TeamResponse
      }
    }
  );
