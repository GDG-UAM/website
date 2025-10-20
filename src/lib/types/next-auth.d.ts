import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";
import { SafeFeatureFlags } from "@/lib/featureFlags";

declare module "next-auth" {
  interface Session {
    // Current UI locale (from NEXT_LOCALE cookie). Optional to keep backward compat.
    locale?: string;
    user?: {
      id: string;
      flags: SafeFeatureFlags;
      role: string;
      displayName?: string;
      allowAnonUsage?: boolean;
      showProfilePublicly?: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    role: string;
    displayName?: string;
    allowAnonUsage?: boolean;
    showProfilePublicly?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role?: string;
    id?: string;
  }
}
