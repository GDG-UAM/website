import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const NEXTAUTH_SECRET = process.env.SESSION_SECRET;

// Define route permissions
const ROUTE_PERMISSIONS = {
  "/settings": "user",
  "/admin": "team",
  "/api/admin": "team"
};

// Routes that are completely public
const PUBLIC_ROUTES = [
  "/",
  "/about",
  "/activities",
  "/blog",
  "/conduct",
  "/contact",
  "/events",
  "/newsletter",
  "/privacy",
  "/api/auth",
  "/api/giveaways",
  "/api/socket",
  "/api/feature-flags/export",
  "/_next",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml"
];

/**
 * Check if user has required permissions for a route
 */
function hasPermission(userRole: string, requiredRole: string): boolean {
  const hierarchy: Record<string, number> = {
    user: 0,
    team: 1,
    admin: 2
  };

  const userLevel = hierarchy[userRole] ?? -1;
  return userLevel >= (hierarchy[requiredRole] ?? Infinity);
}

/**
 * Get the most specific route match for permission checking
 */
function getMatchingRoute(pathname: string): string | null {
  // Sort routes by length (most specific first)
  const routes = Object.keys(ROUTE_PERMISSIONS).sort((a, b) => b.length - a.length);

  for (const route of routes) {
    if (pathname.startsWith(route)) {
      return route;
    }
  }

  return null;
}

/**
 * Check if the route is public
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => {
    if (route.endsWith("*")) {
      return pathname.startsWith(route.slice(0, -1));
    }
    return pathname === route || pathname.startsWith(route + "/");
  });
}

/**
 * Check if the route requires authentication
 */
function isProtectedRoute(pathname: string): boolean {
  return Object.keys(ROUTE_PERMISSIONS).some((route) => pathname.startsWith(route));
}

/**
 * Find the closest accessible ancestor route for the given pathname.
 * Example: If user tries "/admin/permissions" and lacks perms for it,
 * this will check "/admin" next (and so on) to find the nearest allowed page.
 */
function findClosestAccessibleRoute(pathname: string, userRole: string): string | null {
  // Start from the most specific protected route that matches the pathname
  const matched = getMatchingRoute(pathname);
  if (!matched) {
    return null;
  }

  // Generate ancestors from the matched route (excluding itself first)
  const ancestors: string[] = [];
  const parts = matched.split("/").filter(Boolean); // e.g., ["admin","permissions"]

  // Build ancestor paths like ["/admin"] for matched "/admin/permissions"
  for (let i = parts.length - 1; i > 0; i--) {
    const ancestor = "/" + parts.slice(0, i).join("/");
    ancestors.push(ancestor);
  }

  // Check each ancestor if it's protected and accessible
  for (const ancestorRoute of ancestors) {
    if (ROUTE_PERMISSIONS[ancestorRoute as keyof typeof ROUTE_PERMISSIONS]) {
      const requiredRole = ROUTE_PERMISSIONS[ancestorRoute as keyof typeof ROUTE_PERMISSIONS];
      if (hasPermission(userRole, requiredRole)) {
        return ancestorRoute;
      }
    }
  }

  return null;
}

/**
 * Create redirect response with return URL
 */
function createRedirectResponse(request: NextRequest, redirectTo: string): NextResponse {
  const baseUrl = request.nextUrl.hostname.startsWith("localhost")
    ? request.nextUrl.origin
    : "https://gdguam.es";
  const url = new URL(redirectTo, baseUrl);

  // Add the return URL as a parameter for post-login redirect
  if (redirectTo === "/login") {
    // Use the actual request URL for the callback, but only the pathname and search
    const callbackUrl = new URL(request.url);
    const cleanCallbackUrl = `${baseUrl}${callbackUrl.pathname}${callbackUrl.search}`;
    url.searchParams.set("callbackUrl", cleanCallbackUrl);
  }

  return NextResponse.redirect(url);
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse, request: NextRequest): NextResponse {
  // Only add security headers for HTML pages, not API routes
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    // Add CSP for admin pages
    if (request.nextUrl.pathname.startsWith("/admin")) {
      response.headers.set(
        "Content-Security-Policy",
        "default-src 'self'; img-src 'self' https: data:; connect-src 'self' https: ws: wss:; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
      );
    }
  }

  return response;
}

