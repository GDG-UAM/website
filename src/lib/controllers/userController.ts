import db from "@/lib/db";
import User, { IUser } from "@/lib/models/User";
import UserSettings from "@/lib/models/UserSettings";
import TelemetryEvent from "@/lib/models/TelemetryEvent";
import hashUserId from "@/lib/utils/hash";
import type { ObjectId, PipelineStage } from "mongoose";
import config from "@/lib/config";
// Local, narrow type for selecting only public-safe profile fields
type PublicSettingsProfile = {
  profile?: {
    shortBio?: string;
    github?: string;
    linkedin?: string;
    x?: string;
    instagram?: string;
    website?: string;
  };
} | null;

/**
 * Find or create a user based on email
 * If user exists, update their name and image if they have changed
 * If user doesn't exist, create a new one
 */
export async function findOrCreateUser(userData: {
  email: string;
  name?: string | null;
  image?: string | null;
}): Promise<IUser> {
  await db.connect();

  try {
    // Find the user by email
    const existingUser: IUser | null = await User.findOne({ email: userData.email });

    if (existingUser) {
      // Update existing user's name and/or image if changed; record a single history snapshot when either changes
      let hasChanges = false;

      const nameChanged = !!(userData.name && existingUser.name !== userData.name);
      // Normalize image for reliable comparison (treat null as empty string)
      const currentImage = existingUser.image || "";
      const providedImage = userData.image === undefined ? undefined : userData.image || "";
      const imageChanged = providedImage !== undefined && currentImage !== providedImage;

      if (nameChanged || imageChanged) {
        const nextName = nameChanged ? (userData.name as string) : existingUser.name;
        const nextImage = imageChanged ? (providedImage as string) : currentImage;

        existingUser.name = nextName;
        existingUser.image = nextImage;
        // Append a snapshot of the new visible profile values
        existingUser.profileHistory = existingUser.profileHistory || [];
        existingUser.profileHistory.push({
          name: nextName,
          image: nextImage,
          changedAt: new Date()
        });
        hasChanges = true;
      }

      if (userData.email === config.associationEmail && existingUser.role !== "admin") {
        existingUser.role = "admin";
        hasChanges = true;
      }

      if (hasChanges) {
        await existingUser.save();
      }

      return existingUser;
    } else {
      // Create new user if not found
      const name = userData.name || "Unknown Name";
      const image = userData.image || "";
      const newUser = await User.create({
        email: userData.email,
        name,
        image,
        role: userData.email === config.associationEmail ? "admin" : "user",
        profileHistory: [
          {
            name,
            image,
            changedAt: new Date()
          }
        ]
      });

      return newUser;
    }
  } catch (error) {
    console.error("Error in findOrCreateUser:", error);
    throw new Error("Failed to find or create user");
  }
}

/**
 * Find a user by email
 */
export async function findUserByEmail(email: string): Promise<IUser | null> {
  await db.connect();

  try {
    const user = await User.findOne({ email });
    return user;
  } catch (error) {
    console.error("Error finding user by email:", error);
    throw new Error("Failed to find user");
  }
}

/**
 * Find a user by ID
 */
export async function findUserById(id: string): Promise<IUser | null> {
  await db.connect();

  try {
    const user = await User.findById(id);
    return user;
  } catch (error) {
    console.error("Error finding user by ID:", error);
    throw new Error("Failed to find user");
  }
}

/**
 * Update user information
 */
export async function updateUser(
  id: string,
  updateData: Partial<{
    name: string;
    email: string;
    image: string;
    role: "user" | "team" | "admin";
  }>
): Promise<IUser | null> {
  await db.connect();

  try {
    const user = await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    return user;
  } catch (error) {
    console.error("Error updating user:", error);
    throw new Error("Failed to update user");
  }
}

/**
 * Delete a user by ID
 */
export async function deleteUser(id: string): Promise<boolean> {
  await db.connect();

  try {
    const result = await User.findByIdAndDelete(id);
    return result !== null;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new Error("Failed to delete user");
  }
}

/**
 * Fully delete a user's account and related data (settings, telemetry).
 * Returns true if the user existed and was deleted.
 */
