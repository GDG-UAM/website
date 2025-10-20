"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { setLocale } from "@/i18n/locale-utils";
import { useTranslations, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { useAiTranslation } from "@/components/ai/translation/AiTranslationProvider";
import { searchLanguages } from "@/lib/ai/translation/languages";
import { routing } from "@/i18n/routing";
import {
  FlagImg,
  LangButton,
  LangDropdown,
  LangMenu,
  LangMenuItem,
  LangName,
  SearchInput,
  AiList,
  FlexSpacer,
  AvailableIcon,
  SpinnerIcon
} from "./Navbar.styles";
import { IoChevronDown } from "react-icons/io5";
import { track } from "@/lib/telemetry/client";

type TranslatorAvailabilityFn = (opts: {
  sourceLanguage: string;
  targetLanguage: string;
}) => Promise<"available" | "downloadable" | "downloading" | "unavailable">;
type TranslatorCreateFn = (opts: {
  sourceLanguage?: string;
  targetLanguage: string;
}) => Promise<{ destroy(): unknown; translate: (text: string) => Promise<string> }>;
type TranslatorGlobal = { availability?: TranslatorAvailabilityFn; create: TranslatorCreateFn };
type Availability = "available" | "downloadable" | "downloading" | "unavailable";

interface Props {
  onCloseMobileNav?: () => void;
}

function LanguageSwitcher({ onCloseMobileNav }: Props) {
  const t = useTranslations("navbar");
  const locale = useLocale();
  const { data: session, update: updateSession } = useSession();
  type SessionWithFlags = { user?: { flags?: Record<string, boolean> } } | null;
  const showAllLanguages = Boolean(
    (session as SessionWithFlags)?.user?.flags?.["navbar-show-all-languages"]
  );
  const {
    active: aiActive,
    supported: aiSupported,
    enable: enableAi,
    disable,
    targetLang: aiTarget,
    isBusy: aiBusy
  } = useAiTranslation();
  const [langOpen, setLangOpen] = useState(false);
  const [displayLocale, setDisplayLocale] = useState(locale);
  const [search, setSearch] = useState("");
  const [aiPickerOpen, setAiPickerOpen] = useState(false);
  // True only after we have verified a translator can actually translate a sample text
  const [aiUiEnabled, setAiUiEnabled] = useState(false);
  // Whether we've attempted a sanity check (either on mount or after opening dropdown)
  const [sanityChecked, setSanityChecked] = useState(false);
  const [availMap, setAvailMap] = useState<Map<string, Availability>>(new Map());
  const prevBusyRef = useRef<boolean>(aiBusy);
  const manualLocales = routing.locales;
  const defaultManual = routing.defaultLocale;
  const manualLocalesSet = useMemo(
    () => new Set<string>(manualLocales as unknown as string[]),
    [manualLocales]
  );
  const initializedRef = useRef(false);
  const aiAutoStartedRef = useRef(false);
  const langRefMobile = useRef<HTMLDivElement | null>(null);
  // Feature flag replaces local __DEV__ override

  const baseCandidates = useMemo(() => {
    const getLabel = (code: string) => t(`lang.aiLanguages.${code}`);
    return searchLanguages(search, getLabel).filter((l) => !manualLocalesSet.has(l.code));
  }, [search, manualLocalesSet, t]);

  const filtered = useMemo(() => {
    const base = baseCandidates;
    if (showAllLanguages) return base;
    return base.filter((l) => {
      const st = availMap.get(l.code);
      return st !== undefined && st !== "unavailable";
    });
  }, [baseCandidates, availMap, showAllLanguages]);

  const flagUrl =
    aiActive && aiTarget
      ? `https://hatscripts.github.io/circle-flags/flags/language/${aiTarget}.svg`
      : `https://hatscripts.github.io/circle-flags/flags/language/${displayLocale}.svg`;

  const renderLangLabel = useCallback((label: string, forceShowNative?: boolean) => {
    const m = label.match(/^(.*)\s*\((.*)\)\s*$/);
    if (!m) return label;
    const [, left, nativePart] = m;
    const leftT = left.trim();
    const nativeT = nativePart.trim();
    if (!forceShowNative && leftT === nativeT) return leftT;
    return (
      <>
        <span>{leftT} </span>
        <span data-no-ai-translate>({nativeT})</span>
      </>
    );
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (!langRefMobile.current?.contains(target)) setLangOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);
  useEffect(() => {
    if (locale !== displayLocale) setDisplayLocale(locale);
  }, [locale, displayLocale]);

  const selectAiLanguage = useCallback(
    async (code: string, opts?: { save?: boolean }) => {
      setLangOpen(false);
      setAiPickerOpen(false);
      onCloseMobileNav?.();
      if (!aiSupported || !aiUiEnabled) return;
      const prevStatus = availMap.get(code);
      if (prevStatus !== "available" && prevStatus !== "unavailable") {
        setAvailMap((prev) => {
          const next = new Map(prev);
          next.set(code, "downloading");
          return next;
        });
      }
      try {
        await enableAi({ targetLang: code, sourceLang: displayLocale, save: opts?.save });
        if (prevStatus !== "available" && prevStatus !== "unavailable") {
          setAvailMap((prev) => {
            const st = prev.get(code);
            if (st === "available") return prev;
            const next = new Map(prev);
            next.set(code, "available");
            return next;
          });
        }
      } catch (e) {
        if (prevStatus && prevStatus !== "available" && prevStatus !== "unavailable") {
          setAvailMap((prev) => {
            const next = new Map(prev);
            next.set(code, prevStatus);
            return next;
          });
        }
        throw e;
      }
    },
    [aiSupported, aiUiEnabled, enableAi, displayLocale, availMap, onCloseMobileNav]
  );

  // Initial capability probe: only enables AI UI after a successful translate() sanity check when availability reports 'available'.
  // If availability isn't 'available' we defer the check until dropdown is opened.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (sanityChecked) return; // already tried
      if (typeof window === "undefined") return;
      const g = self as unknown as { Translator?: TranslatorGlobal };
      if (!g || !g.Translator || typeof g.Translator.availability !== "function") {
        if (!cancelled) {
          setAiUiEnabled(false);
          setSanityChecked(true);
        }
        return;
      }
      try {
        const sanitySource = defaultManual;
        const sanityTarget =
          manualLocales.find((c) => c !== defaultManual) || (defaultManual === "es" ? "en" : "es");
        const status = await g.Translator.availability({
          sourceLanguage: sanitySource,
          targetLanguage: sanityTarget
        });
        if (status !== "available") {
          // Defer until dropdown open; don't mark checked so we can re-run later.
          return;
        }
        const translator = await g.Translator.create({
          sourceLanguage: sanitySource,
          targetLanguage: sanityTarget
        });
        await translator.translate("test");
        translator.destroy();
        if (!cancelled) {
          setAiUiEnabled(true);
          setSanityChecked(true);
        }
      } catch {
        if (!cancelled) {
          setAiUiEnabled(false);
          setSanityChecked(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [defaultManual, manualLocales, sanityChecked]);

  // On dropdown open, if we haven't validated yet, attempt the sanity test (covers previously 'downloadable'/'downloading' states that later become 'available').
  useEffect(() => {
    let cancelled = false;
    if (!langOpen || sanityChecked || aiUiEnabled) return;
    (async () => {
      if (typeof window === "undefined") return;
      const g = self as unknown as { Translator?: TranslatorGlobal };
      if (!g || !g.Translator || typeof g.Translator.availability !== "function") {
        setSanityChecked(true);
        setAiUiEnabled(false);
        return;
      }
      try {
        const sanitySource = defaultManual;
        const sanityTarget =
          manualLocales.find((c) => c !== defaultManual) || (defaultManual === "es" ? "en" : "es");
        const status = await g.Translator.availability({
          sourceLanguage: sanitySource,
          targetLanguage: sanityTarget
        });
        if (status !== "available") {
          setSanityChecked(true);
          setAiUiEnabled(false);
          return;
        }
        const translator = await g.Translator.create({
          sourceLanguage: sanitySource,
          targetLanguage: sanityTarget
        });
        await translator.translate("test");
        translator.destroy();
        if (!cancelled) {
          setAiUiEnabled(true);
          setSanityChecked(true);
        }
      } catch {
        if (!cancelled) {
          setAiUiEnabled(false);
          setSanityChecked(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [langOpen, sanityChecked, aiUiEnabled, defaultManual, manualLocales]);

  useEffect(() => {
    if (!aiUiEnabled || !aiPickerOpen) return;
    let cancelled = false;
    (async () => {
      const g = self as unknown as { Translator?: TranslatorGlobal };
      if (!g || !g.Translator || typeof g.Translator.availability !== "function") return;
      const updates = new Map<string, Availability>();
      for (const l of baseCandidates) {
        if (manualLocalesSet.has(l.code)) continue;
        if (availMap.has(l.code)) continue;
        try {
          const available = await g.Translator.availability({
            sourceLanguage: displayLocale,
            targetLanguage: l.code
          });
          updates.set(l.code, available);
        } catch {
          updates.set(l.code, "unavailable");
        }
      }
      if (!cancelled && updates.size)
        setAvailMap((prev) => {
          const next = new Map(prev);
          updates.forEach((v, k) => next.set(k, v));
          return next;
        });
    })();
    return () => {
      cancelled = true;
    };
  }, [aiUiEnabled, aiPickerOpen, baseCandidates, displayLocale, availMap, manualLocalesSet]);

  useEffect(() => {
    let cancelled = false;
    const prev = prevBusyRef.current;
    if (!aiUiEnabled) {
      prevBusyRef.current = aiBusy;
      return;
    }
    if (prev && !aiBusy) {
      const transitional = Array.from(availMap.entries())
        .filter(([, st]) => st !== "available" && st !== "unavailable")
        .map(([c]) => c);
      if (transitional.length === 0) {
        prevBusyRef.current = aiBusy;
        return;
      }
      (async () => {
        const g = self as unknown as { Translator?: TranslatorGlobal };
        const availability = g?.Translator?.availability as TranslatorAvailabilityFn | undefined;
        if (typeof availability !== "function") return;
        const results = await Promise.all(
          transitional.map(async (code) => {
            try {
              const st = await availability({
                sourceLanguage: displayLocale,
                targetLanguage: code
              });
              return [code, st] as const;
            } catch {
              return [code, "unavailable" as Availability] as const;
            }
          })
        );
        if (cancelled) return;
        setAvailMap((prevMap) => {
          const next = new Map(prevMap);
          for (const [code, st] of results) next.set(code, st);
          return next;
        });
      })();
    }
    prevBusyRef.current = aiBusy;
    return () => {
      cancelled = true;
    };
  }, [aiBusy, aiUiEnabled, availMap, displayLocale]);

  useEffect(() => {
    if (initializedRef.current) return;
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const paramLang = params.get("lang") || "";
      if (paramLang && manualLocalesSet.has(paramLang)) {
        if (aiActive) disable();
        setDisplayLocale(paramLang);
        try {
          document.cookie = `NEXT_LOCALE=${paramLang}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=lax`;
        } catch {}
        try {
          void updateSession?.({ locale: paramLang });
        } catch {}
        track("locale_change", {
          locale: { rendered_locale: paramLang, chosen_locale: paramLang }
        });
        setTimeout(() => setLocale(paramLang), 0);
        initializedRef.current = true;
      }
    } catch {}
  }, [manualLocalesSet, aiActive, disable, updateSession]);

  useEffect(() => {
    if (initializedRef.current) return;
    if (!aiUiEnabled || !sanityChecked) return;
    if (typeof window === "undefined") return;
    if (aiAutoStartedRef.current) return;
    (async () => {
      const g = self as unknown as { Translator?: TranslatorGlobal };
      const availabilityFn = g?.Translator?.availability;
      const params = new URLSearchParams(window.location.search);
      const paramLang = params.get("lang") || "";
      let saved: string | null = null;
      try {
        saved = localStorage.getItem("ai-target-lang");
      } catch {}
      const desired = paramLang || saved || "";
      if (!desired) {
        initializedRef.current = true;
        return;
      }
      if (manualLocalesSet.has(desired)) {
        initializedRef.current = true;
        return;
      }
      let status: Availability | "unknown" = "unknown";
      if (typeof availabilityFn === "function") {
        try {
          status = await availabilityFn({ sourceLanguage: displayLocale, targetLanguage: desired });
        } catch {
          status = "unavailable";
        }
      }
      if (status === "available") {
        try {
          if (aiAutoStartedRef.current) {
            initializedRef.current = true;
            return;
          }
          aiAutoStartedRef.current = true;
          await selectAiLanguage(desired, { save: !paramLang && !!saved });
        } finally {
          initializedRef.current = true;
        }
      } else {
        if (aiActive) disable();
        if (displayLocale !== defaultManual) {
          setDisplayLocale(defaultManual);
          try {
            document.cookie = `NEXT_LOCALE=${defaultManual}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=lax`;
          } catch {}
          try {
            void updateSession?.({ locale: defaultManual });
          } catch {}
          track("locale_change", {
            locale: { rendered_locale: defaultManual, chosen_locale: defaultManual }
          });
          setTimeout(() => setLocale(defaultManual), 0);
        }
        initializedRef.current = true;
      }
    })();
  }, [
    aiUiEnabled,
    sanityChecked,
    selectAiLanguage,
    displayLocale,
    defaultManual,
    manualLocalesSet,
    aiActive,
    disable,
    updateSession
  ]);

  return (
    <LangDropdown ref={langRefMobile}>
      <LangButton
        aria-label={t("lang.switchLanguage")}
        aria-haspopup="menu"
        aria-expanded={langOpen}
        onClick={() => setLangOpen((v) => !v)}
      >
        {aiActive && aiTarget ? (
          <>
            <Image
              src="/icons/gemini.svg"
              alt="AI"
              width={16}
              height={16}
              style={{ borderRadius: 4 }}
            />
            <FlagImg src={flagUrl} alt={t("lang.flagLabel", { code: aiTarget })} />
          </>
        ) : (
          <FlagImg src={flagUrl} alt={t("lang.flagLabel", { code: displayLocale })} />
        )}
        <IoChevronDown size={18} />
      </LangButton>
      <LangMenu role="menu" aria-label={t("lang.switchLanguage")} $open={langOpen}>
        {manualLocales.map((code) => (
          <LangMenuItem role="none" key={code}>
            <button
              role="menuitem"
              aria-label={t("lang.flagLabel", { code })}
              onClick={async () => {
                setLangOpen(false);
                onCloseMobileNav?.();
                if (aiActive) disable();
                try {
                  localStorage.removeItem("ai-target-lang");
                } catch {}
                setDisplayLocale(code);
                // First set the cookie so both session.update() and subsequent requests see it
                try {
                  document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=lax`;
                } catch {}
                // Optimistically update session with new locale (server will also set it on next load)
                try {
                  await updateSession({ locale: code });
                } catch {}
                track("locale_change", {
                  locale: { rendered_locale: code, chosen_locale: code }
                });
                // Finally trigger full reload to re-render with new messages
                setTimeout(() => setLocale(code), 50);
              }}
            >
              <FlagImg
                src={`https://hatscripts.github.io/circle-flags/flags/language/${code}.svg`}
                alt={t("lang.flagLabel", { code })}
              />
              <LangName>{renderLangLabel(t(`lang.manualLanguages.${code}`), aiActive)}</LangName>
            </button>
          </LangMenuItem>
        ))}
        {aiUiEnabled && sanityChecked && (
          <LangMenuItem role="none">
            <button
              role="menuitem"
              aria-label={t("ai.translateAria")}
              onClick={() => {
                if (!aiSupported || !aiUiEnabled) return;
                setAiPickerOpen((v) => !v);
              }}
            >
              <Image
                src="/icons/gemini.svg"
                alt="AI"
                width={18}
                height={18}
                style={{ borderRadius: 4 }}
              />
              <LangName>{aiActive ? t("ai.changeLanguage") : t("ai.translate")}</LangName>
            </button>
          </LangMenuItem>
        )}
        {aiUiEnabled && sanityChecked && aiPickerOpen && (
          <>
            <li>
              <SearchInput
                placeholder={t("ai.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label={t("ai.searchAria")}
              />
            </li>
            {showAllLanguages && (
              <p
                data-no-ai-translate
                style={{
                  fontSize: 12,
                  color: "var(--navbar-language-switcher-dropdown-arrow-text)",
                  marginLeft: 4,
                  marginRight: 4
                }}
              >
                NOTA: Los resultados desactivados (fondo gris) y este mensaje solo se mostrarán en
                desarrollo
              </p>
            )}
            <AiList>
              {filtered.map((l) => {
                const langName = t(`lang.aiLanguages.${l.code}`);
                const status = availMap.get(l.code);
                const disabled =
                  aiBusy ||
                  (showAllLanguages
                    ? status === "unavailable"
                    : !status || status === "unavailable");
                return (
                  <LangMenuItem role="none" key={l.code}>
                    <button
                      role="menuitemradio"
                      aria-checked={aiTarget === l.code}
                      disabled={!!disabled}
                      onClick={async () => {
                        if (!showAllLanguages && (!status || status === "unavailable")) return;
                        await selectAiLanguage(l.code, { save: true });
                      }}
                    >
                      <FlagImg
                        src={`https://hatscripts.github.io/circle-flags/flags/language/${l.code}.svg`}
                        alt={langName}
                      />
                      {aiTarget === l.code ? (
                        <LangName>
                          <span data-no-ai-translate>{l.native || langName}</span>
                        </LangName>
                      ) : (
                        <LangName>
                          {langName}
                          {l.native && l.native.trim() !== langName.trim() ? (
                            <span data-no-ai-translate> ({l.native})</span>
                          ) : null}
                        </LangName>
                      )}
                      <FlexSpacer />
                      {status === "available" && (
                        <AvailableIcon
                          size={16}
                          aria-label={t("ai.availableAria", { code: l.code })}
                        />
                      )}
                      {status === "downloading" && (
                        <SpinnerIcon
                          size={16}
                          aria-label={t("ai.downloadingAria", { code: l.code })}
                        />
                      )}
                    </button>
                  </LangMenuItem>
                );
              })}
            </AiList>
          </>
        )}
      </LangMenu>
    </LangDropdown>
  );
}

export default LanguageSwitcher;
