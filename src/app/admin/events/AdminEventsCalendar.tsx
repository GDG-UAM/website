"use client";

// Calendario de Eventos (Admin)
// - Apariencia inspirada en Google Calendar
// - Vistas mensual y semanal
// - Responsive para móvil/desktop
// - SOLO styled-components (nada de MUI)
// - Comentarios detallados en español

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle
} from "react";
import styled from "styled-components";
import {
  BackButton,
  NextButton,
  ReloadButton,
  ViewButton,
  EditButton,
  OpenLinkButton,
  AddButton,
  AcceptButton,
  HideButton
} from "@/components/Buttons";
import Modal from "@/components/Modal";
import LocalTime from "@/components/LocalTime";
import { useTranslations } from "next-intl";
import { newErrorToast, newSuccessToast } from "@/components/Toast";
import { withCsrfHeaders } from "@/lib/security/csrfClient";

// Tipos de datos mínimos para presentar eventos en el calendario
type EventRow = {
  _id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  date: string; // ISO
  location?: string;
  image?: string;
  url?: string;
};

// Tipos auxiliares
type StatusFilter = "all" | "published" | "draft";
type DateFilter = "all" | "upcoming" | "past";
type ViewMode = "month" | "week";

// ======================
// Estilos base y tokens
// ======================
const Wrapper = styled.div`
  /* Paleta y tokens inspirados en Google */
  --g-blue: #1a73e8;
  --g-green: #34a853;
  --g-yellow: #fbbc05;
  --g-red: #ea4335;
  --bg-muted: #f1f3f4;
  --bg-surface: #ffffff;
  --ring: rgba(26, 115, 232, 0.32);
  --shadow: 0 1px 2px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04);
  --border: #e5e7eb;
  --text-muted: #5f6368;
  --text-strong: #202124;

  display: grid;
  gap: 12px;
`;

const Toolbar = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
`;

const CalendarHeader = styled.div`
  /* Grid a 3 columnas para mantener navegación a la izquierda y título centrado */
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
`;

const MonthTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  text-transform: capitalize;
  justify-self: center; /* centra el título en la columna central */
  text-align: center;
`;

// Controles y filtros
const Segmented = styled.div`
  display: inline-flex;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  padding: 2px;
  gap: 2px;
`;

const SegmentedBtn = styled.button<{ $active?: boolean }>`
  appearance: none;
  border: 0;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: ${({ $active }) => ($active ? "#0b57d0" : "#374151")};
  background: ${({ $active }) => ($active ? "#e8f0fe" : "transparent")};
  cursor: pointer;
`;

const Select = styled.select`
  appearance: none;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--text-strong);
  box-shadow: var(--shadow);
`;

const Label = styled.label`
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 600;
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const TodayBtn = styled.button`
  margin-left: 8px;
  padding: 6px 12px;
  border-radius: 10px;
  border: 1px solid #d1d5db; /* gris suave para no destacar en exceso */
  background: #ffffff; /* fondo normal claro */
  color: #111827; /* texto oscuro legible */
  cursor: pointer;
  font-weight: 700;
  font-size: 12px;
  transition:
    background 120ms ease,
    box-shadow 120ms ease,
    border-color 120ms ease;
  &:hover {
    background: #f3f4f6;
  }
  &:focus-visible {
    box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.35);
    outline: none;
  }
`;

const Badge = styled.span<{ $tone?: "success" | "warning" }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 11px;
  border: 1px solid
    ${({ $tone }) =>
      $tone === "success" ? "#b7e1cd" : $tone === "warning" ? "#fbdc97" : "#e5e7eb"};
  background: ${({ $tone }) =>
    $tone === "success" ? "#e6f4ea" : $tone === "warning" ? "#fef7e0" : "#f3f4f6"};
  color: #111827;
`;

// ======================
// Vista mensual
// ======================
const MonthGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  @media (max-width: 600px) {
    gap: 6px;
  }
