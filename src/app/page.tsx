"use client";

import { useEffect, useMemo } from "react";
import EventsTeaser from "@/components/pages/index/EventsTimeline";
// import CommunitySection from "@/components/pages/index/CommunitySection";
import HomeHero from "@/components/pages/index/HomeHero";
import { useEventsCache } from "@/components/providers/EventsCacheProvider";
import { useLocale } from "next-intl";

export default function Home() {
  const { events, ensureLoaded } = useEventsCache();
  const locale = useLocale();

  useEffect(() => {
    // Ensure we have events loaded from the API
    ensureLoaded();
  }, [ensureLoaded]);

  const teaserEvents = useMemo(
    () =>
      (events ?? []).map((e, idx) => ({
        slug: e.slug,
        title: e.title,
        description: e.description,
        start: e.date,
        location: e.location,
        joinURL: e.url,
        moreInfoURL: e.blogUrl || `/events/${e.slug}`,
        color: (["blue", "green", "red", "yellow"] as const)[idx % 4]
      })),
    [events]
  );

  return (
    <div>
      <HomeHero
        joinHref="https://gdg.community.dev/gdg-on-campus-autonomous-university-of-madrid-madrid-spain"
        aboutHref="/about"
        nextSectionId="home-events"
      />
      <EventsTeaser events={teaserEvents} locale={locale} />
      {/* <CommunitySection /> */}
    </div>
  );
}
