import { z } from "zod";

// Reusable regex / helpers if needed
const url = z.string().url().max(300);
const optionalUrl = url
  .optional()
  .or(z.literal(""))
  .transform((v) => (v === "" ? undefined : v));

export const generalSchema = z.object({
  timeFormat: z.enum(["24h", "12h"]).default("24h"),
  firstDayOfWeek: z.enum(["monday", "sunday"]).default("monday")
});

export const profileSchema = z.object({
  // displayName is a virtual field (actually stored on User model); allow empty to clear
  displayName: z.string().max(80).optional(),
  shortBio: z.string().max(500).optional(),
  github: optionalUrl,
  linkedin: optionalUrl,
  x: optionalUrl,
  instagram: optionalUrl,
  website: optionalUrl
});

export const privacySchema = z.object({
  showAttendance: z.boolean().default(false),
  showResults: z.boolean().default(false),
  allowTagInstagram: z.boolean().default(true),
  allowTagLinkedIn: z.boolean().default(true),
  allowMentionBlog: z.boolean().default(true),
  // virtual fields backed by User model
  showProfilePublicly: z.boolean().default(true),
  photoConsent: z.boolean().default(true),
  allowAnonUsage: z.boolean().default(true)
});

export const eventsSchema = z.object({
  dietary: z.string().max(200).optional(),
  tshirtSize: z.enum(["XS", "S", "M", "L", "XL", "XXL"]).default("M")
});

export const gamesSchema = z.object({
  scoreboardNickname: z.string().max(60).optional(),
  anonymousOnScoreboard: z.boolean().default(false),
  showRankings: z.boolean().default(true)
});

export const notificationsSchema = z.object({
  emailMentions: z.boolean().default(true),
  weeklyNewsletter: z.boolean().default(false),
  urgentAlerts: z.boolean().default(true) // server can force true
});

export const accessibilitySchema = z.object({
  highContrast: z.boolean().default(false),
  reducedMotion: z.boolean().default(false),
  dyslexicFont: z.boolean().default(false),
  // Daltonism simulation mode applied via data-* attribute on <html>
  daltonismMode: z.enum(["none", "deuteranopia", "protanopia", "tritanopia"]).default("none")
});

export const experimentalSchema = z.object({
  overrides: z.record(z.boolean()).default({})
});

export const userSettingsSchema = z.object({
  version: z.number().default(1),
  general: generalSchema,
  profile: profileSchema,
  privacy: privacySchema,
  events: eventsSchema,
  games: gamesSchema,
  notifications: notificationsSchema,
  accessibility: accessibilitySchema,
  experimental: experimentalSchema
});

export type GeneralSettings = z.infer<typeof generalSchema>;
export type ProfileSettings = z.infer<typeof profileSchema>;
export type PrivacySettings = z.infer<typeof privacySchema>;
export type EventsSettings = z.infer<typeof eventsSchema>;
export type GamesSettings = z.infer<typeof gamesSchema>;
export type NotificationsSettings = z.infer<typeof notificationsSchema>;
export type AccessibilitySettings = z.infer<typeof accessibilitySchema>;
export type ExperimentalSettings = z.infer<typeof experimentalSchema>;
export type UserSettingsDTO = z.infer<typeof userSettingsSchema>;

export const categorySchemas = {
  general: generalSchema,
  profile: profileSchema,
  privacy: privacySchema,
  events: eventsSchema,
  games: gamesSchema,
  notifications: notificationsSchema,
  accessibility: accessibilitySchema,
  experimental: experimentalSchema
};

export type SettingsCategoryKey = keyof typeof categorySchemas;

export const DEFAULT_GENERAL: GeneralSettings = {
  timeFormat: "24h",
  firstDayOfWeek: "monday"
};

export const DEFAULT_PROFILE: ProfileSettings = {
  displayName: undefined,
  shortBio: undefined,
  github: undefined,
  linkedin: undefined,
  x: undefined,
  instagram: undefined,
  website: undefined
};

export const DEFAULT_PRIVACY: PrivacySettings = privacySchema.parse({});

export const DEFAULT_EVENTS: EventsSettings = eventsSchema.parse({});

export const DEFAULT_GAMES: GamesSettings = gamesSchema.parse({});

export const DEFAULT_NOTIFICATIONS: NotificationsSettings = notificationsSchema.parse({});

export const DEFAULT_ACCESSIBILITY: AccessibilitySettings = accessibilitySchema.parse({});

export const DEFAULT_EXPERIMENTAL: ExperimentalSettings = experimentalSchema.parse({});

export const DEFAULT_USER_SETTINGS: UserSettingsDTO = {
  version: 1,
  general: DEFAULT_GENERAL,
  profile: DEFAULT_PROFILE,
  privacy: DEFAULT_PRIVACY,
  events: DEFAULT_EVENTS,
  games: DEFAULT_GAMES,
  notifications: DEFAULT_NOTIFICATIONS,
  accessibility: DEFAULT_ACCESSIBILITY,
  experimental: DEFAULT_EXPERIMENTAL
};
