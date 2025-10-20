import db from "@/lib/db";
import FeatureFlag, { IFeatureFlag } from "@/lib/models/FeatureFlag";
import User from "@/lib/models/User";
import PerformanceMetric from "@/lib/models/PerformanceMetric";

// Hash function for consistent user assignment
function hashUserId(userId: string, flagKey: string): number {
  let hash = 5381;
  const maxLength = Math.max(userId.length, flagKey.length);

  for (let i = 0; i < maxLength; i++) {
    if (i < userId.length) {
      hash = (hash * 33) ^ userId.charCodeAt(i);
    }
    if (i < flagKey.length) {
      hash = (hash * 33) ^ flagKey.charCodeAt(i);
    }
  }

  return Math.abs(hash) % 100;
}

export interface FlagEvaluationResult {
  enabled: boolean;
  variant?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Check if a user should have a specific feature flag enabled
 */
export async function evaluateFlag(
  flagKey: string,
  userId: string,
  environment: "development" | "production" = "production"
): Promise<FlagEvaluationResult> {
  await db.connect();

  try {
    // Check user experimental overrides first (fast path). If user has explicit override, return it immediately
    const userDoc = await User.findById(userId).select("experimentalOverrides");
    const overrideValue = userDoc?.experimentalOverrides?.[flagKey];
    // In production, do NOT allow overrides to force-enable development-only flags
    // We'll determine the flag's environment below; but overrides should never enable a dev flag in prod

    // In development, flags from both production and development apply (prod takes precedence if duplicate keys)
    let flag: IFeatureFlag | null = null;
    if (environment === "development") {
      // Prefer production flag if exists for the same key
      flag =
        (await FeatureFlag.findOne({ key: flagKey, environment: "production", isActive: true })) ||
        (await FeatureFlag.findOne({ key: flagKey, environment: "development", isActive: true }));
    } else {
      flag = await FeatureFlag.findOne({ key: flagKey, environment: "production", isActive: true });
    }

    if (!flag) {
      // No active flag record; allow a user override only in non-production
      if (environment !== "production" && typeof overrideValue === "boolean") {
        return { enabled: overrideValue, variant: overrideValue ? "override-on" : "override-off" };
      }
      return { enabled: false };
    }

    // If we're in production and the flag is a development flag, it's considered disabled and not applied
    if (environment === "production" && flag.environment === "development") {
      return { enabled: false };
    }

    // If we have a stored override and the flag environment permits it (dev) or we are in dev env
    if (typeof overrideValue === "boolean") {
      if (environment === "development" || flag.environment === "production") {
        // In dev env, any override can apply; for prod flags, overrides can turn off but not force on if excluded below
        return { enabled: overrideValue, variant: overrideValue ? "override-on" : "override-off" };
      }
    }

    // Check if user is explicitly excluded
    if (flag.excludeUsers.includes(userId)) {
      return { enabled: false };
    }

    // Check if user is explicitly included
    if (flag.targetUsers.includes(userId)) {
      return {
        enabled: true,
        variant: "target",
        metadata: flag.metadata
      };
    }

    // Check rollout percentage using consistent hashing
    const userHash = hashUserId(userId, flagKey);
    const enabled = userHash < flag.rolloutPercentage;

    return {
      enabled,
      variant: enabled ? "rollout" : "control",
      metadata: flag.metadata
    };
  } catch (error) {
    console.error(`Error evaluating flag ${flagKey}:`, error);
    return { enabled: false };
  }
}

/**
 * Get all flags for a user (for session flags property)
 */
export async function getUserFlags(
  userId: string,
  environment: "development" | "production" = "production"
): Promise<Record<string, FlagEvaluationResult>> {
  await db.connect();

  try {
    let flags: Array<{ key: string; environment: "development" | "production" }> = [];
    if (environment === "development") {
      // Union of prod and dev keys, with production taking precedence
      const prodFlags = await FeatureFlag.find({
        environment: "production",
        isActive: true
      }).select("key environment");
      const devFlags = await FeatureFlag.find({
        environment: "development",
        isActive: true
      }).select("key environment");
      const map = new Map<string, { key: string; environment: "production" | "development" }>();
      for (const f of prodFlags) map.set(f.key, { key: f.key, environment: "production" });
      for (const f of devFlags)
        if (!map.has(f.key)) map.set(f.key, { key: f.key, environment: "development" });
      flags = Array.from(map.values());
    } else {
      const onlyProd = await FeatureFlag.find({ environment: "production", isActive: true }).select(
        "key environment"
      );
      flags = onlyProd.map((f) => ({ key: f.key, environment: f.environment }));
    }

    const userFlags: Record<string, FlagEvaluationResult> = {};

    for (const flag of flags) {
      userFlags[flag.key] = await evaluateFlag(flag.key, userId, environment);
    }

    return userFlags;
  } catch (error) {
    console.error("Error getting user flags:", error);
    return {};
  }
}

/**
 * List feature flags with basic filtering and pagination
 */
export async function listFeatureFlags(params: {
  environment?: "development" | "production";
  isActive?: boolean;
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  await db.connect();

  const { environment, isActive, q, page = 1, pageSize = 20 } = params || {};

  const filter: Record<string, unknown> = {};
  if (environment) filter.environment = environment;
  if (typeof isActive === "boolean") filter.isActive = isActive;
  if (q && q.trim()) {
    const regex = new RegExp(q.trim(), "i");
    filter.$or = [{ name: regex }, { key: regex }, { description: regex }];
  }

  const skip = Math.max(0, (page - 1) * pageSize);

  const [items, total] = await Promise.all([
    FeatureFlag.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(pageSize),
    FeatureFlag.countDocuments(filter)
  ]);

  return { items, total, page, pageSize };
}

/**
 * Get a single feature flag by key and environment
 */
export async function getFeatureFlag(flagKey: string, environment: "development" | "production") {
  await db.connect();
  return FeatureFlag.findOne({ key: flagKey, environment });
}

/**
 * Create a new feature flag
 */
export async function createFeatureFlag(flagData: {
  name: string;
  key: string;
  description?: string;
  isActive?: boolean;
  rolloutPercentage?: number;
  targetUsers?: string[];
  excludeUsers?: string[];
  environment?: "development" | "production";
  createdBy: string;
  metadata?: Record<string, unknown>;
}): Promise<IFeatureFlag> {
  await db.connect();

  try {
    const flag = await FeatureFlag.create(flagData);
    return flag;
  } catch (error) {
    console.error("Error creating feature flag:", error);
    throw new Error("Failed to create feature flag");
  }
}

/**
 * Update a feature flag
 */
export async function updateFeatureFlag(
  flagKey: string,
  environment: string,
  updateData: Partial<IFeatureFlag>
): Promise<IFeatureFlag | null> {
  await db.connect();

  try {
    const flag = await FeatureFlag.findOneAndUpdate({ key: flagKey, environment }, updateData, {
      new: true,
      runValidators: true
    });
    return flag;
  } catch (error) {
    console.error("Error updating feature flag:", error);
    throw new Error("Failed to update feature flag");
  }
}

/**
 * Delete a feature flag
 */
export async function deleteFeatureFlag(flagKey: string, environment: string): Promise<boolean> {
  await db.connect();

  try {
    const result = await FeatureFlag.deleteOne({ key: flagKey, environment });
    return result.deletedCount > 0;
  } catch (error) {
    console.error("Error deleting feature flag:", error);
    throw new Error("Failed to delete feature flag");
  }
}

/**
 * Record performance metrics
 */
export async function recordPerformance(metricData: {
  flagKey: string;
  variant: string;
  userId?: string;
  sessionId?: string;
  endpoint?: string;
  action: string;
  duration: number;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await db.connect();

  try {
    await PerformanceMetric.create(metricData);
  } catch (error) {
    console.error("Error recording performance metric:", error);
    // Don't throw error - performance tracking shouldn't break the app
  }
}

/**
 * Get performance comparison between variants
 */
export async function getPerformanceComparison(
  flagKey: string,
  startDate: Date,
  endDate: Date,
  action?: string
): Promise<{
  variants: Record<
    string,
    {
      totalRequests: number;
      successRate: number;
      averageLatency: number;
      medianLatency: number;
      p95Latency: number;
      errorRate: number;
    }
  >;
  significance?: {
    isSignificant: boolean;
    confidenceLevel: number;
  };
}> {
  await db.connect();

  try {
    const matchQuery: Record<string, unknown> = {
      flagKey,
      timestamp: { $gte: startDate, $lte: endDate }
    };

    if (action) {
      matchQuery.action = action;
    }

    const metrics = await PerformanceMetric.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$variant",
          totalRequests: { $sum: 1 },
          successfulRequests: { $sum: { $cond: ["$success", 1, 0] } },
          durations: { $push: "$duration" },
          averageLatency: { $avg: "$duration" }
        }
      }
    ]);

    const variants: Record<
      string,
      {
        totalRequests: number;
        successRate: number;
        averageLatency: number;
        medianLatency: number;
        p95Latency: number;
        errorRate: number;
      }
    > = {};

    for (const metric of metrics) {
      const durations = metric.durations.sort((a: number, b: number) => a - b);
      const medianIndex = Math.floor(durations.length / 2);
      const p95Index = Math.floor(durations.length * 0.95);

      variants[metric._id] = {
        totalRequests: metric.totalRequests,
        successRate: (metric.successfulRequests / metric.totalRequests) * 100,
        averageLatency: metric.averageLatency,
        medianLatency: durations[medianIndex] || 0,
        p95Latency: durations[p95Index] || 0,
        errorRate: ((metric.totalRequests - metric.successfulRequests) / metric.totalRequests) * 100
      };
    }

    return { variants };
  } catch (error) {
    console.error("Error getting performance comparison:", error);
    throw new Error("Failed to get performance comparison");
  }
}
