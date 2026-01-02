"use client";
import { api } from "@/lib/eden";
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "styled-components";
import SettingsSidebar, { SettingsCategory } from "@/components/pages/settings/SettingsSidebar";
import { useTranslations } from "next-intl";
import { useSettings } from "@/lib/settings/SettingsContext";
import { useSession } from "next-auth/react";
import type { ProfileSettings, UserSettingsDTO } from "@/lib/validation/settingsSchemas";
import dynamic from "next/dynamic";
import { Box } from "@mui/material";

// Lazy-load sections for better performance (client-only UI)
const GeneralSection = dynamic(
  () => import("@/components/pages/settings/sections/GeneralSection"),
  { ssr: false }
);
const ProfileSection = dynamic(
  () => import("@/components/pages/settings/sections/ProfileSection"),
  { ssr: false }
);
const PrivacySection = dynamic(
  () => import("@/components/pages/settings/sections/PrivacySection"),
  { ssr: false }
);
const EventsSection = dynamic(() => import("@/components/pages/settings/sections/EventsSection"), {
  ssr: false
});
const GamesSection = dynamic(() => import("@/components/pages/settings/sections/GamesSection"), {
  ssr: false
});
const NotificationsSection = dynamic(
  () => import("@/components/pages/settings/sections/NotificationsSection"),
  { ssr: false }
);
const AccessibilitySection = dynamic(
  () => import("@/components/pages/settings/sections/AccessibilitySection"),
  { ssr: false }
);
const ExperimentalSection = dynamic(
  () => import("@/components/pages/settings/sections/ExperimentalSection"),
  { ssr: false }
);

const Outer = styled.div`
  padding: 40px 32px 80px;
  max-width: 1280px;
  margin: 0 auto;
  @media (max-width: 1000px) {
    padding: 16px 16px 64px;
  }
`;
const LayoutShell = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 32px;
  width: 100%;
  @media (max-width: 1000px) {
    max-width: 600px;
    flex-direction: column;
    gap: 20px;
    margin: 0 auto;
  }
`;
const ContentPanel = styled.main`
  flex: 1;
  min-width: 0;
  overflow: visible;
  width: 100%;

  & input {
    background: var(--color-white) !important;
  }
`;
const Heading = styled.h1`
  margin: 0 0 12px;
`;
const Sub = styled.p`
  margin: 0 0 24px;
  color: var(--settings-experiment-sub);
  line-height: 1.45;
`;
const Chip = styled.span`
  display: inline-block;
  font-size: 12px;
  padding: 2px 8px 3px;
  border-radius: 999px;
  background: var(--settings-chip-bg);
  color: var(--settings-chip-text);
  font-weight: 500;
  margin-left: 8px;
`;

// ---------------- Root ----------------
interface SettingsClientProps {
  categories: SettingsCategory[];
}
const SettingsClient: React.FC<SettingsClientProps> = ({ categories }) => {
  const t = useTranslations("settings");
  const { settings, updateCategory, isLoading, mutate } = useSettings();
  const { update: updateSession } = useSession();
  const STORAGE_KEY = "settings:lastCategory";
  const visibleCategories = useMemo(() => categories.filter((c) => !c.hidden), [categories]);
  const restoredRef = useRef(false);
  const [active, setActive] = useState<string>("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams?.get("tab") || undefined;

  // restore last active (URL has priority, then localStorage, then first visible)
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    try {
      if (tabFromUrl && visibleCategories.some((c) => c.id === tabFromUrl)) {
        setActive(tabFromUrl);
        return;
      }
      const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (stored && visibleCategories.some((c) => c.id === stored)) {
        setActive(stored);
        return;
      }
    } catch {}
    if (visibleCategories[0]) setActive(visibleCategories[0].id);
  }, [visibleCategories, tabFromUrl]);

  // persist to localStorage
  useEffect(() => {
    try {
      if (active) localStorage.setItem(STORAGE_KEY, active);
    } catch {}
  }, [active]);

  // Clamp active if the visible categories change
  useEffect(() => {
    if (!visibleCategories.length) return;
    if (active && !visibleCategories.some((c) => c.id === active)) {
      setActive(visibleCategories[0].id);
    }
  }, [visibleCategories, active]);

  // Keep URL in sync with active tab while preserving other params
  useEffect(() => {
    if (!active) return;
    try {
      const sp = new URLSearchParams(searchParams?.toString() || "");
      if (sp.get("tab") === active) return;
      sp.set("tab", active);
      router.replace(`?${sp.toString()}`);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const activeCategory = active ? visibleCategories.find((c) => c.id === active) : undefined;

  const refetchPreviews = useCallback(async () => {
    try {
      const { data, error } = await api.settings.get({ query: { previews: "1" } });
      if (error) return;
      await mutate(async () => data as UserSettingsDTO, { revalidate: false });
    } catch {}
  }, [mutate]);

  const handleProfileChange = useCallback(
    async (v: Partial<ProfileSettings>) => {
      await updateCategory("profile", v);
      refetchPreviews();
    },
    [updateCategory, refetchPreviews]
  );

  const renderActive = () => {
    switch (activeCategory?.id) {
      case "general":
        return (
          <GeneralSection
            value={settings?.general}
            onChange={(v) => updateCategory("general", v)}
            t={t}
          />
        );
      case "profile":
        return <ProfileSection value={settings?.profile} onChange={handleProfileChange} t={t} />;
      case "privacy":
        return (
          <PrivacySection
            value={settings?.privacy}
            onChange={async (v) => {
              await updateCategory("privacy", v);
              try {
                await updateSession();
              } catch {}
            }}
            t={t}
          />
        );
      case "events":
        return (
          <EventsSection
            value={settings?.events}
            onChange={(v) => updateCategory("events", v)}
            t={t}
          />
        );
      case "games":
        return (
          <GamesSection
            value={settings?.games}
            onChange={(v) => updateCategory("games", v)}
            t={t}
          />
        );
      case "notifications":
        return (
          <NotificationsSection
            value={settings?.notifications}
            onChange={(v) => updateCategory("notifications", v)}
            t={t}
          />
        );
      case "accessibility":
        return (
          <AccessibilitySection
            value={settings?.accessibility}
            onChange={(v) => updateCategory("accessibility", v)}
            t={t}
          />
        );
      case "experimental":
        return (
          <ExperimentalSection
            value={settings?.experimental}
            onChange={async (v) => {
              await updateCategory("experimental", v);
              try {
                await updateSession();
              } catch {}
            }}
            t={t}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Outer>
      <LayoutShell>
        <SettingsSidebar categories={visibleCategories} active={active} onChange={setActive} />
        <ContentPanel>
          <Heading>{t("page.heading")}</Heading>
          <Sub>{t("page.subtitle")}</Sub>
          {(isLoading || !activeCategory) && <></>}
          {!isLoading && activeCategory && (
            <Box>
              <h2>
                {activeCategory.label}
                {activeCategory.id === "experimental" && activeCategory.restrictedLabel && (
                  <Chip>{activeCategory.restrictedLabel}</Chip>
                )}
              </h2>
              <Box mt={2}>{renderActive()}</Box>
            </Box>
          )}
        </ContentPanel>
      </LayoutShell>
    </Outer>
  );
};

export default SettingsClient;
