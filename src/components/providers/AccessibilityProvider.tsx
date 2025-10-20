"use client";

import React, { useEffect } from "react";
import { useSettings } from "@/lib/settings/SettingsContext";

function getSystemReduceMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getSystemHighContrast(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return (
    window.matchMedia("(prefers-contrast: more)").matches ||
    window.matchMedia("(forced-colors: active)").matches
  );
}

const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useSettings();
  const a = settings?.accessibility;

  useEffect(() => {
    if (!a) return;
    const effective = {
      highContrast: !!a?.highContrast || (!a && getSystemHighContrast()),
      reduceMotion: !!a?.reducedMotion || (!a && getSystemReduceMotion()),
      dyslexicFont: !!a?.dyslexicFont,
      daltonismMode: a?.daltonismMode || "none"
    };
    const el = document.documentElement;
    el.toggleAttribute("data-contrast", effective.highContrast);
    el.toggleAttribute("data-reduce-motion", effective.reduceMotion);
    el.toggleAttribute("data-dyslexic-font", effective.dyslexicFont);
    el.removeAttribute("data-deuteranopia");
    el.removeAttribute("data-protanopia");
    el.removeAttribute("data-tritanopia");
    if (effective.daltonismMode === "deuteranopia") el.setAttribute("data-deuteranopia", "");
    if (effective.daltonismMode === "protanopia") el.setAttribute("data-protanopia", "");
    if (effective.daltonismMode === "tritanopia") el.setAttribute("data-tritanopia", "");
    try {
      localStorage.setItem("accessibilityPrefs", JSON.stringify(effective));
    } catch {}
  }, [a]);

  return <>{children}</>;
};

export default AccessibilityProvider;
