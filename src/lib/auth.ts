import { AuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import config from "@/lib/config";
import { findOrCreateUser, findUserByEmail, findUserById } from "@/lib/controllers/userController";
import FeatureFlagsProxy from "@/lib/featureFlags";
import { cookies } from "next/headers";
import { routing } from "@/i18n/routing";
import { trackServerEvent } from "@/lib/controllers/telemetryController";

export const authOptions: AuthOptions = {
  secret: config.sessionSecret,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production"
      }
    }
  },
  providers: [
    ((Google as unknown as { default: typeof Google }).default || Google)({
      clientId: config.google.clientID!,
      clientSecret: config.google.clientSecret!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      try {
        // Use user controller to find or create user
        await findOrCreateUser({
          email: user.email!,
          name: user.name,
          image: user.image
        });
        // Telemetry: auth_login (non-blocking)
        try {
          void trackServerEvent({
            reqHeaders: new Headers(),
            userId: undefined, // userId not yet established here
            allowAnon: true,
            eventType: "auth_login",
            path: "/api/auth/callback",
            domain: undefined,
            referrer: undefined,
            props: { event_props: { provider: account?.provider } }
          });
        } catch {}
        return true;
      } catch (error) {
        console.error("Error during sign in:", error);
        return false;
      }
    },
    async redirect({ url, baseUrl }) {
      // Handle the case where url contains the full callback URL
      if (url.includes("callbackUrl=")) {
        try {
          const urlObj = new URL(url);
          const callbackUrl = urlObj.searchParams.get("callbackUrl");
          if (callbackUrl) {
            const decodedCallback = decodeURIComponent(callbackUrl);

            // Ensure the callback URL is safe (same origin)
            try {
              const callbackUrlObj = new URL(decodedCallback);
              if (callbackUrlObj.origin === baseUrl || decodedCallback.startsWith("/")) {
                return decodedCallback;
              }
            } catch {
              // If callback URL is relative, use it
              if (decodedCallback.startsWith("/")) {
                return `${baseUrl}${decodedCallback}`;
              }
            }
          }
        } catch (error) {
          console.error("[NextAuth] Error parsing callback URL:", error);
        }
      }

      // If url is already absolute (starts with http), use it
      if (url.startsWith("http")) {
        const urlObj = new URL(url);
        // Only allow redirects to the same host for security
        if (urlObj.origin === baseUrl) {
          return url;
        }
        // If it's not the same origin, redirect to base URL
        return baseUrl;
      }

      // If url starts with "/", it's a relative path - make it absolute
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      // Default to base URL for any other case
      return baseUrl;
    },
    async jwt({ token, user }) {
      // Only embed immutable / rarely changing identifiers; keep JWT small & stable.
      if (user?.email) {
        try {
          const dbUser = await findUserByEmail(user.email);
          if (dbUser) {
            token.role = dbUser.role;
            token.id = dbUser._id.toString();
          }
        } catch (error) {
          console.error("[auth.jwt] lookup failed", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Always fetch freshest user document (avoid encoding mutable fields in JWT)
      const userId = token.id as string | undefined;
      if (userId) {
        try {
          const dbUser = await findUserById(userId);
          if (dbUser) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const userObj = (session.user ??= {} as any);
            userObj.id = dbUser._id.toString();
            userObj.role = dbUser.role;
            userObj.name = dbUser.name || userObj.name;
            userObj.email = dbUser.email || userObj.email;
            userObj.image = dbUser.image || userObj.image;
            userObj.displayName =
              (dbUser as unknown as { displayName?: string }).displayName || dbUser.name || "";
            userObj.allowAnonUsage =
              (dbUser as unknown as { allowAnonUsage?: boolean }).allowAnonUsage ?? false;
            userObj.showProfilePublicly =
              (dbUser as unknown as { showProfilePublicly?: boolean }).showProfilePublicly ?? false;
            // Data export cooldown for UI (serialized as ISO string)
            (userObj as Record<string, unknown>).downloadDataDisabledUntil = (
              dbUser as unknown as { downloadDataDisabledUntil?: Date }
            ).downloadDataDisabledUntil?.toISOString?.();
          }
          // Initialize flags using (possibly) experimental user overrides inside evaluation logic (controller handles precedence)
          const flagsProxy = new FeatureFlagsProxy(userId, userId);
          const env = process.env.NODE_ENV === "development" ? "development" : "production";
          await flagsProxy.initialize(env);
          // Ensure a plain serializable object of booleans is attached to the session
          const safeFlags = flagsProxy.createSafeFlags();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (session.user ??= {} as any).flags = JSON.parse(JSON.stringify(safeFlags));
        } catch (error) {
          console.error("[auth.session] refresh failed", error);
        }
      }
      // Attach current locale from cookie so clients (telemetry) can read a stable rendered locale from session
      try {
        const cookieStore = await cookies();
        const cookieLocale =
          cookieStore.get("NEXT_LOCALE")?.value ?? cookieStore.get("locale")?.value;
        session.locale = cookieLocale || routing.defaultLocale;
      } catch {
        // noop
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
    signOut: "/logout",
    error: "/auth/error"
  }
};
