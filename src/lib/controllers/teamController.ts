import db from "@/lib/db";
import Team, { ITeam } from "@/lib/models/Team";
import crypto from "crypto";

export type TeamInput = {
  name: string;
  hackathonId: string;
  trackId?: string | null;
  projectDescription?: string;
  users?: string[];
};

function generatePassword(length = 8): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let retVal = "";
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  for (let i = 0; i < length; i++) {
    retVal += charset[values[i] % charset.length];
  }
  return retVal;
}

async function getUniquePassword(hackathonId: string): Promise<string> {
  let password = "";
  let exists = true;
  while (exists) {
    password = generatePassword();
    const existing = await Team.findOne({ hackathonId, password });
    if (!existing) exists = false;
  }
  return password;
}

export async function createTeam(input: TeamInput): Promise<ITeam> {
  await db.connect();
  const password = await getUniquePassword(input.hackathonId);

  const data = {
    ...input,
    password,
    trackId: input.trackId ?? undefined
  };

  const team = await Team.create(data);
  return team.toObject() as unknown as ITeam;
}

export async function updateTeam(
  id: string,
  input: Partial<Omit<TeamInput, "hackathonId">>
): Promise<ITeam | null> {
  await db.connect();

  const update = {
    ...input,
    trackId: input.trackId ?? undefined
  };

  if (input.trackId === null) {
    const team = await Team.findByIdAndUpdate(
      id,
      { ...update, $unset: { trackId: 1 } },
      { new: true }
    ).lean();
    return team as unknown as ITeam | null;
  }

  const team = await Team.findByIdAndUpdate(id, update, { new: true }).lean();
  return team as unknown as ITeam | null;
}

export async function deleteTeam(id: string): Promise<boolean> {
  await db.connect();
  const res = await Team.findByIdAndDelete(id);
  return !!res;
}

export async function listTeams(hackathonId: string): Promise<ITeam[]> {
  await db.connect();
  const teams = await Team.find({ hackathonId }).populate("trackId").sort({ name: 1 }).lean();
  return teams as unknown as ITeam[];
}

export async function getTeamById(id: string): Promise<ITeam | null> {
  await db.connect();
  const team = await Team.findById(id).populate("trackId").lean();
  return team as unknown as ITeam | null;
}
