"use client";

import { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import { useLocale, useTranslations } from "next-intl";
import { EventCard } from "@/components/cards/EventCard";
import { useEventsCache } from "@/components/providers/EventsCacheProvider";
import { isUpcoming } from "@/lib/utils/dates";
import { PublicEvent } from "@/lib/types/events";
import { CopyButton, PlainButton } from "@/components/Buttons";
import Modal from "@/components/Modal";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import { useSearchParams, useRouter } from "next/navigation";

type DateStatus = "upcoming" | "past";

const PageWrapper = styled.div`
  padding: 40px 32px 80px;
  max-width: 1280px;
  margin: 0 auto;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
`;

const Filters = styled.div`
  display: flex;
  gap: 10px;
`;

const EventsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(275px, 1fr));
  gap: 32px;
  margin-top: 32px;
`;

export function PublicEventsGrid() {
  const t = useTranslations("events");
  const locale = useLocale();
  const {
    events: cachedEvents,
    ensureLoaded,
    loading: cacheLoading,
    error: cacheError
  } = useEventsCache();

  const searchParams = useSearchParams();
  const router = useRouter();
  const initialStatus = (searchParams?.get("status") as DateStatus) || "upcoming";
  const [dateStatus, setDateStatus] = useState<DateStatus>(initialStatus);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareModal, setShareModal] = useState<{ isOpen: boolean; event: PublicEvent | null }>({
    isOpen: false,
    event: null
  });

  // keep URL in sync when status changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("status", dateStatus);
    router.replace(`?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateStatus]);

  // Ensure cache is loaded once on first mount
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await ensureLoaded();
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        if (active) setError(message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [ensureLoaded]);

  const filteredEvents = useMemo(() => {
    const source = (cachedEvents ?? []) as PublicEvent[];
    return source.filter((e) =>
      dateStatus === "upcoming" ? isUpcoming(e.date) : !isUpcoming(e.date)
    );
  }, [cachedEvents, dateStatus]);

  const sortedEvents = useMemo(() => {
    if (dateStatus === "upcoming") {
      return [...filteredEvents].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
    }
    return [...filteredEvents].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  }, [filteredEvents, dateStatus]);

  const upcomingCount = useMemo(
    () => cachedEvents.filter((e) => isUpcoming(e.date)).length,
    [cachedEvents]
  );
  const pastCount = useMemo(
    () => cachedEvents.filter((e) => !isUpcoming(e.date)).length,
    [cachedEvents]
  );

  const handleShareClick = (event: PublicEvent) => setShareModal({ isOpen: true, event });
  const handleCloseModal = () => setShareModal({ isOpen: false, event: null });

  return (
    <PageWrapper>
      <Header>
        <Title>{t("events")}</Title>
        <Filters>
          <PlainButton
            noBackground
            style={{ fontSize: "1rem" }}
            color={dateStatus === "upcoming" ? "primary" : "default"}
            onClick={() => setDateStatus("upcoming")}
          >
            {t("filters.upcoming", { count: upcomingCount })}
          </PlainButton>
          <PlainButton
            noBackground
            style={{ fontSize: "1rem" }}
            color={dateStatus === "past" ? "primary" : "default"}
            onClick={() => setDateStatus("past")}
          >
            {t("filters.past", { count: pastCount })}
          </PlainButton>
        </Filters>
      </Header>

      {(loading || cacheLoading) && (
        <EventsGrid>
          {Array.from({ length: dateStatus === "upcoming" ? 3 : 6 }).map((_, i) => (
            <EventCard key={`skeleton-${i}`} skeleton />
          ))}
        </EventsGrid>
      )}

      {(error || cacheError) && (
        <p style={{ color: "var(--google-error-red)" }}>
          {t("error")}: {error || cacheError}
        </p>
      )}

      {!loading && !error && !cacheLoading && !cacheError && sortedEvents.length === 0 && (
        <p>{t("noEvents")}</p>
      )}

      {!loading && !error && !cacheLoading && !cacheError && (
        <EventsGrid>
          {sortedEvents.map((event) => (
            <EventCard key={event.slug} event={event} onShare={handleShareClick} />
          ))}
        </EventsGrid>
      )}

      <Modal isOpen={shareModal.isOpen} onClose={handleCloseModal} title={t("share.title")}>
        <p style={{ marginTop: 0, marginBottom: 32 }}>
          {shareModal.event &&
            (() => {
              let message = t("share.description", {
                title: shareModal.event.title,
                date: new Date(shareModal.event.date).toLocaleString(locale, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false
                })
              });
              if (message.endsWith("..")) message = message.slice(0, -1);
              return message;
            })()}
        </p>
        <TextField
          fullWidth
          variant="outlined"
          label={t("share.linkLabel")}
          value={
            shareModal.event
              ? shareModal.event.blogUrl ||
                `${window.location.origin}/events/${shareModal.event.slug}`
              : ""
          }
          slotProps={{
            input: {
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <CopyButton
                    content={
                      shareModal.event
                        ? shareModal.event.blogUrl ||
                          `${window.location.origin}/events/${shareModal.event.slug}`
                        : ""
                    }
                    iconSize={22}
                    style={{ marginRight: -8 }}
                  />
                </InputAdornment>
              )
            }
          }}
        />
      </Modal>
    </PageWrapper>
  );
}
