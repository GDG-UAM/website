import db from "@/lib/db";
import Track, { ITrack } from "@/lib/models/Track";

export type TrackInput = {
  name: string;
  hackathonId: string;
  judges?: string[];
  rubrics?: { name: string; maxScore: number; weight?: number }[];
};

export async function createTrack(input: TrackInput): Promise<ITrack> {
  await db.connect();
  const track = await Track.create(input as unknown as ITrack);
  return track.toObject() as unknown as ITrack;
}

export async function updateTrack(
  id: string,
  input: Partial<Omit<TrackInput, "hackathonId">>
): Promise<ITrack | null> {
  await db.connect();
  const track = await Track.findByIdAndUpdate(id, input, { new: true }).lean();
  return track as unknown as ITrack | null;
}

export async function deleteTrack(id: string): Promise<boolean> {
  await db.connect();
  const res = await Track.findByIdAndDelete(id);
  return !!res;
}

export async function listTracks(hackathonId: string): Promise<ITrack[]> {
  await db.connect();
  const tracks = await Track.find({ hackathonId }).sort({ name: 1 }).lean();
  return tracks as unknown as ITrack[];
}

export async function getTrackById(id: string): Promise<ITrack | null> {
  await db.connect();
  const track = await Track.findById(id).lean();
  return track as unknown as ITrack | null;
}
