import db from "@/lib/db";
import GiveawayModel, { IGiveaway } from "@/lib/models/Giveaway";
import GiveawayEntry from "@/lib/models/GiveawayEntry";
import crypto from "node:crypto";
import mongoose from "mongoose";

export type GiveawayInput = Partial<{
  title: string;
  description?: string;
  mustBeLoggedIn: boolean;
  mustHaveJoinedEventId?: string | null;
  requirePhotoUsageConsent?: boolean;
  requireProfilePublic?: boolean;
  maxWinners?: number;
  startAt?: string | null;
  endAt?: string | null;
  durationS?: number | null;
  remainingS?: number | null;
  deviceFingerprinting?: boolean;
  status?: "draft" | "active" | "paused" | "closed" | "cancelled";
}>;

export async function listGiveaways() {
  await db.connect();
  return GiveawayModel.find().sort({ createdAt: -1 }).lean().exec();
}

export async function getGiveaway(id: string) {
  await db.connect();
  const g = await GiveawayModel.findById(id).lean().exec();
  if (!g) throw new Error("Not found");
  return g;
}

export async function deleteGiveaway(id: string) {
  await db.connect();
  // Ensure giveaway exists first
  const exists = await GiveawayModel.findById(id).select({ _id: 1 }).lean().exec();
  if (!exists) throw new Error("Not found");

  // Cascade: remove all entries belonging to this giveaway
  try {
    await GiveawayEntry.deleteMany({ giveawayId: new mongoose.Types.ObjectId(id) }).exec();
  } catch (e) {
    // If entry deletion fails, do not delete the giveaway to avoid orphans being left in an inconsistent state
    throw e instanceof Error ? e : new Error("Failed to delete giveaway entries");
  }

  const result = await GiveawayModel.findByIdAndDelete(id).exec();
  if (!result) throw new Error("Not found");
  return result;
}

export async function createGiveaway(input: GiveawayInput) {
  await db.connect();
  const g = new GiveawayModel({
    title: input.title,
    description: input.description,
    mustBeLoggedIn: input.mustBeLoggedIn ?? true,
    mustHaveJoinedEventId: input.mustHaveJoinedEventId
      ? new mongoose.Types.ObjectId(input.mustHaveJoinedEventId)
      : null,
    requirePhotoUsageConsent: input.requirePhotoUsageConsent ?? false,
    requireProfilePublic: input.requireProfilePublic ?? false,
    maxWinners: input.maxWinners ?? 1,
    startAt: input.startAt ? new Date(input.startAt) : null,
    endAt: input.endAt ? new Date(input.endAt) : null,
    durationS: input.durationS ?? null,
    deviceFingerprinting: input.deviceFingerprinting ?? false,
    status: "draft"
  } as Partial<IGiveaway>);
  await g.save();
  return g.toObject();
}

export async function updateGiveaway(id: string, input: GiveawayInput) {
  await db.connect();
  const update: Partial<IGiveaway> & { remainingS?: number | null } = {};
  if (input.title !== undefined) update.title = input.title;
  if (input.description !== undefined) update.description = input.description;
  if (input.mustBeLoggedIn !== undefined) update.mustBeLoggedIn = input.mustBeLoggedIn;
  if (input.mustHaveJoinedEventId !== undefined)
    update.mustHaveJoinedEventId = input.mustHaveJoinedEventId
      ? new mongoose.Types.ObjectId(input.mustHaveJoinedEventId)
      : null;
  if (input.requirePhotoUsageConsent !== undefined)
    update.requirePhotoUsageConsent = input.requirePhotoUsageConsent;
  if (input.requireProfilePublic !== undefined)
    update.requireProfilePublic = input.requireProfilePublic;
  if (input.maxWinners !== undefined) update.maxWinners = input.maxWinners;
  if (input.startAt !== undefined) update.startAt = input.startAt ? new Date(input.startAt) : null;
  if (input.endAt !== undefined) update.endAt = input.endAt ? new Date(input.endAt) : null;
  if (input.durationS !== undefined) update.durationS = input.durationS;
  if (input.remainingS !== undefined) update.remainingS = input.remainingS;
  if (input.deviceFingerprinting !== undefined)
    update.deviceFingerprinting = input.deviceFingerprinting;
  if (input.status !== undefined) update.status = input.status;

  const updated = await GiveawayModel.findByIdAndUpdate(id, update, { new: true }).lean().exec();
  if (!updated) throw new Error("Not found");
  return updated;
}

// simple controller to count entries and list entries for a giveaway
export async function listEntries(giveawayId: string) {
  await db.connect();
  return GiveawayEntry.find({ giveawayId }).sort({ createdAt: -1 }).lean().exec();
}

