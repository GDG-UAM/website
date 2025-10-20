"use client";

type Props = {
  iso: string;
  dateOnly?: boolean;
  options?: Intl.DateTimeFormatOptions;
};

export default function LocalTime({ iso, dateOnly = true, options }: Props) {
  if (!iso) return null;
  const d = new Date(iso);
  const text = dateOnly
    ? d.toLocaleDateString(undefined, options)
    : d.toLocaleString(undefined, options);
  return <>{text}</>;
}
