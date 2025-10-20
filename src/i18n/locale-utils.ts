"use client";

import { routing } from "@/i18n/routing";

export function setLocale(locale: string) {
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    throw new Error(`Invalid locale: ${locale}`);
  }

  // Set the cookie
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=lax`;

  // Reload the page to apply the new locale
  window.location.reload();
}

export function getClientLocale(): string {
  if (typeof document === "undefined") return routing.defaultLocale;

  const cookies = document.cookie.split(";");
  const localeCookie = cookies
    .find((cookie) => cookie.trim().startsWith("NEXT_LOCALE="))
    ?.split("=")[1];

  return localeCookie || routing.defaultLocale;
}
