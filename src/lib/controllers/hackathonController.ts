import db from "@/lib/db";
import Hackathon, { IHackathon } from "@/lib/models/Hackathon";
import { syncHackathonCertificates } from "./certificateController";
import type { QueryFilter, SortOrder } from "mongoose";

export type HackathonInput = {
  title: string;
  date: Date;
  endDate: Date;
  location?: string | null;
  intermission?: IHackathon["intermission"];
  certificateDefaults?: IHackathon["certificateDefaults"];
};

export type SortTypes = "newest" | "oldest";

export async function createHackathon(input: HackathonInput): Promise<IHackathon> {
  await db.connect();
  const hackathon = await Hackathon.create(input);
  const obj = hackathon.toObject();
  delete (obj as unknown as { __v?: number }).__v;
  return obj as unknown as IHackathon;
}

export async function updateHackathon(
  id: string,
  input: Partial<HackathonInput>
): Promise<IHackathon | null> {
  await db.connect();
  const hackathon = await Hackathon.findByIdAndUpdate(id, input, {
    new: true,
    runValidators: true
  })
    .select("-__v")
    .lean();

  if (
    hackathon &&
    (input.title !== undefined ||
      input.date !== undefined ||
      input.endDate !== undefined ||
      input.certificateDefaults !== undefined)
  ) {
    await syncHackathonCertificates(id);
  }

  return hackathon as unknown as IHackathon | null;
}

export async function deleteHackathon(id: string): Promise<boolean> {
  await db.connect();
  const res = await Hackathon.findByIdAndDelete(id);
  return !!res;
}

export async function getHackathonById(id: string): Promise<IHackathon | null> {
  await db.connect();
  const hackathon = await Hackathon.findById(id).select("-__v").lean();
  return hackathon as unknown as IHackathon | null;
}

export async function listHackathons(params: {
  page?: number;
  pageSize?: number;
  sort?: SortTypes;
}): Promise<{
  items: IHackathon[];
  total: number;
  page: number;
  pageSize: number;
}> {
  await db.connect();
  const { page = 1, pageSize = 10, sort = "newest" } = params || {};

  const filter: QueryFilter<IHackathon> = {};

  const sortMap: Record<SortTypes, Record<string, SortOrder>> = {
    newest: { date: -1 },
    oldest: { date: 1 }
  };

  const total = await Hackathon.countDocuments(filter);
  const items = await Hackathon.find(filter)
    .sort(sortMap[sort])
    .select("-__v")
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();

  return { items: items as unknown as IHackathon[], total, page, pageSize };
}
