import db from "@/lib/db";
import UserSettings, { IUserSettings } from "@/lib/models/UserSettings";
import User from "@/lib/models/User";
import {
  categorySchemas,
  SettingsCategoryKey,
  DEFAULT_USER_SETTINGS
} from "@/lib/validation/settingsSchemas";
import { z } from "zod";
import mongoose from "mongoose";
import { getPageHead } from "@/lib/web/metadataExtractor";
import GiveawayEntry from "@/lib/models/GiveawayEntry";
import Giveaway from "@/lib/models/Giveaway";

// Fetch (or create defaults) for a user
export async function getOrCreateUserSettings(
  userId: string,
  opts?: { includePreviews?: boolean }
): Promise<IUserSettings> {
  await db.connect();
  let settings = await UserSettings.findOne({ userId });
  if (!settings) {
    // Explicitly apply our curated defaults (mix of true/false) rather than relying solely on mongoose defaults
    const seed: Omit<IUserSettings, "_id" | "createdAt" | "updatedAt"> = {
      ...(DEFAULT_USER_SETTINGS as unknown as Omit<
        IUserSettings,
        "_id" | "createdAt" | "updatedAt" | "userId"
      >),
      userId: new mongoose.Types.ObjectId(userId)
    };
    settings = await UserSettings.create(seed);
  }
  const user = await User.findById(userId).select(
    "displayName allowAnonUsage showProfilePublicly experimentalOverrides"
  );
  const obj = settings.toObject() as IUserSettings & {
    profile: Record<string, unknown>;
    privacy: Record<string, unknown>;
    experimental: Record<string, unknown>;
  };
  delete (obj as unknown as Record<string, unknown>).active;
  obj.profile = { ...obj.profile, displayName: user?.displayName };
  obj.privacy = {
    ...obj.privacy,
    allowAnonUsage: user?.allowAnonUsage ?? true,
    showProfilePublicly: user?.showProfilePublicly ?? false
  };
  obj.experimental = { ...obj.experimental, overrides: user?.experimentalOverrides || {} };
  // Optionally attach previews for existing profile URLs on initial fetch
  if (opts?.includePreviews) {
    // Exclude GitHub from server-side previews; client fetch handles it
    const keys = ["linkedin", "x", "instagram", "website"] as const;
    const urls: Record<string, string> = {};
    for (const k of keys) {
      const v = obj.profile?.[k];
      if (typeof v === "string" && v) urls[k] = v;
    }
    if (Object.keys(urls).length) {
      const entries = await Promise.all(
        Object.entries(urls).map(async ([k, url]) => {
          const meta = await getPageHead(url).catch(() => null);
          return [k, meta] as const;
        })
      );
      (obj as unknown as Record<string, unknown>).previews = {
        ...(obj as unknown as { previews?: Record<string, unknown> }).previews,
        profile: Object.fromEntries(entries)
      };
    }
  }

  // Remove legacy field from response if present
  try {
    const acc = (obj as unknown as { accessibility?: Record<string, unknown> }).accessibility;
    if (acc && Object.prototype.hasOwnProperty.call(acc, "colorBlindPalette")) {
      delete (acc as Record<string, unknown>)["colorBlindPalette"];
    }
  } catch {
    /* ignore */
  }

  return obj as IUserSettings;
}

export async function getUserSettings(userId: string): Promise<IUserSettings | null> {
  await db.connect();
  const settings = await UserSettings.findOne({ userId });
  if (!settings) return null;
  // If onboarding not completed (active=false) return conservative (locked down) privacy values
  // while never exposing the `active` flag itself.
  if (!settings.active) {
    const cloned = settings.toObject() as IUserSettings;
    cloned.privacy = {
      ...cloned.privacy,
      showAttendance: false,
      showResults: false,
      allowTagInstagram: false,
      allowTagLinkedIn: false,
      allowMentionBlog: false,
      photoConsent: false
    };
    // Virtual privacy fields that live on User model are handled elsewhere; we force conservative here
    // (cannot modify user model silently here, only shape we return if any code path uses getUserSettings directly)
    delete (cloned as unknown as Record<string, unknown>).active;
    return cloned as IUserSettings;
  }
  const obj = settings.toObject();
  delete (obj as unknown as Record<string, unknown>).active;
  return obj as IUserSettings;
}

type CategorySchemaMap = typeof categorySchemas;
// type CategoryValue<T extends SettingsCategoryKey> = z.infer<CategorySchemaMap[T]>;

