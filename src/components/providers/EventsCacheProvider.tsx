"use client";
import { api } from "@/lib/eden";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type PublicEvent = {
  title: string;
  description?: string;
  slug: string;
  date: string;
  location: string;
  image?: string;
  blogUrl?: string;
  url?: string;
};

type EventsCacheContextValue = {
  events: PublicEvent[];
  loaded: boolean;
  loading: boolean;
  error: string | null;
  ensureLoaded: () => Promise<void>;
  refresh: () => Promise<void>;
};

const EventsCacheContext = createContext<EventsCacheContextValue | undefined>(undefined);

async function fetchEvents(dateStatus: "upcoming" | "past", pageSize = 100) {
  const { data, error } = await api.events.get({
    query: {
      dateStatus,
      pageSize: pageSize,
      sort: "newest"
    }
  });
  if (error) {
    throw new Error(`Failed to fetch ${dateStatus} events`);
  }
  return data.items as PublicEvent[];
}

export function EventsCacheProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [upcoming, past] = await Promise.all([fetchEvents("upcoming"), fetchEvents("past")]);
      const map = new Map<string, PublicEvent>();
      for (const e of [...upcoming, ...past]) {
        map.set(e.slug, e);
      }
      setEvents(Array.from(map.values()));
      setLoaded(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
    } finally {
      setLoading(false);
      inFlight.current = null;
    }
  }, []);

  const ensureLoaded = useCallback(async () => {
    if (loaded || events.length > 0) return;
    if (!inFlight.current) {
      inFlight.current = load();
    }
    return inFlight.current;
  }, [loaded, events.length, load]);

  const refresh = useCallback(async () => {
    if (!inFlight.current) {
      inFlight.current = load();
    }
    return inFlight.current;
  }, [load]);

  const value = useMemo<EventsCacheContextValue>(
    () => ({ events, loaded, loading, error, ensureLoaded, refresh }),
    [events, loaded, loading, error, ensureLoaded, refresh]
  );

  return <EventsCacheContext.Provider value={value}>{children}</EventsCacheContext.Provider>;
}

export function useEventsCache() {
  const ctx = useContext(EventsCacheContext);
  if (!ctx) throw new Error("useEventsCache must be used within EventsCacheProvider");
  return ctx;
}
