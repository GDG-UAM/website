import { t } from "elysia";

export const GiveawayItem = t.Object({
  _id: t.Any(), // ObjectId
  title: t.String(),
  description: t.Optional(t.String()),
  mustBeLoggedIn: t.Boolean(),
  mustHaveJoinedEventId: t.Optional(t.Nullable(t.Any())), // ObjectId
  requirePhotoUsageConsent: t.Boolean(),
  requireProfilePublic: t.Boolean(),
  maxWinners: t.Number(),
  startAt: t.Optional(t.Nullable(t.Date())),
  endAt: t.Optional(t.Nullable(t.Date())),
  durationS: t.Optional(t.Nullable(t.Number())),
  remainingS: t.Optional(t.Nullable(t.Number())),
  deviceFingerprinting: t.Boolean(),
  status: t.Union([
    t.Literal("draft"),
    t.Literal("active"),
    t.Literal("paused"),
    t.Literal("closed"),
    t.Literal("cancelled")
  ]),
  createdAt: t.Date(),
  updatedAt: t.Date(),
  winners: t.Optional(t.Array(t.Any())), // ObjectId
  winnerProofs: t.Optional(t.Array(t.Any())),
  drawSeed: t.Optional(t.Nullable(t.String())),
  drawInputHash: t.Optional(t.Nullable(t.String())),
  drawInputSize: t.Optional(t.Nullable(t.Number())),
  drawAt: t.Optional(t.Nullable(t.Date()))
});

export const GiveawayInputBody = t.Object({
  title: t.Optional(t.String()),
  description: t.Optional(t.String()),
  mustBeLoggedIn: t.Optional(t.Boolean()),
  mustHaveJoinedEventId: t.Optional(t.Nullable(t.String())),
  requirePhotoUsageConsent: t.Optional(t.Boolean()),
  requireProfilePublic: t.Optional(t.Boolean()),
  maxWinners: t.Optional(t.Number()),
  startAt: t.Optional(t.Nullable(t.String())),
  endAt: t.Optional(t.Nullable(t.String())),
  durationS: t.Optional(t.Nullable(t.Number())),
  remainingS: t.Optional(t.Nullable(t.Number())),
  deviceFingerprinting: t.Optional(t.Boolean()),
  status: t.Optional(
    t.Union([
      t.Literal("draft"),
      t.Literal("active"),
      t.Literal("paused"),
      t.Literal("closed"),
      t.Literal("cancelled")
    ])
  )
});

export const GiveawaysListResponse = t.Object({
  items: t.Array(GiveawayItem)
});

export const WinnerPublicDetail = t.Object({
  entryId: t.String(),
  userId: t.Optional(t.Nullable(t.String())),
  anonId: t.Optional(t.Nullable(t.String())),
  displayName: t.Optional(t.String()),
  name: t.Optional(t.String()),
  image: t.Optional(t.String())
});

export const GiveawayWinnersResponse = t.Object({
  winners: t.Array(t.Any()), // ObjectId
  winnerProofs: t.Array(t.Any()),
  drawSeed: t.Nullable(t.String()),
  drawInputHash: t.Nullable(t.String()),
  drawInputSize: t.Nullable(t.Number()),
  drawAt: t.Nullable(t.Date()),
  winnersDetails: t.Array(WinnerPublicDetail)
});

export const RerollWinnerBody = t.Object({
  position: t.Union([t.String(), t.Number()])
});