`;

const Weekday = styled.div`
  padding: 8px 10px;
  background: var(--bg-muted);
  border-radius: 10px;
  font-size: 12px;
  color: #5f6368;
  font-weight: 600;
  text-align: center;
  @media (max-width: 600px) {
    font-size: 11px;
    padding: 6px 8px;
  }
`;

const DayCell = styled.div<{ $isCurrentMonth: boolean; $isToday: boolean }>`
  min-height: 88px;
  /* espacio superior extra para no tapar el número del día */
  padding: 22px 8px 8px 8px;
  border-radius: 12px;
  background: ${({ $isCurrentMonth }) => ($isCurrentMonth ? "var(--bg-surface)" : "#fafafa")};
  position: relative;
  box-shadow: var(--shadow);
  transition:
    box-shadow 120ms ease,
    transform 120ms ease;
  ${({ $isToday }) => ($isToday ? "outline: 2px solid var(--ring); outline-offset: 0;" : "")}
  &:hover {
    box-shadow:
      0 2px 6px rgba(0, 0, 0, 0.08),
      0 6px 20px rgba(0, 0, 0, 0.06);
  }
  @media (max-width: 600px) {
    min-height: 68px;
    border-radius: 10px;
    padding: 20px 6px 6px 6px;
  }
`;

const DayNumber = styled.div<{ $isToday: boolean }>`
  position: absolute;
  top: 6px;
  right: 6px;
  font-size: 12px;
  font-weight: 700;
  color: ${({ $isToday }) => ($isToday ? "var(--g-blue)" : "#6b7280")};
  @media (max-width: 600px) {
    font-size: 11px;
  }
`;

const EventPill = styled.button<{ $variant: "published" | "draft" }>`
  display: block;
  width: 100%;
  text-align: left;
  border: 0;
  background: ${({ $variant }) => ($variant === "published" ? "#e6f4ea" : "#fef7e0")};
  color: #202124;
  border-radius: 10px;
  padding: 6px 10px 6px 12px;
  margin-top: 6px;
  cursor: pointer;
  font-size: 11.5px;
  /* texto compacto: hasta 2 líneas visibles */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
  position: relative;
  &:hover {
    filter: brightness(0.985);
  }
  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    border-top-left-radius: 10px;
    border-bottom-left-radius: 10px;
    background: ${({ $variant }) =>
      $variant === "published" ? "var(--g-green)" : "var(--g-yellow)"};
  }
  @media (max-width: 600px) {
    font-size: 11px;
    padding: 4px 8px 4px 10px;
    margin-top: 4px;
  }
`;

const MoreLink = styled.div`
  margin-top: 4px;
  font-size: 12px;
  color: var(--g-blue);
  cursor: pointer;
  font-weight: 600;
  @media (max-width: 600px) {
    font-size: 11px;
  }
`;

// ======================
// Vista semanal (tipo Google Calendar)
// ======================
const WeekGrid = styled.div`
  /* 1 columna para horas + 7 columnas para días */
  display: grid;
  grid-template-columns: 56px repeat(7, 1fr);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  background: var(--bg-surface);
  @media (max-width: 900px) {
    display: block;
  }
`;

const WeekHeaderRow = styled.div`
  display: contents; /* utilizamos la rejilla del contenedor */
  @media (max-width: 900px) {
    display: none;
  }
`;

const WeekHeaderCell = styled.div<{ $muted?: boolean }>`
  padding: 10px 8px;
  background: var(--bg-muted);
  border-bottom: 1px solid var(--border);
  font-size: 12px;
  font-weight: 700;
  color: ${({ $muted }) => ($muted ? "#9ca3af" : "#374151")};
  text-align: center;
`;

const WeekBody = styled.div`
  display: contents;
  @media (max-width: 900px) {
    display: block;
  }
`;

const TimeCol = styled.div`
  position: relative;
  background: #fff;
  @media (max-width: 900px) {
    display: none;
  }
`;

const HourCell = styled.div`
  height: 36px; /* altura por hora (más compacto) */
  font-size: 9px;
  color: #9ca3af;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 1px 4px;
