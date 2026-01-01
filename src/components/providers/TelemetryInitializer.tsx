"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { setConsent, trackRouteView, track, type Payload } from "@/lib/telemetry/client";

export default function TelemetryInitializer() {
  const pathname = usePathname();
  const { data } = useSession();
  const fetchPatchedRef = useRef(false);

  // Consent gate from session
  useEffect(() => {
    // const allow = !!data?.user?.allowAnonUsage;
    const allow = false;
    setConsent(allow);
    if (allow) {
      // Snapshot environment & locales once per session
      const d = document.documentElement;
      const ua = navigator.userAgent || "";
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
      const env = {
        app_version: process.env.NEXT_PUBLIC_APP_VERSION || undefined,
        commit: process.env.NEXT_PUBLIC_GIT_SHA || undefined,
        release_channel: process.env.NODE_ENV === "development" ? "canary" : "stable",
        browser,
        browser_version,
        browser_user_agent: navigator.userAgent,
        device_type: /Mobi|Android/i.test(navigator.userAgent)
          ? "mobile"
          : /iPad|Tablet/i.test(navigator.userAgent)
            ? "tablet"
            : "desktop",
        os: navigator.platform,
        os_version,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        device_pixel_ratio: window.devicePixelRatio,
        connection_type:
          (typeof navigator !== "undefined" &&
            (navigator as unknown as { connection?: { effectiveType?: string } }).connection
              ?.effectiveType) ||
          "unknown",
        theme: d.getAttribute("data-theme") || "system",
        accessibility: {
          high_contrast: d.hasAttribute("data-contrast"),
          reduced_motion: d.hasAttribute("data-reduce-motion"),
          dyslexic_font: d.hasAttribute("data-dyslexic-font"),
          daltonism_mode: d.hasAttribute("data-deuteranopia")
            ? "deuteranopia"
            : d.hasAttribute("data-protanopia")
              ? "protanopia"
              : d.hasAttribute("data-tritanopia")
                ? "tritanopia"
                : "none"
        }
      } as const;

      const locale = {
        chosen_locale: document.documentElement.lang,
        detected_locale: navigator.language,
        rendered_locale: document.documentElement.lang,
        system_locale: navigator.language,
        accepted_languages: navigator.languages,
        primary_accepted_language: navigator.languages?.[0]
      } as const;

      const payload: Payload = {
        domain: window.location.hostname,
        path: window.location.pathname,
        referrer: document.referrer || undefined,
        environment: env as unknown as Payload["string"],
        locale: locale as unknown as Payload["string"]
      } as unknown as Payload;
      track("session_start", payload);
    }
  }, [data?.user]);

  // Route tracking
  useEffect(() => {
    if (pathname) trackRouteView(pathname);
  }, [pathname]);

  // Patch window.fetch once consent is set to track api_request events globally (client-side)
  useEffect(() => {
    if (!fetchPatchedRef.current && typeof window !== "undefined") {
      fetchPatchedRef.current = true;
      const origFetch = window.fetch.bind(window);
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        try {
          const url =
            typeof input === "string"
              ? new URL(input, window.location.origin)
              : input instanceof URL
                ? input
                : new URL((input as Request).url, window.location.origin);
          const method = (init?.method || (input as Request)?.method || "GET").toUpperCase();
          // Only track same-origin /api calls and skip telemetry endpoint itself
          const isSameOrigin = url.origin === window.location.origin;
          if (
            isSameOrigin &&
            url.pathname.startsWith("/api/") &&
            url.pathname !== "/api/telemetry"
          ) {
            const t0 = performance.now();
            try {
              const res = await origFetch(input as RequestInfo, init as RequestInit);
              const t1 = performance.now();
              const duration = Math.round(t1 - t0);
              track("api_request", {
                domain: window.location.hostname,
                path: url.pathname,
                api: {
                  route: url.pathname,
                  method,
                  status: (res as Response).status,
                  duration_ms: duration,
                  ok: (res as Response).ok
                } as unknown as Payload["string"]
              } as unknown as Payload);
              return res;
            } catch (err) {
              const t1 = performance.now();
              const duration = Math.round(t1 - t0);
              track("api_request", {
                domain: window.location.hostname,
                path: url.pathname,
                api: {
                  route: url.pathname,
                  method,
                  status: 0,
                  duration_ms: duration,
                  ok: false
                } as unknown as Payload["string"],
                error: {
                  message: err instanceof Error ? err.message : String(err)
                } as unknown as Payload["string"]
              } as unknown as Payload);
              throw err;
            }
          }
        } catch {
          // ignore URL parsing issues; just fall through
        }
        return origFetch(input as RequestInfo, init as RequestInit);
      };
    }
  }, []);

  return null;
}
