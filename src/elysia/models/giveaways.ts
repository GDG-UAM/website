import { t } from "elysia";

export const UserParticipation = t.Object({
  participating: t.Boolean(),
  participations: t.Array(
    t.Object({
      giveaway: t.Object({
        _id: t.Any(), // ObjectId
        title: t.String(),
        description: t.String(),
        status: t.Union([
          t.Literal("draft"),
          t.Literal("active"),
          t.Literal("paused"),
          t.Literal("closed"),
          t.Literal("cancelled")
        ]),
        startAt: t.Nullable(t.Date()),
        endAt: t.Nullable(t.Date()),
        durationS: t.Nullable(t.Number()),
        remainingS: t.Nullable(t.Number()),
        createdAt: t.Date(),
        updatedAt: t.Date(),
        requirePhotoUsageConsent: t.Boolean(),
        requireProfilePublic: t.Boolean()
      }),
      entry: t.Object({
        _id: t.Any(), // ObjectId
        createdAt: t.Date()
      })
    })
  ),
  requirePhotoUsageConsent: t.Boolean(),
  requireProfilePublic: t.Boolean()
});

export const GiveawayPublic = t.Object({
  id: t.String(),
  title: t.String(),
  mustBeLoggedIn: t.Boolean(),
  requirePhotoUsageConsent: t.Boolean(),
  requireProfilePublic: t.Boolean(),
  startAt: t.Nullable(t.Date()),
  endAt: t.Nullable(t.Date()),
  durationS: t.Nullable(t.Number()),
  remainingS: t.Nullable(t.Number()),
  status: t.Nullable(
    t.Union([
      t.Literal("draft"),
      t.Literal("active"),
      t.Literal("paused"),
      t.Literal("closed"),
      t.Literal("cancelled")
    ])
  )
});

export const CreateEntryBody = t.Object({
  acceptTerms: t.Boolean(),
  finalConfirmations: t.Optional(t.Record(t.String(), t.Any())),
  anonId: t.Optional(t.String())
});

export const CreateEntryResponse = t.Object({
  ok: t.Boolean(),
  id: t.Any() // ObjectId
});
