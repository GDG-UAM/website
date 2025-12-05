"use client";

import { useSettings } from "@/lib/settings/SettingsContext";
import { useLocale, useTranslations } from "next-intl";

type Props = {
  iso: string;
  dateOnly?: boolean;
  compact?: boolean;
  fullMonth?: boolean;
  locale?: string;
  timeZone?: string;
};

export default function LocalTimeWithSettings({
  iso,
  dateOnly = true,
  compact = false,
  fullMonth = false,
  locale: propLocale,
  timeZone: propTimeZone
}: Props) {
  const { settings } = useSettings();
  const currentLocale = useLocale();
  const t = useTranslations("dateFormats");
  const hour12 = (settings?.general.timeFormat ?? "24h") === "12h";

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

  // Format as "2 nov 2025, 09:00"
  const locale = propLocale ?? currentLocale;
  const timeZone =
    propTimeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "Europe/Madrid";
  const d = new Date(iso);

  // Get day (without leading zero)
  const day = d.toLocaleDateString(locale, { day: "numeric", timeZone });

  // Get month (short or long format, lowercase)
  const month = d
    .toLocaleDateString(locale, { month: fullMonth ? "long" : "short", timeZone })
    .replace(/\./g, "")
    .toLowerCase();

  // Get year
  const year = d.toLocaleDateString(locale, { year: "numeric", timeZone });

  // Get time
  const time = d.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
    hour12: hour12
  });

  if (dateOnly) {
    if (fullMonth) {
      return <time dateTime={iso}>{t("fullDate", { day, month, year })}</time>;
    }
    return <time dateTime={iso}>{t("shortDate", { day, month, year })}</time>;
  }

  if (fullMonth) {
    return <time dateTime={iso}>{t("fullDateTime", { day, month, year, time })}</time>;
  }
  return <time dateTime={iso}>{t("shortDateTime", { day, month, year, time })}</time>;
}
