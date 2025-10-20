"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PlainButton } from "@/components/Buttons";
import LocalTimeWithSettings from "@/components/LocalTimeWithSettings";
import {
  Axis,
  Badge,
  BrandColor,
  Bullets,
  Card,
  CardFooter,
  CardHeader,
  // CardSubtitle,
  CardTitle,
  Copy,
  Cursor,
  CursorLabel,
  DateText,
  // Desc,
  Eyebrow,
  Grid,
  Header,
  LocationText,
  Meta,
  MetaRow,
  Month,
  Months,
  PointButton,
  PointItem,
  Points,
  Section,
  SrOnly,
  Tick,
  Timeline,
  TimelinePadding
} from "./EventsTimeline.styles";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface EventItem {
  slug: string;
  title: string;
  description?: string;
  start: string | Date;
  location?: string;
  joinURL?: string;
  moreInfoURL?: string;
  color?: BrandColor;
}

interface EventsTeaserProps {
  events: EventItem[];
  periodMonths?: 3 | 4;
  rotateMs?: number;
  className?: string;
  timeZone?: string;
  locale?: string;
}

// ---------- Helpers de fecha ----------
const ms = (d: Date) => d.getTime();

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function addMonths(d: Date, n: number) {
  const newDate = new Date(d);
  newDate.setMonth(d.getMonth() + n);
  return newDate;
}

