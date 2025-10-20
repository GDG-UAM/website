"use client";

import { useEffect, useState } from "react";
import RenderMarkdown from "@/components/markdown/RenderMarkdown";
import { routing } from "@/i18n/routing";

export default function ArticlePreview({ type, id }: { type: "blog" | "newsletter"; id: string }) {
  const [markdown, setMarkdown] = useState<string>("");
  const locale = routing.defaultLocale;

  useEffect(() => {
    let active = true;
    const pickLocalized = (v: unknown): string => {
      if (!v) return "";
      if (typeof v === "string") return v;
      try {
        const obj = v as Record<string, string>;
        return obj?.[locale] ?? obj?.[routing.defaultLocale as string] ?? "";
      } catch {
        return "";
      }
    };
    (async () => {
      try {
        const res = await fetch(`/api/admin/articles/${id}`);
        const data = await res.json();
        if (active) setMarkdown(pickLocalized(data?.content) || "");
      } catch {
        if (active) setMarkdown("<p>Failed to load preview.</p>");
      }
    })();
    return () => {
      active = false;
    };
  }, [type, id, locale]);

  return <RenderMarkdown markdown={markdown} />;
}
