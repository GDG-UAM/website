import {
  getUserFlags,
  evaluateFlag,
  FlagEvaluationResult
} from "@/lib/controllers/featureFlagController";
import logger from "@/lib/logger";

export interface SafeFeatureFlags {
  [flagKey: string]:
    | boolean
    | ((flagKey: string) => boolean)
    | ((flagKey: string) => string | undefined)
    | ((flagKey: string) => Record<string, unknown> | undefined);
  isEnabled(flagKey: string): boolean;
  getVariant(flagKey: string): string | undefined;
  getMetadata(flagKey: string): Record<string, unknown> | undefined;
}

type Env = "development" | "production";

class FeatureFlagsProxy {
  private flags: Record<string, FlagEvaluationResult> = {};
  private userId: string;
  private sessionId?: string;
  private registeredFlags: Set<string> = new Set();
  private environment: Env = "production";

  constructor(userId: string, sessionId?: string) {
    this.userId = userId;
    this.sessionId = sessionId;
  }

  async initialize(environment: Env = "production"): Promise<void> {
    try {
      this.environment = environment;
      this.flags = await getUserFlags(this.userId, environment);
      this.registeredFlags = new Set(Object.keys(this.flags));
    } catch (error) {
      logger.error("Failed to initialize user flags", {
        userId: this.userId,
        sessionId: this.sessionId,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  private logUnknownFlag(flagKey: string): void {
    logger.flagWarning(
      flagKey,
      `Attempt to access unregistered or deleted feature flag: ${flagKey}`,
      this.userId,
      this.sessionId
    );
  }

  createSafeFlags(): SafeFeatureFlags {
    const flags = new Proxy({} as SafeFeatureFlags, {
      get: (target, prop: string | symbol) => {
        if (typeof prop !== "string") {
          return undefined;
        }

        // Handle JSON serialization - prevent toJSON from being treated as a feature flag
        if (prop === "toJSON") {
          return () => {
            // Return a plain object with only the actual flag values for JSON serialization
            const plainFlags: Record<string, boolean> = {};
            for (const flagKey of this.registeredFlags) {
              plainFlags[flagKey] = this.flags[flagKey]?.enabled || false;
            }
            return plainFlags;
          };
        }

        // Handle special methods
        if (prop === "isEnabled") {
          return (flagKey: string): boolean => {
            if (!this.registeredFlags.has(flagKey)) {
              this.logUnknownFlag(flagKey);
              return false;
            }
            return this.flags[flagKey]?.enabled || false;
          };
        }

        if (prop === "getVariant") {
          return (flagKey: string): string | undefined => {
            if (!this.registeredFlags.has(flagKey)) {
              this.logUnknownFlag(flagKey);
              return undefined;
            }
            return this.flags[flagKey]?.variant;
          };
        }

        if (prop === "getMetadata") {
          return (flagKey: string): Record<string, unknown> | undefined => {
            if (!this.registeredFlags.has(flagKey)) {
              this.logUnknownFlag(flagKey);
              return undefined;
            }
            return this.flags[flagKey]?.metadata as Record<string, unknown> | undefined;
          };
        }

        // Handle direct flag access
        if (!this.registeredFlags.has(prop)) {
          this.logUnknownFlag(prop);
          return false;
        }

        return this.flags[prop]?.enabled || false;
      },

      ownKeys: () => {
        return Array.from(this.registeredFlags);
      },

      getOwnPropertyDescriptor: (target, prop) => {
        if (
          typeof prop === "string" &&
          (this.registeredFlags.has(prop) ||
            ["isEnabled", "getVariant", "getMetadata", "toJSON"].includes(prop))
        ) {
          return {
            enumerable: prop !== "toJSON", // Don't make toJSON enumerable
            configurable: true,
            value: flags[prop as keyof SafeFeatureFlags]
          };
        }
        return undefined;
      }
    });

    return flags;
  }

  async refreshFlag(flagKey: string, environment: Env = this.environment): Promise<void> {
    try {
      const result = await evaluateFlag(flagKey, this.userId, environment);
      this.flags[flagKey] = result;
      this.registeredFlags.add(flagKey);
    } catch (error) {
      logger.error(`Failed to refresh flag ${flagKey}`, {
        userId: this.userId,
        sessionId: this.sessionId,
        flagKey,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
}

export default FeatureFlagsProxy;