function addDays(d: Date, n: number) {
  const newDate = new Date(d);
  newDate.setDate(d.getDate() + n);
  return newDate;
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function percentBetween(start: Date, end: Date, target: Date) {
  const p = (ms(target) - ms(start)) / (ms(end) - ms(start));
  return clamp01(p) * 100;
}

function toDate(x: string | Date) {
  return x instanceof Date ? x : new Date(x);
}

function monthLabel(d: Date, locale = "es-ES") {
  const s = new Intl.DateTimeFormat(locale, { month: "short" }).format(d);
  return s.toUpperCase();
}

function formatReadableDate(d: Date, locale = "es-ES", timeZone = "Europe/Madrid") {
  const dow = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone }).format(d);
  const day = new Intl.DateTimeFormat(locale, { day: "2-digit", timeZone }).format(d);
  const mon = new Intl.DateTimeFormat(locale, { month: "short", timeZone }).format(d);
  const hm = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
    hour12: false
  }).format(d);
  return `${capitalize(dow)}, ${day} ${mon} · ${hm}`;
}
function capitalize(s: string) {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

// ---------- Icon Component ----------
const Icon = ({ path }: { path: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="18px"
    viewBox="0 -960 960 960"
    width="18px"
    fill="currentColor"
    aria-hidden
  >
    <path d={path} />
  </svg>
);

// ---------- Componente ----------
const FALLBACK_COMMUNITY_URL = "https://gdguam.es/l/gdg-community";

export default function EventsTeaser({
  events,
  periodMonths = 3,
  rotateMs = 2000,
  className,
  timeZone = "Europe/Madrid",
  locale = "es-ES"
}: EventsTeaserProps) {
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const t = useTranslations("index.events");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    setIsSmallScreen(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsSmallScreen(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const now = useMemo(() => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    return day;
  }, []);

  const { periodStart, periodEnd } = useMemo(() => {
    const periodStart = startOfMonth(addDays(now, -15));
    const periodEnd = endOfMonth(addMonths(periodStart, periodMonths - (isSmallScreen ? 1 : 0)));
    return { periodStart, periodEnd };
  }, [isSmallScreen, now, periodMonths]);

  // Eventos dentro del periodo (ordenados por fecha asc)
  const eventsInPeriod = useMemo(() => {
    return [...events]
      .map((e) => ({ ...e, startDate: toDate(e.start) }))
      .filter((e) => ms(e.startDate) >= ms(periodStart) && ms(e.startDate) <= ms(periodEnd))
      .sort((a, b) => ms(a.startDate) - ms(b.startDate));
  }, [events, periodStart, periodEnd]);

  const nearestEventSlug = useMemo(() => {
    if (eventsInPeriod.length === 0) return undefined;
    const future = eventsInPeriod.filter((e) => ms(e.startDate) >= ms(now));
    if (future.length) {
      let best = future[0];
      for (const e of future) {
        if (ms(e.startDate) - ms(now) < ms(best.startDate) - ms(now)) best = e;
      }
      return best.slug;
    }
    return "";
  }, [eventsInPeriod, now]);

  // Puntos con su % X sobre el eje
  const points = useMemo(() => {
    return eventsInPeriod.map((e) => ({
      ...e,
      x: percentBetween(periodStart, periodEnd, e.startDate),
      color: e.color ?? "blue"
    }));
  }, [eventsInPeriod, periodStart, periodEnd]);

  // Meses del eje
  const months = useMemo(() => {
    const monthItems: { date: Date; x: number; label: string }[] = [];
    const currentDate = startOfMonth(periodStart);

    while (currentDate < periodEnd) {
      monthItems.push({
        date: new Date(currentDate),
        x: percentBetween(periodStart, periodEnd, currentDate),
        label: monthLabel(currentDate, locale)
      });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    const finalMonth = startOfMonth(addDays(periodEnd, 1));
    monthItems.push({
      date: finalMonth,
      x: 100,
      label: monthLabel(finalMonth, locale)
    });

    return monthItems;
  }, [periodStart, periodEnd, locale]);

  // Cursor "You are here"
  const todayPercent = useMemo(
    () => percentBetween(periodStart, periodEnd, now),
    [periodStart, periodEnd, now]
  );

  // Estado de selección/rotación
  const [activeSlug, setActiveSlug] = useState<string | undefined>(nearestEventSlug);
  const [paused, setPaused] = useState(false);
  const rotRef = useRef<number | null>(null);

  // Helpers to pause/resume rotation instantly (avoid interval race on hover)
  const pauseRotation = () => {
    if (rotRef.current) {
      window.clearInterval(rotRef.current);
      rotRef.current = null;
    }
    setPaused(true);
  };
  const resumeRotation = () => setPaused(false);

  // Sincronizar activeSlug cuando cambia nearest
  useEffect(() => {
    if (!activeSlug && nearestEventSlug) setActiveSlug(nearestEventSlug);
  }, [nearestEventSlug, activeSlug]);

  // Rotación automática
  useEffect(() => {
    if (paused || points.length === 0) return;
    if (rotRef.current) {
      window.clearInterval(rotRef.current);
    }
    rotRef.current = window.setInterval(() => {
      setActiveSlug((prev) => {
        if (!prev) return points[0].slug;
        const idx = points.findIndex((p) => p.slug === prev);
        if (idx === -1) return points[0].slug;
        return points[(idx + 1) % points.length].slug;
      });
    }, rotateMs) as unknown as number;
    return () => {
      if (rotRef.current) window.clearInterval(rotRef.current);
    };
  }, [points, rotateMs, paused]);

  // Datos del evento activo
  const activeEvent = useMemo(
    () => points.find((p) => p.slug === activeSlug) ?? points[0],
    [points, activeSlug]
  );

  // Accesibilidad: seleccionar con teclado o hover
  const onPointEnter = (slug: string) => {
    pauseRotation();
    setActiveSlug(slug);
  };
  const onPointFocus = (slug: string) => {
    pauseRotation();
    setActiveSlug(slug);
  };
  const onPointBlur = () => resumeRotation();

  const openLink = (url: string, newTab: boolean = true) => {
    window.open(url, newTab ? "_blank" : "_self");
  };

  const eventHref = "/events";

  return (
    <Section
      id="home-events"
      className={className}
      aria-labelledby="home-events__title"
      data-theme="light-google"
    >
      <Header>
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h2 id="home-events__title">{t("nextEvents")}</h2>
      </Header>

      <Grid role="group" aria-labelledby="home-events__title">
        <Copy>
          <p>
            {t.rich("mainCopy", {
              link: (children) => (
                <Link className="intext" href="/events">
                  {children}
                </Link>
              )
            })}
          </p>
          <Bullets>
            <li>{t("copyBullets.0")}</li>
            <li>{t("copyBullets.1")}</li>
            <li>{t("copyBullets.2")}</li>
          </Bullets>
          <PlainButton hasBorder slim onClick={() => openLink(eventHref, false)}>
            {t("seeAll")}
          </PlainButton>
        </Copy>

        <Card aria-live="polite" aria-atomic="true">
          <Badge $visible={activeEvent?.slug === nearestEventSlug}>{t("nextEvent")}</Badge>
          <Badge $visible={activeEvent?.startDate < now} $past>
            {t("pastEvent")}
          </Badge>
          <CardHeader>
            <CardTitle>{activeEvent?.title}</CardTitle>
            {/* {activeEvent?.description && <CardSubtitle>{activeEvent.description}</CardSubtitle>} */}
          </CardHeader>

          <Meta>
            <MetaRow>
              <dd>
                <DateText>
                  <Icon path="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Z" />
                  <LocalTimeWithSettings
                    iso={(activeEvent?.startDate ?? now).toISOString()}
                    dateOnly={false}
                    compact
                    locale={locale}
                    timeZone={timeZone}
                  />
                </DateText>
              </dd>
            </MetaRow>
            {activeEvent?.location && (
              <MetaRow>
                <dd>
                  <LocationText>
                    <Icon path="M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 294q122-112 181-203.5T720-552q0-109-69.5-178.5T480-800q-101 0-170.5 69.5T240-552q0 71 59 162.5T480-186Zm0 106Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Zm0-480Z" />
                    <span>{activeEvent.location}</span>
                  </LocationText>
                </dd>
              </MetaRow>
            )}
          </Meta>

          <CardFooter>
            <PlainButton
              hasBorder
              slim
              onClick={() => openLink(activeEvent?.joinURL || FALLBACK_COMMUNITY_URL, true)}
              aria-label={t("join")}
              color="primary"
              disabled={activeEvent?.startDate < now}
            >
              {t("join")}
            </PlainButton>
            <PlainButton
              hasBorder
              slim
              onClick={() => openLink(activeEvent.moreInfoURL as string, false)}
              aria-label={t("moreInfo")}
              noBackground={true}
              color="secondary"
              disabled={!activeEvent?.moreInfoURL || activeEvent?.moreInfoURL === "#"}
            >
              {t("moreInfo")}
            </PlainButton>
          </CardFooter>
        </Card>
      </Grid>

      {/* Timeline */}
      <TimelinePadding>
        <Timeline
          role="group"
          aria-labelledby="timeline__label"
          onMouseEnter={pauseRotation}
          onMouseLeave={resumeRotation}
        >
          <SrOnly as="h3" id="timeline__label">
            {t("timeline")}
          </SrOnly>

          <Axis
            aria-hidden="true"
            data-range-start={periodStart.toISOString()}
            data-range-end={periodEnd.toISOString()}
          >
            <Months>
              {months.map((m) => (
                <Month
                  key={m.date.toISOString()}
                  data-edge={m.x === 0 || m.x === 100}
                  style={{ left: `${m.x}%` }}
                >
                  <Tick />
                  <span>{m.label}</span>
                </Month>
              ))}
            </Months>

            {/* Place points inside the Axis so they align to the top border */}
            <Points role="listbox" aria-label="Eventos cercanos">
              {points.map((p) => {
                const selected = p.slug === activeSlug;
                const isNearest = p.slug === nearestEventSlug;
                return (
                  <PointItem key={p.slug}>
                    <PointButton
                      role="option"
                      aria-selected={selected}
                      aria-current={isNearest ? "true" : undefined}
                      title={formatReadableDate(p.startDate, locale, timeZone)}
                      onMouseEnter={() => onPointEnter(p.slug)}
                      onFocus={() => onPointFocus(p.slug)}
                      onBlur={onPointBlur}
                      style={{ left: `${p.x}%` }}
                      $color={p.color}
                      data-id={p.slug}
                    >
                      <SrOnly>
                        {new Intl.DateTimeFormat(locale, {
                          day: "2-digit",
                          month: "short",
                          timeZone
                        }).format(p.startDate)}
                        {`: ${p.title}${p.location ? " · " + p.location : ""}`}
                      </SrOnly>
                    </PointButton>
                  </PointItem>
                );
              })}
            </Points>
          </Axis>

          <Cursor aria-label={t("youAreHere")} style={{ left: `${todayPercent}%` }}>
            <CursorLabel>{t("youAreHere")}</CursorLabel>
          </Cursor>

          <SrOnly id="timeline__help">{t("timelineSR")}</SrOnly>
        </Timeline>
      </TimelinePadding>
    </Section>
  );
}