export async function countEntries(giveawayId: string) {
  await db.connect();
  return GiveawayEntry.countDocuments({ giveawayId }).exec();
}

// User participations
export type UserParticipation = {
  giveaway: {
    _id: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    status: IGiveaway["status"];
    startAt?: Date | null;
    endAt?: Date | null;
    durationS?: number | null;
    remainingS?: number | null;
    requirePhotoUsageConsent: boolean;
    requireProfilePublic: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  entry: {
    _id: mongoose.Types.ObjectId;
    createdAt: Date;
  };
};

function isClosedByTiming(g: IGiveaway): boolean {
  const now = Date.now();
  const endMs = g.endAt ? g.endAt.getTime() : null;
  const hasEnd = typeof endMs === "number" && !Number.isNaN(endMs);
  const remaining: number | null =
    typeof (g as IGiveaway & { remainingS?: number | null }).remainingS === "number"
      ? ((g as IGiveaway & { remainingS?: number | null }).remainingS as number)
      : null;
  const startMs = g.startAt ? g.startAt.getTime() : null;
  const durationExpiredActive =
    !hasEnd &&
    g.status === "active" &&
    typeof startMs === "number" &&
    typeof remaining === "number" &&
    startMs + remaining * 1000 <= now;
  const closedByTime =
    (hasEnd && (endMs as number) <= now) ||
    (!hasEnd && (remaining == null || remaining <= 0 || durationExpiredActive));
  return Boolean(closedByTime);
}

export async function listUserActiveParticipations(userId: string): Promise<UserParticipation[]> {
  await db.connect();
  const uid = new mongoose.Types.ObjectId(userId);
  const entries = await GiveawayEntry.find({ userId: uid })
    .sort({ createdAt: -1 })
    .select({ _id: 1, giveawayId: 1, createdAt: 1 })
    .lean()
    .exec();
  if (!entries.length) return [];
  const gIds = entries.map((e) => e.giveawayId as mongoose.Types.ObjectId);
  const giveaways = await GiveawayModel.find({ _id: { $in: gIds } })
    .lean()
    .exec();
  const gMap = new Map<string, IGiveaway>(
    giveaways.map((g) => [g._id.toString(), g as unknown as IGiveaway])
  );

  const out: UserParticipation[] = [];
  for (const e of entries) {
    const g = gMap.get((e.giveawayId as mongoose.Types.ObjectId).toString());
    if (!g) continue;
    // exclude draft/closed/cancelled and anything closed by timing
    if (g.status === "draft" || g.status === "closed" || g.status === "cancelled") continue;
    if (isClosedByTiming(g)) continue;
    out.push({
      giveaway: {
        _id: g._id as mongoose.Types.ObjectId,
        title: g.title,
        description: g.description || "",
        status: g.status,
        startAt: g.startAt ?? null,
        endAt: g.endAt ?? null,
        durationS: g.durationS ?? null,
        remainingS: (g as IGiveaway & { remainingS?: number | null }).remainingS ?? null,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
        requirePhotoUsageConsent: g.requirePhotoUsageConsent ?? false,
        requireProfilePublic: g.requireProfilePublic ?? false
      },
      entry: {
        _id: e._id as mongoose.Types.ObjectId,
        createdAt: e.createdAt as Date
      }
    });
  }
  return out;
}

// Winners helpers
export type WinnerProof = {
  position: number;
  seed: string;
  entryId: mongoose.Types.ObjectId;
  at: Date;
  inputHash: string;
  inputSize: number;
};

export type WinnerPublicDetail = {
  entryId: string;
  userId?: string | null;
  anonId?: string | null;
  displayName?: string;
  name?: string;
  image?: string;
};

function sha256Hex(buf: Buffer | string) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

export async function getWinnersWithDetails(giveawayId: string) {
  await db.connect();
  const g = (await GiveawayModel.findById(giveawayId).lean().exec()) as IGiveaway | null;
  if (!g) throw new Error("Not found");

  const winnerIds = (g.winners ?? []).map((x) => x.toString());
  let details: WinnerPublicDetail[] = [];
  if (winnerIds.length) {
    const entries = await GiveawayEntry.find({ _id: { $in: winnerIds } })
      .populate({ path: "userId", select: "displayName name image" })
      .lean()
      .exec();
    type EntryLean = {
      _id: mongoose.Types.ObjectId;
      userId?:
        | null
        | undefined
        | { _id?: mongoose.Types.ObjectId; displayName?: string; name?: string; image?: string };
      anonId?: string | null;
    };
    const map = new Map<string, EntryLean>();
    for (const e of entries as unknown as EntryLean[]) map.set(e._id.toString(), e);
    details = winnerIds.map((id) => {
      const e = map.get(id);
      const user = e?.userId as
        | null
        | undefined
        | { _id?: mongoose.Types.ObjectId; displayName?: string; name?: string; image?: string };
      return {
        entryId: id,
        userId: user && user._id ? user._id.toString() : e?.userId ? String(e.userId) : null,
        anonId: e?.anonId ?? null,
        displayName: user?.displayName,
        name: user?.name,
        image: user?.image
      } as WinnerPublicDetail;
    });
  }

  return {
    winners: g.winners ?? [],
    winnerProofs: g.winnerProofs ?? [],
    drawSeed: g.drawSeed ?? null,
    drawInputHash: g.drawInputHash ?? null,
    drawInputSize: g.drawInputSize ?? null,
    drawAt: g.drawAt ?? null,
    winnersDetails: details
  };
}

export async function drawWinners(giveawayId: string) {
  await db.connect();
  const g = (await GiveawayModel.findById(giveawayId).exec()) as IGiveaway | null;
  if (!g) throw new Error("Not found");

  const entries = await GiveawayEntry.find({ giveawayId, disqualified: { $ne: true } })
    .sort({ createdAt: 1, _id: 1 })
    .select({ _id: 1 })
    .lean()
    .exec();
  const ids = entries.map((e) => e._id.toString());
  const inputBuf = Buffer.from(JSON.stringify(ids), "utf8");
  const inputHash = sha256Hex(inputBuf);

  const maxWinners = g.maxWinners ?? 1;
  const now = new Date();
  const seed = crypto.randomUUID();
  const selected: string[] = [];
  const proofs: WinnerProof[] = [];
  for (let i = 0; i < Math.min(maxWinners, ids.length); i++) {
    const per = sha256Hex(seed + ":" + String(i));
    const pool = ids.filter((x) => !selected.includes(x));
    if (pool.length === 0) break;
    const rnd = BigInt("0x" + per.slice(0, 16));
    const pickIdx = Number(rnd % BigInt(pool.length));
    const entryId = pool[pickIdx];
    selected.push(entryId);
    proofs.push({
      position: i,
      seed: per,
      entryId: new mongoose.Types.ObjectId(entryId),
      at: now,
      inputHash,
      inputSize: ids.length
    });
  }

  g.winners = selected.map((s) => new mongoose.Types.ObjectId(s));
  g.drawSeed = seed;
  g.drawInputHash = inputHash;
  g.drawInputSize = ids.length;
  g.drawAt = now;
  g.winnerProofs = proofs;
  await g.save();

  return getWinnersWithDetails(giveawayId);
}

export async function rerollWinner(giveawayId: string, position: number) {
  await db.connect();
  const g = (await GiveawayModel.findById(giveawayId).exec()) as IGiveaway | null;
  if (!g) throw new Error("Not found");

  const entries = await GiveawayEntry.find({ giveawayId, disqualified: { $ne: true } })
    .sort({ createdAt: 1, _id: 1 })
    .select({ _id: 1 })
    .lean()
    .exec();
  const ids = entries.map((e) => e._id.toString());
  const inputBuf = Buffer.from(JSON.stringify(ids), "utf8");
  const inputHash = sha256Hex(inputBuf);

  const seed = crypto.randomUUID();
  const per = sha256Hex(seed + ":" + String(position));
  const fixed = (g.winners ?? []).map((x) => x.toString());
  const pool = ids.filter((x) => !fixed.includes(x) || g.winners?.[position]?.toString() === x);
  if (pool.length === 0) throw new Error("No eligible entries");
  const rnd = BigInt("0x" + per.slice(0, 16));
  const pickIdx = Number(rnd % BigInt(pool.length));
  const entryId = pool[pickIdx];

  const now = new Date();
  const newWinners = [...(g.winners ?? [])] as mongoose.Types.ObjectId[];
  newWinners[position] = new mongoose.Types.ObjectId(entryId);

  const proofs = [...(g.winnerProofs ?? [])] as WinnerProof[];
  proofs[position] = {
    position,
    seed: per,
    entryId: new mongoose.Types.ObjectId(entryId),
    at: now,
    inputHash,
    inputSize: ids.length
  } as WinnerProof;

  g.drawSeed = seed;
  g.drawInputHash = inputHash;
  g.drawInputSize = ids.length;
  g.drawAt = now;
  g.winners = newWinners;
  g.winnerProofs = proofs;
  await g.save();

  return getWinnersWithDetails(giveawayId);
}