`;

const DayCol = styled.div`
  position: relative;
  background: #fff;
  border-left: 1px solid var(--border);
  @media (max-width: 900px) {
    border-left: 0;
    border-top: 1px solid var(--border);
    padding: 8px 10px;
  }
`;

const HourRow = styled.div`
  position: relative;
  height: 36px; /* sincronizado con HourCell */
  border-bottom: 1px solid #f3f4f6;
`;

const EventBlock = styled.button<{
  $variant: "published" | "draft";
  $top: number;
  $height: number;
}>`
  position: absolute;
  left: 6px;
  right: 6px;
  top: ${({ $top }) => `${$top}px`};
  height: ${({ $height }) => `${$height}px`}; /* ocupa el slot de la hora */
  border: 0;
  border-radius: 8px;
  padding: 2px 8px 2px 10px;
  font-size: 11.5px;
  text-align: left;
  cursor: pointer;
  background: ${({ $variant }) => ($variant === "published" ? "#e6f4ea" : "#fef7e0")};
  color: #202124;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    border-top-left-radius: 8px;
    border-bottom-left-radius: 8px;
    background: ${({ $variant }) =>
      $variant === "published" ? "var(--g-green)" : "var(--g-yellow)"};
  }
`;

const MobileDayHeader = styled.div`
  display: none;
  @media (max-width: 900px) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 700;
    padding-bottom: 6px;
    color: #374151;
  }
