"use client";

import { useMemo } from "react";
import LocalTime from "@/components/LocalTime";
import { useSettings } from "@/lib/settings/SettingsContext";

type Props = {
  iso: string;
  dateOnly?: boolean;
};

export default function EventDateTime({ iso, dateOnly = false }: Props) {
  const { settings } = useSettings();
  const hour12 = (settings?.general.timeFormat ?? "24h") === "12h";
  const options = useMemo<Intl.DateTimeFormatOptions>(
    () => ({ hourCycle: hour12 ? "h12" : "h23" }),
    [hour12]
  );
  return <LocalTime iso={iso} dateOnly={dateOnly} options={options} />;
}
