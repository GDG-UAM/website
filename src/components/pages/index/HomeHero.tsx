"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ChevronDownButton, PlainButton } from "@/components/Buttons";
import {
  AfterTitle,
  ButtonStack,
  ColorUnderline,
  Container,
  Description,
  HeroRoot,
  Lockup,
  MainTitle,
  PillDots,
  ScrollHint,
  Subtitle,
  TitleWord,
  TitleWrap
} from "./HomeHero.styles";

type HomeHeroProps = {
  joinHref?: string;
  aboutHref?: string;
  nextSectionId?: string;
};

export default function HomeHero({
  joinHref = "https://gdguam.es/l/gdg-community",
  aboutHref = "/about",
  nextSectionId
}: HomeHeroProps) {
  const t = useTranslations("index.hero");
  const computedIsFirstLoad = (() => {
    return true;
    // if (typeof window === "undefined") return true;
    // try {
    //   const TAB_KEY = "homeHeroAnimatedThisTab";

    //   let isReload = false;
    //   try {
    //     const nav = performance.getEntriesByType("navigation")[0] as
    //       | PerformanceNavigationTiming
    //       | undefined;
    //     if (nav && nav.type === "reload") isReload = true;
    //     const navLegacy = performance as unknown as { navigation?: { type?: number } };
    //     if (!isReload && typeof navLegacy.navigation?.type === "number") {
    //       isReload = navLegacy.navigation!.type === 1;
    //     }
    //   } catch {}

    //   const seenThisTab = sessionStorage.getItem(TAB_KEY) === "true";

    //   return isReload && !seenThisTab;
    // } catch {
    //   return false;
    // }
  })();

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const TAB_KEY = "homeHeroAnimatedThisTab";
    if (computedIsFirstLoad) {
      try {
        sessionStorage.setItem(TAB_KEY, "true");
      } catch {}
    }
  }, [computedIsFirstLoad]);

  const scrollDown = () => {
    if (!nextSectionId) return;
    const el = document.getElementById(nextSectionId);
    if (el) {
      const root = document.documentElement;
      const cssVar = getComputedStyle(root).getPropertyValue("--navbar-height") || "68";
      const navbarHeight = parseFloat(cssVar) || 68;
      const targetY = el.getBoundingClientRect().top + window.scrollY - navbarHeight;
      window.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });
    }
  };

  const openLink = (url: string, newTab: boolean = true) => {
    window.open(url, newTab ? "_blank" : "_self");
  };

  return (
    <HeroRoot $suppressAnimation={!computedIsFirstLoad} role="region" aria-label="Hero principal">
      <Container>
        <Lockup>
          <PillDots aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </PillDots>

          <MainTitle>
            <TitleWrap data-no-ai-translate>
              {t.rich("title", {
                google: (chunks) => (
                  <TitleWord className="google">
                    {String(chunks)
                      .split("")
                      .map((ch, i) => (
                        <span
                          key={`g-${i}`}
                          className="gletter"
                          data-i={i}
                          style={{ ["--i" as string]: i } as React.CSSProperties}
                        >
                          {ch}
                        </span>
                      ))}
                  </TitleWord>
                ),
                word: (chunks) => (
                  <TitleWord>
                    {String(chunks)
                      .split("")
                      .map((ch, i) => (
                        <span
                          key={`w-${i}`}
                          className={`letter c${i % 4}`}
                          data-i={i}
                          style={{ ["--i" as string]: i } as React.CSSProperties}
                        >
                          {ch}
                        </span>
                      ))}{" "}
                  </TitleWord>
                )
              })}
            </TitleWrap>
          </MainTitle>

          <Subtitle>{t("university")}</Subtitle>

          <ColorUnderline aria-hidden="true" />

          <AfterTitle>
            <Description>{t("description")}</Description>

            <ButtonStack>
              <PlainButton hasBorder slim onClick={() => openLink(joinHref, true)}>
                {t("joinChapter")}
              </PlainButton>
              <PlainButton
                noBackground
                slim
                color="secondary"
                onClick={() => openLink(aboutHref, false)}
              >
                {t("learnMore")}
              </PlainButton>
            </ButtonStack>
          </AfterTitle>
        </Lockup>
      </Container>

      {nextSectionId && (
        <ScrollHint>
          <ChevronDownButton noBackground hasBorder={false} slim noHover onClick={scrollDown}>
            {t("scroll")}
          </ChevronDownButton>
        </ScrollHint>
      )}
    </HeroRoot>
  );
}