`;

// ======================
// Utilidades de fechas
// ======================
function startOfMonth(date: Date) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}
function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}
function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}
function getMonthMatrix(base: Date) {
  // Semanas empiezan en lunes
  const first = startOfMonth(base);
  const weekday = (first.getDay() + 6) % 7; // 0=Mon ... 6=Sun
  const start = new Date(first);
  start.setDate(first.getDate() - weekday);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}
function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // lunes
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}
function formatWeekTitle(start: Date) {
  const end = addDays(start, 6);
  const sameMonth = start.getMonth() === end.getMonth();
  const locale = undefined; // usa locale del navegador
  const dayFmt: Intl.DateTimeFormatOptions = { day: "2-digit" };
  const monthYearFmt: Intl.DateTimeFormatOptions = { month: "long", year: "numeric" };
  const startDay = start.toLocaleDateString(locale, dayFmt);
  const endDay = end.toLocaleDateString(locale, dayFmt);
  const monthYear = end.toLocaleDateString(locale, monthYearFmt);
  const monthYearStart = start.toLocaleDateString(locale, monthYearFmt);
  return sameMonth
    ? `${startDay}–${endDay} ${monthYear}`
    : `${startDay} ${monthYearStart} – ${endDay} ${monthYear}`;
}

// ======================
// Componente principal
// ======================
type AdminEventsCalendarRef = {
  reload: () => void;
  ensureLoaded: () => void;
};

type AdminEventsCalendarProps = {
  onCreate: (dateIso?: string) => void;
  onEdit: (id: string) => void;
  onView?: (slug: string) => void;
};

const AdminEventsCalendar = forwardRef<AdminEventsCalendarRef, AdminEventsCalendarProps>(
  function AdminEventsCalendar({ onCreate, onEdit, onView }: AdminEventsCalendarProps, ref) {
    const t = useTranslations("admin.events.list");
    const [rows, setRows] = useState<EventRow[]>([]);
    const [loading, setLoading] = useState(false);
    const loadedRef = useRef(false);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [dateFilter, setDateFilter] = useState<DateFilter>("all");
    const [view, setView] = useState<ViewMode>("month"); // vista activa
    const [month, setMonth] = useState<Date>(startOfMonth(new Date())); // ancla mensual
    const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date())); // ancla semanal
    const [selected, setSelected] = useState<EventRow | null>(null);
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);

    // Acción: publicar/despublicar
    const toggleStatus = useCallback(
      async (ev: EventRow, next: "published" | "draft") => {
        try {
          const res = await fetch(`/api/admin/events/${ev._id}`, {
            method: "PATCH",
            headers: await withCsrfHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({ status: next })
          });
          if (!res.ok) throw new Error("Toggle failed");
          setRows((prev) => prev.map((r) => (r._id === ev._id ? { ...r, status: next } : r)));
          setSelected((s) => (s && s._id === ev._id ? { ...s, status: next } : s));
          newSuccessToast(
            next === "published" ? t("toasts.publishSuccess") : t("toasts.unpublishSuccess")
          );
        } catch (e) {
          console.error(e);
          newErrorToast(t("toasts.toggleError"));
        }
      },
      [t]
    );

    // Carga de eventos (publicados + borradores)
    const load = useCallback(async () => {
      setLoading(true);
      try {
        const [pubRes, draftRes] = await Promise.all([
          fetch(`/api/admin/events?status=published&sort=newest&page=1&pageSize=500`, {
            cache: "no-store"
          }),
          fetch(`/api/admin/events?status=draft&sort=newest&page=1&pageSize=500`, {
            cache: "no-store"
          })
        ]);
        const [pubData, draftData] = await Promise.all([pubRes.json(), draftRes.json()]);
        setRows([...(pubData.items || []), ...(draftData.items || [])]);
        loadedRef.current = true;
      } catch (e) {
        setRows([]);
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, []);

    useEffect(() => {
      load();
    }, [load]);

    // API imperativa para el padre (p.ej., asegurar carga al entrar en vista calendario)
    useImperativeHandle(
      ref,
      () => ({
        reload: () => {
          load();
        },
        ensureLoaded: () => {
          if (!loadedRef.current && !loading) load();
        }
      }),
      [load, loading]
    );

    // Filtros (estado + fecha relativa)
    const filtered = useMemo(() => {
      const now = Date.now();
      let list = rows;
      if (statusFilter !== "all") list = list.filter((r) => r.status === statusFilter);
      if (dateFilter !== "all") {
        list = list.filter((r) => {
          const tms = new Date(r.date).getTime();
          return dateFilter === "upcoming" ? tms >= now : tms < now;
        });
      }
      return list;
    }, [rows, statusFilter, dateFilter]);

    // Grupo de eventos por día
    const eventsByDay = useMemo(() => {
      const map = new Map<string, EventRow[]>();
      for (const ev of filtered) {
        const d = new Date(ev.date);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(ev);
      }
      for (const [k, list] of map) {
        list.sort(
          (a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime() ||
            a.title.localeCompare(b.title)
        );
        map.set(k, list);
      }
      return map;
    }, [filtered]);

    // Días visibles por vista
    const monthDays = useMemo(() => getMonthMatrix(month), [month]);
    const weekDays = useMemo(
      () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
      [weekStart]
    );
    const today = new Date();

    // Geometría semanal compacta: 36px por hora, eventos alineados a slot de la hora
    const pxPerHour = 36;
    const slotHeight = pxPerHour - 8; // altura del bloque dentro del slot
    const hourSlotTop = (dateIso: string) => {
      const d = new Date(dateIso);
      const top = d.getHours() * pxPerHour; // alineado al inicio de la hora
      return top;
    };

    return (
      <Wrapper>
        {/* Barra de herramientas: crear, recargar, filtros y selector de vista */}
        <Toolbar>
          <AddButton onClick={() => onCreate()} />
          <ReloadButton onClick={load} showSpinner={true} />
          <FilterGroup>
            <Label>{t("filters.status", { defaultValue: "Estado" })}</Label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option value="all">{t("filters.all", { defaultValue: "Todos" })}</option>
              <option value="published">{t("status.published")}</option>
              <option value="draft">{t("status.draft")}</option>
            </Select>
          </FilterGroup>
          <FilterGroup>
            <Label>{t("filters.date", { defaultValue: "Fecha" })}</Label>
            <Select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
            >
              <option value="all">{t("filters.all", { defaultValue: "Todos" })}</option>
              <option value="upcoming">
                {t("filters.upcoming", { defaultValue: "Próximos" })}
              </option>
              <option value="past">{t("filters.past", { defaultValue: "Pasados" })}</option>
            </Select>
          </FilterGroup>
          <Segmented aria-label="Cambiar vista calendario">
            <SegmentedBtn $active={view === "month"} onClick={() => setView("month")}>
              Mes
            </SegmentedBtn>
            <SegmentedBtn $active={view === "week"} onClick={() => setView("week")}>
              Semana
            </SegmentedBtn>
          </Segmented>
        </Toolbar>

        {/* Cabecera: navegación y título dependiente de vista */}
        <CalendarHeader>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BackButton
              onClick={() =>
                view === "month"
                  ? setMonth(addMonths(month, -1))
                  : setWeekStart(addDays(weekStart, -7))
              }
              ariaLabel={view === "month" ? "Mes anterior" : "Semana anterior"}
            />
            <NextButton
              onClick={() =>
                view === "month"
                  ? setMonth(addMonths(month, 1))
                  : setWeekStart(addDays(weekStart, 7))
              }
              ariaLabel={view === "month" ? "Mes siguiente" : "Semana siguiente"}
            />
            <TodayBtn
              onClick={() => {
                const now = new Date();
                setMonth(startOfMonth(now));
                setWeekStart(startOfWeek(now));
              }}
            >
              Hoy
            </TodayBtn>
          </div>
          <MonthTitle>
            {view === "month"
              ? month.toLocaleString(undefined, { month: "long", year: "numeric" })
              : formatWeekTitle(weekStart)}
          </MonthTitle>
          <div />
        </CalendarHeader>

        {/* Vista condicional */}
        {view === "month" ? (
          <MonthGrid>
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((w) => (
              <Weekday key={w}>{w}</Weekday>
            ))}
            {monthDays.map((d) => {
              const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
              const list = eventsByDay.get(key) || [];
              const isCurrentMonth = isSameMonth(d, month);
              const isToday = sameDay(d, today);
              const maxShow = 3;
              const extra = list.length - maxShow;
              return (
                <DayCell
                  key={key}
                  $isCurrentMonth={isCurrentMonth}
                  $isToday={isToday}
                  onClick={() => setSelectedDay(d)}
                  role="button"
                  aria-label={`Día ${d.toLocaleDateString()}`}
                >
                  <DayNumber $isToday={isToday}>{d.getDate()}</DayNumber>
                  {list.slice(0, maxShow).map((ev) => (
                    <EventPill
                      key={ev._id}
                      $variant={ev.status}
                      onClick={() => setSelected(ev)}
                      title={ev.title}
                    >
                      <span style={{ fontWeight: 700 }}>
                        {new Date(ev.date).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>{" "}
                      · {ev.title}
                    </EventPill>
                  ))}
                  {extra > 0 && (
                    <MoreLink onClick={() => setSelected(list[0])}>+{extra} más</MoreLink>
                  )}
                </DayCell>
              );
            })}
          </MonthGrid>
        ) : (
          <WeekGrid>
            {/* Cabecera: celda vacía (horas) + nombres de días */}
            <WeekHeaderRow>
              <WeekHeaderCell $muted> </WeekHeaderCell>
              {weekDays.map((d) => (
                <WeekHeaderCell key={`h-${d.toDateString()}`}>
                  {d.toLocaleDateString(undefined, { weekday: "short" })} {d.getDate()}
                </WeekHeaderCell>
              ))}
            </WeekHeaderRow>
            {/* Columna de horas */}
            <TimeCol>
              {Array.from({ length: 24 }).map((_, h) => (
                <HourCell key={`t-${h}`}>{h.toString().padStart(2, "0")}:00</HourCell>
              ))}
            </TimeCol>
            {/* Columnas de cada día */}
            <WeekBody>
              {weekDays.map((d) => {
                const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
                const list = eventsByDay.get(key) || [];
                return (
                  <DayCol key={`c-${key}`}>
                    <MobileDayHeader>
                      <span>
                        {d.toLocaleDateString(undefined, { weekday: "long" })} {d.getDate()}
                      </span>
                    </MobileDayHeader>
                    {Array.from({ length: 24 }).map((_, i) => (
                      <HourRow key={`r-${key}-${i}`} />
                    ))}
                    {list.map((ev) => (
                      <EventBlock
                        key={ev._id}
                        $variant={ev.status}
                        $top={hourSlotTop(ev.date)}
                        $height={slotHeight}
                        onClick={() => setSelected(ev)}
                        title={ev.title}
                      >
                        <strong>
                          {new Date(ev.date).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </strong>{" "}
                        · {ev.title}
                      </EventBlock>
                    ))}
                  </DayCol>
                );
              })}
            </WeekBody>
          </WeekGrid>
        )}

        {/* Modal de detalles y acciones */}
        <Modal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title={selected?.title}
          width="sm"
          buttons={
            selected
              ? ([
                  <ViewButton
                    key="view"
                    onClick={() => {
                      if (onView) onView(selected.slug);
                      else window.open(`/events/${selected.slug}`, "_blank", "noopener,noreferrer");
                    }}
                  />,
                  <EditButton
                    key="edit"
                    onClick={() => {
                      onEdit(selected._id);
                      setSelected(null);
                    }}
                  />,
                  selected.status === "draft" ? (
                    <AcceptButton
                      key="publish"
                      onClick={() => toggleStatus(selected, "published")}
                      confirmationDuration={1200}
                      ariaLabel={t("actions.publish")}
                    />
                  ) : (
                    <HideButton
                      key="unpublish"
                      onClick={() => toggleStatus(selected, "draft")}
                      confirmationDuration={1200}
                      ariaLabel={t("actions.unpublish")}
                    />
                  ),
                  selected.url ? (
                    <OpenLinkButton key="open" href={selected.url} color="primary" />
                  ) : null
                ].filter(Boolean) as React.ReactNode[])
              : undefined
          }
        >
          {selected && (
            <div style={{ display: "grid", gap: 8 }}>
              <div>
                <Badge $tone={selected.status === "published" ? "success" : "warning"}>
                  {selected.status === "published" ? "published" : "draft"}
                </Badge>
              </div>
              <div>
                <strong>Fecha:</strong> <LocalTime iso={selected.date} dateOnly={false} />
              </div>
              {selected.location && (
                <div>
                  <strong>Ubicación:</strong> {selected.location}
                </div>
              )}
            </div>
          )}
        </Modal>
        {/* Modal del día seleccionado: lista eventos y permite crear en ese día */}
        <Modal
          isOpen={!!selectedDay}
          onClose={() => setSelectedDay(null)}
          title={
            selectedDay
              ? selectedDay.toLocaleDateString(undefined, {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                  year: "numeric"
                })
              : ""
          }
          width="sm"
          buttons={
            selectedDay
              ? ([
                  <AddButton
                    key="add-day"
                    onClick={() => {
                      const d = new Date(selectedDay);
                      d.setHours(10, 0, 0, 0);
                      onCreate(d.toISOString());
                      setSelectedDay(null);
                    }}
                  />
                ] as React.ReactNode[])
              : undefined
          }
        >
          {selectedDay &&
            (() => {
              const k = `${selectedDay.getFullYear()}-${selectedDay.getMonth()}-${selectedDay.getDate()}`;
              const list = eventsByDay.get(k) || [];
              if (list.length === 0)
                return <div style={{ color: "#6b7280" }}>No hay eventos para este día.</div>;
              return (
                <div style={{ display: "grid", gap: 8 }}>
                  {list.map((ev) => (
                    <div
                      key={ev._id}
                      style={{
                        background: ev.status === "published" ? "#e6f4ea" : "#fef7e0",
                        borderRadius: 10,
                        padding: "8px 10px",
                        position: "relative"
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 4,
                          borderTopLeftRadius: 10,
                          borderBottomLeftRadius: 10,
                          background:
                            ev.status === "published" ? "var(--g-green)" : "var(--g-yellow)"
                        }}
                      />
                      <div style={{ fontWeight: 700 }}>
                        {new Date(ev.date).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </div>
                      <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        {ev.title}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
        </Modal>
      </Wrapper>
    );
  }
);

export default AdminEventsCalendar;
