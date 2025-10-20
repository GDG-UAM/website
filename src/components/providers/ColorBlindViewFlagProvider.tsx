"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

type SessionWithFlags = { user?: { flags?: Record<string, boolean> } } | null;

export default function ColorBlindViewFlagProvider() {
  const { data: session, status } = useSession();
  const flags = (session as SessionWithFlags)?.user?.flags || {};

  const viewAs: "deuteranopia" | "protanopia" | "tritanopia" | null = flags[
    "accessibility-view-as-deuteranopia"
  ]
    ? "deuteranopia"
    : flags["accessibility-view-as-protanopia"]
      ? "protanopia"
      : flags["accessibility-view-as-tritanopia"]
        ? "tritanopia"
        : null;

  useEffect(() => {
    if (status === "loading" || typeof document === "undefined") return;
    const el = document.body as HTMLBodyElement | null;
    if (!el) return;

    // Helper: remove only our cbf url() filter from an inline filter string, preserving others
    const stripCbf = (s: string) =>
      s
        // remove url(#cbf-xxx) with optional quotes around the fragment
        .replace(/url\((['"]?)#cbf-[^)]+\1\)/g, "")
        // collapse extra spaces
        .replace(/\s{2,}/g, " ")
        .trim();

    const current = el.style.filter || "";
    if (viewAs) {
      const next = `url(#cbf-${viewAs})`;
      // If there are other inline filters, append ours; otherwise just set ours
      const withoutCbf = stripCbf(current);
      const target = withoutCbf ? `${withoutCbf} ${next}`.trim() : next;
      if (current !== target) el.style.filter = target;
    } else if (current) {
      // No view-as: remove our filter if present, preserve others
      const cleaned = stripCbf(current);
      if (cleaned !== current) {
        el.style.filter = cleaned;
      }
    }

    // Cleanup on unmount: ensure we don't leave a stale cbf filter behind
    return () => {
      if (!el) return;
      const current2 = el.style.filter || "";
      const cleaned2 = stripCbf(current2);
      if (cleaned2 !== current2) el.style.filter = cleaned2;
    };
  }, [viewAs, status]);

  return null;
}