export async function updateUserSettingsCategory<T extends SettingsCategoryKey>(
  userId: string,
  category: T,
  payload: unknown
): Promise<IUserSettings | null> {
  await db.connect();
  const schema = categorySchemas[category] as CategorySchemaMap[T];

  // We only want to update the keys provided by the client, not replace the whole subdocument.
  const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object";
  const body = isObj(payload) ? (payload as Record<string, unknown>) : {};

  // Ignore legacy input silently
  if (
    (category as string) === "accessibility" &&
    Object.prototype.hasOwnProperty.call(body, "colorBlindPalette")
  ) {
    delete body["colorBlindPalette"];
  }

  // Build per-key updates using dotted paths, validating each key against the schema.
  const setOps: Record<string, unknown> = {};
  const unsetOps: Record<string, 1> = {};

  // Helper to get sub-schema for a given key
  const objSchema = schema as unknown as z.ZodObject<z.ZodRawShape>;
  const shape = objSchema.shape as Record<string, z.ZodTypeAny>;

  // Track virtuals to update on User model
  const virtualUserUpdates: Record<string, unknown> = {};
  // Track changed profile URLs to fetch previews for
  const changedProfileUrls: Record<string, string> = {};

  for (const [k, rawVal] of Object.entries(body)) {
    const sub = shape[k] as z.ZodTypeAny | undefined;
    if (!sub) continue; // ignore unknown keys
    // Validate/transform individual field
    const result = sub.safeParse(rawVal);
    if (!result.success) {
      // surface error like zod would
      throw result.error;
    }
    let v = result.data as unknown;

    // Force invariant: urgentAlerts must always be true if present
    if (category === "notifications" && k === "urgentAlerts" && v === false) v = true;

    // Virtual fields written to User model instead of settings subdoc
    const isProfileDisplayName = category === "profile" && k === "displayName";
    const isPrivacyVirtual =
      category === "privacy" && (k === "allowAnonUsage" || k === "showProfilePublicly");
    if (isProfileDisplayName || isPrivacyVirtual) {
      virtualUserUpdates[k] = v;
      continue; // do not write into UserSettings subdoc
    }

    const path = `${category}.${k}`;
    if (typeof v === "undefined" || v === null)
      unsetOps[path] = 1; // clear when empty
    else setOps[path] = v;

    // If this is a profile social link and non-empty, queue preview fetch
    if (
      category === "profile" &&
      (k === "linkedin" || k === "x" || k === "instagram" || k === "website") &&
      typeof v === "string" &&
      v
    ) {
      changedProfileUrls[k] = v;
    }
  }

  // SECURITY: If the user is participating in any active giveaway that requires photoConsent or profile public,
  // ignore attempts to unset those values. We check active giveaways from the user's entries.
  try {
    const entryGiveaways = await GiveawayEntry.find({ userId }).lean().exec();
    const giveawayIds = entryGiveaways.map((e) => e.giveawayId).filter(Boolean);
    if (giveawayIds.length > 0) {
      const activeGiveaways = await Giveaway.find({
        _id: { $in: giveawayIds },
        status: { $nin: ["draft", "closed", "cancelled"] }
      })
        .lean()
        .exec();
      const requirePhoto = activeGiveaways.some((g) => !!g.requirePhotoUsageConsent);
      const requireProfile = activeGiveaways.some((g) => !!g.requireProfilePublic);
      // If the client attempted to unset photoConsent in setOps, remove that op
      if (requirePhoto) {
        const key = `privacy.photoConsent`;
        if (Object.prototype.hasOwnProperty.call(setOps, key)) delete setOps[key];
        if (Object.prototype.hasOwnProperty.call(unsetOps, key)) delete unsetOps[key];
        // Also prevent virtual user update for showProfilePublicly if present
        if (Object.prototype.hasOwnProperty.call(virtualUserUpdates, "showProfilePublicly"))
          delete virtualUserUpdates["showProfilePublicly"];
      }
      if (requireProfile) {
        const vkey = `privacy.showProfilePublicly`;
        if (Object.prototype.hasOwnProperty.call(virtualUserUpdates, "showProfilePublicly"))
          delete virtualUserUpdates["showProfilePublicly"];
        if (Object.prototype.hasOwnProperty.call(setOps, vkey)) delete setOps[vkey];
        if (Object.prototype.hasOwnProperty.call(unsetOps, vkey)) delete unsetOps[vkey];
      }
    }
  } catch {
    /* ignore failures here */
  }

  // Defensive fallback: explicitly persist daltonismMode even if the schema shape didn't include it
  if (
    (category as string) === "accessibility" &&
    Object.prototype.hasOwnProperty.call(body, "daltonismMode")
  ) {
    const mode = body["daltonismMode"] as unknown;
    const allowed = ["none", "deuteranopia", "protanopia", "tritanopia"] as const;
    if (typeof mode === "string" && (allowed as readonly string[]).includes(mode)) {
      setOps[`${category}.daltonismMode`] = mode;
    } else {
      throw new Error("Invalid daltonismMode");
    }
  }

  // No legacy mirroring

  // Apply updates to UserSettings
  const updated = await UserSettings.findOneAndUpdate(
    { userId },
    {
      ...(Object.keys(setOps).length ? { $set: setOps } : {}),
      ...(Object.keys(unsetOps).length ? { $unset: unsetOps } : {})
    },
    { new: true, upsert: true }
  );

  // Persist virtual fields back to User model
  if (
    category === "profile" &&
    Object.prototype.hasOwnProperty.call(virtualUserUpdates, "displayName")
  ) {
    await User.findByIdAndUpdate(userId, { $set: { displayName: virtualUserUpdates.displayName } });
  }
  if (category === "privacy") {
    const core: Record<string, unknown> = {};
    if (Object.prototype.hasOwnProperty.call(virtualUserUpdates, "allowAnonUsage"))
      core.allowAnonUsage = virtualUserUpdates.allowAnonUsage;
    if (Object.prototype.hasOwnProperty.call(virtualUserUpdates, "showProfilePublicly"))
      core.showProfilePublicly = virtualUserUpdates.showProfilePublicly;
    if (Object.keys(core).length) {
      await User.findByIdAndUpdate(userId, { $set: core }, { runValidators: true });
    }
  }
  if (category === "experimental" && Object.prototype.hasOwnProperty.call(body, "overrides")) {
    // keep copying overrides to User model for quick access
    const overridesSchema = (shape["overrides"] as z.ZodTypeAny) || z.record(z.boolean());
    const parsedOverrides = overridesSchema.parse(body["overrides"]);
    await User.findByIdAndUpdate(userId, { $set: { experimentalOverrides: parsedOverrides } });
  }
  if (!updated) return null;

  // Re-inject virtual user-backed fields so the client receives a stable shape
  // Otherwise SWR optimistic mutate would drop these keys causing uncontrolled->controlled warnings.
  const user = await User.findById(userId).select(
    "displayName allowAnonUsage showProfilePublicly experimentalOverrides"
  );
  const obj = updated.toObject() as IUserSettings & {
    profile: Record<string, unknown>;
    privacy: Record<string, unknown>;
    experimental: Record<string, unknown>;
  };
  delete (obj as unknown as Record<string, unknown>).active;
  obj.profile = { ...obj.profile, displayName: user?.displayName };
  obj.privacy = {
    ...obj.privacy,
    allowAnonUsage: user?.allowAnonUsage ?? true,
    showProfilePublicly: user?.showProfilePublicly ?? false
  };
  obj.experimental = { ...obj.experimental, overrides: user?.experimentalOverrides || {} };

  // Attach non-persistent previews for changed profile URLs (best-effort)
  if (Object.keys(changedProfileUrls).length) {
    const entries = await Promise.all(
      Object.entries(changedProfileUrls).map(async ([k, url]) => {
        const meta = await getPageHead(url).catch(() => null);
        return [k, meta] as const;
      })
    );
    (obj as unknown as Record<string, unknown>).previews = {
      ...(obj as unknown as { previews?: Record<string, unknown> }).previews,
      profile: Object.fromEntries(entries)
    };
  }

  // Remove legacy key from response
  try {
    const acc2 = (obj as unknown as { accessibility?: Record<string, unknown> }).accessibility;
    if (acc2 && Object.prototype.hasOwnProperty.call(acc2, "colorBlindPalette")) {
      delete (acc2 as Record<string, unknown>)["colorBlindPalette"];
    }
  } catch {
    /* ignore */
  }

  return obj as IUserSettings;
}

export async function isUserSettingsOnboardingRequired(userId: string): Promise<boolean> {
  await db.connect();
  const doc = await UserSettings.findOne({ userId }).select("active");
  return !doc || !doc.active;
}

export async function activateUserSettings(userId: string): Promise<void> {
  await db.connect();
  await UserSettings.findOneAndUpdate({ userId }, { $set: { active: true } }, { upsert: true });
}