export async function deleteUserAccount(userId: string): Promise<boolean> {
  await db.connect();
  const user = await User.findById(userId).select("email");
  if (!user) return false;

  // Never allow deleting the association/superadmin account
  const assoc = config.associationEmail?.toLowerCase();
  if (assoc && (user.email || "").toLowerCase() === assoc) {
    const err: Error & { status?: number } = new Error("Forbidden");
    err.status = 403;
    throw err;
  }

  // Delete related documents first
  const pseudo = hashUserId(userId);
  await Promise.all([
    UserSettings.deleteOne({ userId }).catch(() => {}),
    TelemetryEvent.deleteMany({ pseudoUserId: pseudo }).catch(() => {})
  ]);

  const res = await User.findByIdAndDelete(userId);
  return res !== null;
}

/**
 * Get all users (for admin purposes)
 */
export async function getAllUsers(): Promise<IUser[]> {
  await db.connect();

  try {
    const users = await User.find({}).select("-__v");
    return users;
  } catch (error) {
    console.error("Error getting all users:", error);
    throw new Error("Failed to get users");
  }
}

/**
 * List users with search, pagination and special sorting.
 * Association email (if provided) appears first and is coerced to role 'admin' in the result.
 */
export async function listUsers(params: {
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ items: IUser[]; total: number; page: number; pageSize: number }> {
  await db.connect();

  const q = (params.q || "").trim();
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.max(1, Math.min(params.pageSize || 20, 100));

  const match: Record<string, unknown> = {};
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    match.$or = [{ name: rx }, { email: rx }];
  }

  const rolePriorityExpr = {
    $switch: {
      branches: [
        { case: { $eq: ["$role", "admin"] }, then: 2 },
        { case: { $eq: ["$role", "team"] }, then: 1 }
      ],
      default: 0
    }
  } as const;

  const assoc = config.associationEmail?.toLowerCase();

  const pipeline: PipelineStage[] = [
    { $match: match },
    {
      $addFields: {
        rolePriority: rolePriorityExpr,
        isAssociation: assoc ? { $eq: [{ $toLower: "$email" }, assoc] } : false
      }
    },
    { $sort: { isAssociation: -1, rolePriority: -1, name: 1, email: 1 } },
    { $project: { rolePriority: 0, isAssociation: 0 } },
    { $skip: (page - 1) * pageSize },
    { $limit: pageSize }
  ];

  const totalAgg = await User.aggregate([{ $match: match }, { $count: "total" }]);
  const total = (totalAgg[0]?.total as number) || 0;

  const rawItems = (await User.aggregate(pipeline)) as unknown as Array<
    Pick<IUser, keyof IUser> & { email: string; role: IUser["role"] }
  >;
  const items: IUser[] = rawItems.map((u) => {
    if (assoc && String(u.email).toLowerCase() === assoc) {
      return { ...(u as IUser), role: "admin" } as IUser;
    }
    return u as IUser;
  });

  return { items, total, page, pageSize };
}

/**
 * Update a user's role with strict rules:
 * - Team members cannot update any roles.
 * - Admins can only promote users -> team and demote team -> user; cannot assign/remove admin.
 * - Only the association email account can promote/demote admins.
 * - The association email account itself cannot be modified.
 */
type ErrorWithStatus = Error & { status?: number };

export async function updateUserRole(
  id: string,
  newRole: "user" | "team" | "admin",
  opts: { requesterRole: "user" | "team" | "admin"; requesterEmail?: string | null }
): Promise<{ ok: true }> {
  await db.connect();

  const user = await User.findById(id);
  if (!user) throw new Error("NotFound");

  const assoc = config.associationEmail?.toLowerCase();
  const requesterIsAssoc = assoc && (opts.requesterEmail || "").toLowerCase() === assoc;

  // Target is the association account? never allow changes
  if (assoc && user.email?.toLowerCase() === assoc) {
    const err: ErrorWithStatus = new Error("Forbidden");
    err.status = 403;
    throw err;
  }

  // If not superadmin, admins are limited to user/team transitions and cannot touch admins
  if (!requesterIsAssoc) {
    if (opts.requesterRole === "team" || opts.requesterRole === "user") {
      const err: ErrorWithStatus = new Error("Forbidden");
      err.status = 403;
      throw err;
    }

    if (newRole === "admin" || user.role === "admin") {
      const err: ErrorWithStatus = new Error("Forbidden");
      err.status = 403;
      throw err;
    }
    // Allow only user <-> team transitions
    if (
      !(
        (user.role === "user" && newRole === "team") ||
        (user.role === "team" && newRole === "user") ||
        user.role === newRole
      )
    ) {
      const err: ErrorWithStatus = new Error("Forbidden");
      err.status = 403;
      throw err;
    }
  }

  user.role = newRole;
  await user.save();
  return { ok: true };
}

