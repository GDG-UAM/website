"use client";

import { useSettings } from "@/lib/settings/SettingsContext";
import LocalTime from "./LocalTime";

type Props = {
  iso: string;
  dateOnly?: boolean;
  compact?: boolean;
  locale?: string;
  timeZone?: string;
};

export default function LocalTimeWithSettings({
  iso,
  dateOnly = true,
  compact = false,
  locale: propLocale,
  timeZone: propTimeZone
}: Props) {
  const { settings } = useSettings();
  const hour12 = (settings?.general.timeFormat ?? "24h") === "12h";
  const options: Intl.DateTimeFormatOptions = { hourCycle: hour12 ? "h12" : "h23" };

  if (compact) {
    const locale = propLocale;
    const timeZone =
      propTimeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "Europe/Madrid";
    const d = new Date(iso);
    const dow = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone }).format(d);
    const day = new Intl.DateTimeFormat(locale, { day: "2-digit", timeZone }).format(d);
    const mon = new Intl.DateTimeFormat(locale, { month: "short", timeZone }).format(d);
    const hm = new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      timeZone,
      hour12: hour12
    }).format(d);

    const capitalize = (s: string) => (s.length ? s[0].toUpperCase() + s.slice(1) : s);
    const dowClean = capitalize(dow.replace(/\./g, ""));
    const monClean = mon.replace(/\./g, "").toLowerCase();

    return <time dateTime={iso}>{`${dowClean}, ${day} ${monClean} · ${hm}`}</time>;
  }

  return <LocalTime iso={iso} dateOnly={dateOnly} options={options} />;
}
