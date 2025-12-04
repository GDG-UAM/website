import { t } from "elysia";

export const GeneralSettings = t.Object({
  timeFormat: t.Union([t.Literal("24h"), t.Literal("12h")]),
  firstDayOfWeek: t.Union([t.Literal("monday"), t.Literal("sunday")])
});

export const ProfileSettings = t.Object({
  shortBio: t.Optional(t.String()),
  github: t.Optional(t.String()),
  linkedin: t.Optional(t.String()),
  x: t.Optional(t.String()),
  instagram: t.Optional(t.String()),
  website: t.Optional(t.String()),
  customTags: t.Optional(
    t.Array(
      t.Union([
        t.Literal("founder"),
        t.Literal("president"),
        t.Literal("vice-president"),
        t.Literal("treasurer"),
        t.Literal("secretary")
      ])
    )
  )
});

export const PrivacySettings = t.Object({
  showAttendance: t.Boolean(),
  showResults: t.Boolean(),
  allowTagInstagram: t.Boolean(),
  allowTagLinkedIn: t.Boolean(),
  allowMentionBlog: t.Boolean(),
  photoConsent: t.Boolean()
});

export const EventsSettings = t.Object({
  dietary: t.Optional(t.String()),
  tshirtSize: t.Optional(
    t.Union([
      t.Literal("XS"),
      t.Literal("S"),
      t.Literal("M"),
      t.Literal("L"),
      t.Literal("XL"),
      t.Literal("XXL")
    ])
  )
});

export const GamesSettings = t.Object({
  scoreboardNickname: t.Optional(t.String()),
  anonymousOnScoreboard: t.Boolean(),
  showRankings: t.Boolean()
});

export const NotificationsSettings = t.Object({
  emailMentions: t.Boolean(),
  weeklyNewsletter: t.Boolean(),
  urgentAlerts: t.Boolean()
});

export const AccessibilitySettings = t.Object({
  highContrast: t.Boolean(),
  reducedMotion: t.Boolean(),
  dyslexicFont: t.Boolean(),
  daltonismMode: t.Union([
    t.Literal("none"),
    t.Literal("deuteranopia"),
    t.Literal("protanopia"),
    t.Literal("tritanopia")
  ])
});

export const ExperimentalSettings = t.Object({
  overrides: t.Record(t.String(), t.Boolean())
});

export const UserSettings = t.Object({
  version: t.Number(),
  general: GeneralSettings,
  profile: ProfileSettings,
  privacy: PrivacySettings,
  events: EventsSettings,
  games: GamesSettings,
  notifications: NotificationsSettings,
  accessibility: AccessibilitySettings,
  experimental: ExperimentalSettings,
  createdAt: t.Date(),
  updatedAt: t.Date()
});

export const UpdateSettingsBody = t.Union([
  t.Partial(GeneralSettings),
  t.Partial(ProfileSettings),
  t.Partial(PrivacySettings),
  t.Partial(EventsSettings),
  t.Partial(GamesSettings),
  t.Partial(NotificationsSettings),
  t.Partial(AccessibilitySettings),
  t.Partial(ExperimentalSettings)
]);