/** Set or update the user's data export cooldown timestamp */
export async function setUserDataExportCooldown(userId: string, until: Date) {
  await db.connect();
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { downloadDataDisabledUntil: until } },
    { new: true }
  );
  return user;
}

export async function publicGetTeamMembers() {
  // used in about us page
  await db.connect();
  const assoc = config.associationEmail?.toLowerCase();
  const users = await User.find({ role: { $in: ["team", "admin"] }, email: { $ne: assoc } })
    .select("name displayName image role showProfilePublicly")
    .lean(); // convierte a objetos literales
  return users;
}

export type PublicUserProfile = {
  id: string;
  name: string;
  image?: string;
  bio?: string;
  /** Whether the user's profile is private (showProfilePublicly === false) */
  isPrivate: boolean;
  socials: {
    instagram?: string;
    linkedin?: string;
    github?: string;
    x?: string;
    website?: string;
  };
};

/**
 * Return minimal, public-safe profile data for a user or null if private/not found.
 * - Honors User.showProfilePublicly
 * - Does NOT return email or sensitive fields
 */
export async function getPublicUserProfile(
  id: string,
  requesterId: string | null
): Promise<PublicUserProfile | null> {
  await db.connect();

  type LeanUserPublic = Pick<IUser, "name" | "displayName" | "image" | "showProfilePublicly"> & {
    _id: unknown;
  };
  let user: LeanUserPublic | null = null;
  try {
    user = (await User.findById(id)
      .select("name displayName image showProfilePublicly")
      .lean()) as LeanUserPublic | null;
  } catch {
    return null;
  }

  if (!user || (user.showProfilePublicly === false && id !== requesterId)) return null;

  const settings = (await UserSettings.findOne({ userId: user._id })
    .select(
      "profile.shortBio profile.github profile.linkedin profile.x profile.instagram profile.website"
    )
    .lean()) as PublicSettingsProfile;

  const name = user.displayName || user.name;
  const profile: PublicUserProfile = {
    id: String(user._id),
    name,
    image: user.image || undefined,
    bio: settings?.profile?.shortBio,
    isPrivate: user.showProfilePublicly === false,
    socials: {
      instagram: settings?.profile?.instagram,
      linkedin: settings?.profile?.linkedin,
      github: settings?.profile?.github,
      x: settings?.profile?.x,
      website: settings?.profile?.website
    }
  };

  return profile;
}

export type UserMentionData = {
  id?: string;
  name?: string;
  image?: string;
  isPrivate?: boolean;
};

export async function getUserMentionData(
  id: string,
  isAdmin: boolean = false
): Promise<UserMentionData> {
  await db.connect();

  type LeanUserPublic = Pick<IUser, "name" | "displayName" | "image" | "showProfilePublicly"> & {
    _id: ObjectId;
  };
  let user: LeanUserPublic | null = null;
  try {
    user = (await User.findById(id)
      .select("name displayName image showProfilePublicly")
      .lean()) as LeanUserPublic | null;
  } catch {
    return {};
  }

  if (!user) return {};

  if (!isAdmin) {
    const settings = await UserSettings.findOne({ userId: user._id })
      .select("privacy.allowMentionBlog")
      .lean();

    if (!settings?.privacy?.allowMentionBlog) return { id: user._id.toString() };
  }

  return {
    id: user._id.toString(),
    name: user.displayName || user.name,
    image: user.image,
    isPrivate: user.showProfilePublicly === false
  };
}
