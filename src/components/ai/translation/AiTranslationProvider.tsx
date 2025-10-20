"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { aiTranslateManager } from "@/lib/ai/translation/ai-translate";

type Ctx = {
  active: boolean;
  supported: boolean;
  targetLang?: string;
  progress: { phase?: "downloading" | "translating" | "error"; value?: number; message?: string };
  isBusy: boolean;
  enable: (opts: {
    targetLang: string;
    sourceLang?: string;
    initialSilent?: boolean;
    save?: boolean;
  }) => Promise<void>;
  disable: () => void;
};

const Ctx = createContext<Ctx | null>(null);

export function AiTranslationProvider({
  children,
  sourceLang
}: {
  children: React.ReactNode;
  sourceLang?: string;
}) {
  const [active, setActive] = useState(aiTranslateManager.isActive());
  const supported = aiTranslateManager.isSupported();
  const [targetLang, setTargetLang] = useState<string | undefined>(undefined);
  const [progress, _setProgress] = useState<Ctx["progress"]>({});
  const isBusy = progress.phase === "downloading";
  const setProgress = useCallback(
    (update: Partial<Ctx["progress"]>) => {
      if (update.phase === null && progress.phase !== "translating") {
        delete update.phase; // Only replace when translating (this indicates a finished translation)
      }
      _setProgress((prev) => ({ ...prev, ...update }));
    },
    [progress.phase]
  );
  const pathname = usePathname();

  const enable = useCallback(
    async (opts: { targetLang: string; sourceLang?: string; initialSilent?: boolean }) => {
      setTargetLang(opts.targetLang);
      // Make banner appear immediately with progress
      setActive(true);
      try {
        await aiTranslateManager.enable({
          ...opts,
          sourceLang: opts.sourceLang ?? sourceLang,
          onProgress: setProgress,
          initialSilent: opts.initialSilent
        });
      } catch (err: unknown) {
        console.error("AI enable failed:", err);
        //   const msg = err instanceof Error ? err.message : "Failed to start AI translation";
        //   setProgress({ phase: "error", message: msg });
        //   setActive(false);
        //   setTargetLang(undefined);
      }
    },
    [setProgress, sourceLang]
  );

  const disable = useCallback(() => {
    aiTranslateManager.disable();
    setTargetLang(undefined);
    setActive(false);
  }, []);

  useEffect(() => {
    if (!active) return;
    // Re-translate new content on route change (idempotent, uses cache)
    (async () => {
      try {
        // If translator is already created, just refresh translation; avoids NotAllowedError from create()
        await aiTranslateManager.refresh(setProgress);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err ?? "");
        // Swallow NotAllowedError when model is downloading/downloadable (requires user gesture)
        if (!/NotAllowedError/i.test(msg)) {
          console.error("AI refresh failed:", err);
        }
        // const msg = err instanceof Error ? err.message : "AI translation failed on navigation";
        // setProgress({ phase: "error", message: msg });
        // setActive(false);
        // setTargetLang(undefined);
      }
    })();
  }, [active, pathname, setProgress, sourceLang, targetLang]); // or only pathname

  const value = useMemo<Ctx>(
    () => ({ active, supported, targetLang, progress, isBusy, enable, disable }),
    [active, supported, targetLang, progress, isBusy, enable, disable]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAiTranslation() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAiTranslation must be used within AiTranslationProvider");
  return ctx;
}