/**
 * Main middleware function
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log(`[Middleware] Processing request to: ${pathname}`);

  // Skip middleware for static files and internal Next.js routes
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/auth/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Allow public routes
  if (isPublicRoute(pathname)) {
    console.log(`[Middleware] Public route: ${pathname}`);
    // For API routes, we also intercept to record api_request timing without altering route code
    if (
      pathname.startsWith("/api/") &&
      !pathname.startsWith("/api/auth/") &&
      pathname !== "/api/telemetry" &&
      pathname !== "/api/socket"
    ) {
      const start = Date.now();
      const response = NextResponse.next();
      // After response is created, schedule telemetry (status not directly available here; use 200 assumption)
      try {
        emitApiTelemetry(request, {
          route: pathname,
          method: request.method,
          status: 200,
          durationMs: Date.now() - start,
          ok: true
        });
      } catch {}
      return addSecurityHeaders(response, request);
    }
    return addSecurityHeaders(NextResponse.next(), request);
  }

  // Get the user's session token
  const token = await getToken({
    req: request,
    secret: NEXTAUTH_SECRET,
    cookieName: "next-auth.session-token"
  });

  // If route requires authentication but user is not logged in
  if (isProtectedRoute(pathname) && !token?.email) {
    console.log(`[Middleware] Redirecting unauthenticated user to login`);
    return createRedirectResponse(request, "/login");
  }

  // If user is authenticated, check role-based permissions
  if (token?.email && isProtectedRoute(pathname)) {
    // Get user role from the token (this should be set during session callback)
    const userRole =
      token.email === process.env.ASSOCIATION_EMAIL ? "admin" : (token.role as string) || "user";

    // Check route permissions
    const matchingRoute = getMatchingRoute(pathname);
    if (matchingRoute) {
      const requiredRole = ROUTE_PERMISSIONS[matchingRoute as keyof typeof ROUTE_PERMISSIONS];

      if (!hasPermission(userRole, requiredRole)) {
        console.log(
          `[Middleware] Access denied. User role: ${userRole}, Required: ${requiredRole}`
        );
        const fallback = findClosestAccessibleRoute(pathname, userRole) || "/";
        console.log(`[Middleware] Redirecting to fallback route: ${fallback}`);
        return createRedirectResponse(request, fallback);
      }
    }

    console.log(`[Middleware] Access granted for user: ${token.email} (${userRole})`);

    // Add user info to headers for use in pages/API routes
    const response = NextResponse.next();

    return addSecurityHeaders(response, request);
  }

  // Default: allow request to proceed, and intercept API requests to record telemetry
  console.log(`[Middleware] Request proceeding: ${pathname}`);
  if (
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/auth/") &&
    pathname !== "/api/telemetry"
  ) {
    const start = Date.now();
    const response = NextResponse.next();
    try {
      const status = 200; // Next middleware cannot introspect downstream status reliably
      emitApiTelemetry(request, {
        route: pathname,
        method: request.method,
        status,
        durationMs: Date.now() - start,
        ok: status >= 200 && status < 400
      });
    } catch {}
    return addSecurityHeaders(response, request);
  }
  return addSecurityHeaders(NextResponse.next(), request);
}

// Edge-safe telemetry emitter that posts to /api/telemetry
function emitApiTelemetry(
  request: NextRequest,
  info: { route: string; method: string; status: number; durationMs: number; ok: boolean }
) {
  try {
    if (info.route === "/api/telemetry") return; // extra safety
    const h = request.headers;
    const ua = h.get("user-agent") || "";
    const browser = /edg\//i.test(ua)
      ? "Edge"
      : /chrome|crios|crmo/i.test(ua)
        ? "Chrome"
        : /firefox|fxios/i.test(ua)
          ? "Firefox"
          : /safari/i.test(ua) && !/chrome|crios|crmo/i.test(ua)
            ? "Safari"
            : /android/i.test(ua)
              ? "Android WebView"
              : /iphone|ipad|ipod/i.test(ua)
                ? "iOS WebView"
                : "Unknown";
    const browserVersionMatch = ua.match(
      /(chrome|crios|firefox|fxios|edg|version)\/(\d+[\.\d+]*)/i
    );
    const browser_version = browserVersionMatch?.[2];
    const os_version =
      (/windows nt ([\d\.]+)/i.exec(ua)?.[1] ||
        /android ([\d\.]+)/i.exec(ua)?.[1] ||
        /cpu (?:iphone )?os ([\d_]+)/i.exec(ua)?.[1]?.replace(/_/g, ".")) ??
      undefined;

    // Geo: prefer Cloudflare headers when present, else fall back to Vercel-style or generic
    const cfCountry = h.get("cf-ipcountry") || undefined;
    const cfRegion = h.get("cf-region") || h.get("cf-ipregion") || undefined; // may be enterprise-only
    const cfCity = h.get("cf-ipcity") || undefined; // may be enterprise-only
    const cfTz = h.get("cf-timezone") || undefined; // may be enterprise-only
    const ipHeader =
      h.get("cf-connecting-ip") ||
      (h.get("x-forwarded-for") || "").split(",")[0] ||
      h.get("x-real-ip") ||
      undefined;
    const geo = {
      country_code: cfCountry || h.get("x-vercel-ip-country") || undefined,
      region_code: cfRegion || h.get("x-vercel-ip-country-region") || undefined,
      region: cfCity || h.get("x-vercel-ip-city") || undefined,
      time_zone: cfTz || h.get("x-vercel-ip-timezone") || undefined,
      ip: ipHeader
    } as Record<string, string | undefined>;

    const environment = {
      commit: process.env.NEXT_PUBLIC_GIT_SHA || undefined,
      browser,
      browser_version,
      os_version
    } as Record<string, string | undefined>;

    const event = {
      event_type: "api_request",
      event_source: "server",
      timestamp: new Date().toISOString(),
      domain: request.nextUrl.hostname,
      path: info.route,
      environment,
      geo,
      api: {
        route: info.route,
        method: info.method,
        status: info.status,
        duration_ms: info.durationMs,
        ok: info.ok
      }
    };

    const origin = request.nextUrl.origin;
    void fetch(`${origin}/api/telemetry`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      cache: "no-store",
      body: JSON.stringify([event])
    }).catch(() => {});
  } catch {
    // ignore
  }
}

// Specify which routes to run middleware on
export const config = {
  matcher: ["/((?!api/auth|_next|favicon.ico|robots.txt|.*\\..*).*)"]
};
