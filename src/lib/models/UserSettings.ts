import mongoose, { Schema, Document, Model } from "mongoose";

// Hybrid approach: light frequently-read booleans can still be duplicated / projected if needed
// but we store the full structured settings document here for flexibility & versioning.

export interface IUserSettings extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  // Whether the user has completed the initial onboarding flow.
  // When false, most server-side reads (except getOrCreateUserSettings used by /api/settings) will
  // return conservative privacy defaults to minimize accidental exposure.
  active: boolean;
  version: number; // schema version for migrations
  general: {
    timeFormat: "24h" | "12h";
    firstDayOfWeek: "monday" | "sunday";
  };
  profile: {
    // displayName moved to User model (see User.ts)
    shortBio?: string;
    github?: string;
    linkedin?: string;
    x?: string;
    instagram?: string;
    website?: string;
  };
  privacy: {
    showAttendance: boolean;
    showResults: boolean;
    allowTagInstagram: boolean;
    allowTagLinkedIn: boolean;
    allowMentionBlog: boolean;
    // showProfilePublicly moved to User model
    photoConsent: boolean; // consent to show photos containing user
    // allowAnonUsage moved to User model (telemetry / anonymized usage)
  };
  events: {
    dietary?: string;
    tshirtSize?: "XS" | "S" | "M" | "L" | "XL" | "XXL";
  };
  games: {
    scoreboardNickname?: string;
    anonymousOnScoreboard: boolean;
    showRankings: boolean;
  };
  notifications: {
    emailMentions: boolean;
    weeklyNewsletter: boolean;
    urgentAlerts: boolean; // always true enforced server side
  };
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
    dyslexicFont: boolean;
    daltonismMode: "none" | "deuteranopia" | "protanopia" | "tritanopia";
  };
  experimental: {
    // user-specific opt-ins or overrides; separate feature flags system still governs availability
    overrides: Record<string, boolean>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSettingsSchema = new Schema<IUserSettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    active: { type: Boolean, default: false },
    version: { type: Number, default: 1 },
    general: {
      timeFormat: { type: String, enum: ["24h", "12h"], default: "24h" },
      firstDayOfWeek: { type: String, enum: ["monday", "sunday"], default: "monday" }
    },
    profile: {
      // displayName removed (migrated to User model)
      shortBio: String,
      github: String,
      linkedin: String,
      x: String,
      instagram: String,
      website: String
    },
    privacy: {
      showAttendance: { type: Boolean, default: false },
      showResults: { type: Boolean, default: false },
      allowTagInstagram: { type: Boolean, default: true },
      allowTagLinkedIn: { type: Boolean, default: true },
      allowMentionBlog: { type: Boolean, default: true },
      photoConsent: { type: Boolean, default: true }
      // showProfilePublicly & allowAnonUsage removed (migrated to User model)
    },
    events: {
      dietary: String,
      tshirtSize: { type: String, enum: ["XS", "S", "M", "L", "XL", "XXL"], default: "M" }
    },
    games: {
      scoreboardNickname: String,
      anonymousOnScoreboard: { type: Boolean, default: false },
      showRankings: { type: Boolean, default: true }
    },
    notifications: {
      emailMentions: { type: Boolean, default: true },
      weeklyNewsletter: { type: Boolean, default: false },
      urgentAlerts: { type: Boolean, default: true }
    },
    accessibility: {
      highContrast: { type: Boolean, default: false },
      reducedMotion: { type: Boolean, default: false },
      dyslexicFont: { type: Boolean, default: false },
      daltonismMode: {
        type: String,
        enum: ["none", "deuteranopia", "protanopia", "tritanopia"],
        default: "none"
      }
    },
    experimental: {
      overrides: { type: Schema.Types.Mixed, default: {} }
    }
  },
  { timestamps: true }
);

export default (mongoose.models.UserSettings as Model<IUserSettings>) ||
  mongoose.model<IUserSettings>("UserSettings", UserSettingsSchema);
