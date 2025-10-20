"use client";

import React from "react";
import styled, { css, keyframes } from "styled-components";
import { useAiTranslation } from "@/components/ai/translation/AiTranslationProvider";
import { aiTranslateManager } from "@/lib/ai/translation/ai-translate";
import { FiAlertTriangle } from "react-icons/fi";
import { useTranslations } from "next-intl";

const Banner = styled.div<{ $center?: boolean }>`
  position: sticky;
  top: 0;
  z-index: 1100;
  background: var(--navbar-translation-banner-bg);
  color: var(--navbar-translation-banner-text);
  border-bottom: 1px solid #f3e2a4;
  padding: 8px 16px;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: ${({ $center }) => ($center ? "center" : "flex-start")};
`;

const Bar = styled.div`
  position: relative;
  flex: 1;
  height: 6px;
  background: var(--navbar-translation-banner-bar-bg);
  border-radius: 4px;
  overflow: hidden;
`;

const shimmer = keyframes`
    0% { left: -45%; }
    100% { left: 100%; }
`;

const BarFill = styled.div<{ $value?: number; $indeterminate?: boolean }>`
  position: absolute;
  top: 0;
  height: 100%;
  background: var(--navbar-translation-banner-bar-fill-bg);
  border-radius: 4px;
  ${({ $indeterminate, $value }) =>
    $indeterminate
      ? css`
          width: 45%;
          left: -45%;
          animation: ${shimmer} 1.2s ease-in-out infinite;
        `
      : css`
          left: 0;
          width: ${typeof $value === "number" ? `${Math.max(0, Math.min(100, $value))}%` : "100%"};
          transition: width 0.2s ease;
        `}
`;

const BannerContent = styled.span`
  display: flex;
  align-items: center;
`;

export function AiTranslationBanner({ active }: { active: boolean }) {
  const { progress, targetLang } = useAiTranslation();
  const [translatedNote, setTranslatedNote] = React.useState<string>("");
  const base_t = useTranslations("navbar.ai.banner");
  React.useEffect(() => {
    let mounted = true;
    const base = base_t("enabled") || "AI translation enabled. Translations may be inaccurate.";

    const handleDone = async () => {
      if (!mounted) return;
      if (active && aiTranslateManager.isActive()) {
        try {
          const t = await aiTranslateManager.translateString(base);
          if (mounted) setTranslatedNote(t);
        } catch {
          // ignore
        }
      } else {
        setTranslatedNote("");
      }
    };

    document.addEventListener("ai-translation-done", handleDone);

    return () => {
      mounted = false;
      document.removeEventListener("ai-translation-done", handleDone);
    };
  }, [active, base_t, targetLang]);

  if (!active) return null;

  const isDownloading = progress.phase === "downloading";
  const isTranslating = progress.phase === "translating";

  let msg = base_t("enabled") || "AI translation enabled. Translations may be inaccurate.";
  if (isDownloading) {
    msg = base_t("downloading");
  } else if (isTranslating) {
    msg = base_t("translating", { progress: `${progress.value}%` });
  }

  const isWorking = isDownloading || isTranslating;

  return (
    <Banner role="status" aria-live="polite" $center={!isWorking} data-ai-lang={targetLang}>
      <BannerContent data-ai-lang={targetLang}>
        {!isWorking && <FiAlertTriangle aria-hidden style={{ marginRight: "4px" }} />}
        {msg}
        {!isWorking && translatedNote && ` — ${translatedNote}`}
        {!isWorking && <FiAlertTriangle aria-hidden style={{ marginRight: "4px" }} />}
      </BannerContent>
      {isWorking && (
        <Bar aria-hidden>
          <BarFill
            $indeterminate={isDownloading}
            $value={isTranslating ? progress.value : undefined}
          />
        </Bar>
      )}
    </Banner>
  );
}
