import { NextResponse } from "next/server";
import { publicGetTeamMembers } from "@/lib/controllers/userController";

export async function GET() {
  const users = await publicGetTeamMembers(); // petición a bbdd

  const organizers = users
    .filter((u) => u.role === "admin")
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ role, name, displayName, ...rest }) => ({ ...rest, name: displayName || name }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  const team = users
    .filter((u) => u.role === "team")
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ role, name, displayName, ...rest }) => ({ ...rest, name: displayName || name }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  return NextResponse.json({ organizers, team });
}
