"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { IntermissionData } from "@/components/pages/admin/hackathons/intermission/IntermissionForm";
import { subscribeToHackathon } from "@/lib/realtime/client";
import { CarouselRenderer } from "./CarouselRenderer";
import { useTranslations } from "next-intl";

import { createGlobalStyle } from "styled-components";

const GlobalIntermissionStyle = createGlobalStyle`
  nav, footer {
    display: none !important;
  }
  body, html {
    overflow: hidden !important;
    height: 100vh;
    margin: 0;
    padding: 0;
  }
`;

const MobileMessage = styled.div`
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px;
  background: white;
  color: var(--foreground);
  box-sizing: border-box;

  h1 {
    font-size: 1.8rem;
    margin-bottom: 16px;
    letter-spacing: -1px;
    font-weight: 800;
  }

  p {
    opacity: 0.8;
    font-size: 1.1rem;
    max-width: 320px;
    line-height: 1.5;
    font-weight: 500;
  }
`;

const Container = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 0 40px 0px 40px; /* Removed top padding */
  max-width: 100%;
  margin: 0;
  width: 100%;
  box-sizing: border-box;
  background: var(--color-white);
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 16px;
  padding-bottom: 32px;
  flex-shrink: 0;
`;

const OrganizerLogo = styled.img`
  height: 10vh;
  width: auto;
  object-fit: contain;
`;

const MainContent = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
  overflow: hidden;
  min-height: 0; /* Important for flex child to allow shrinking */
`;

const ScheduleSection = styled.div`
  background: white;
  border-radius: 40px;
  padding: 32px 32px 0 32px;
  border: none;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ScheduleContainer = styled.div`
  position: relative;
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const FadeOverlay = styled.div<{ $position: "top" | "bottom"; $visible: boolean }>`
  position: absolute;
  left: 0;
  right: 0;
  height: 80px;
  z-index: 2;
  pointer-events: none;
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  transition: opacity 0.3s ease;
  background: linear-gradient(
    to ${(props) => (props.$position === "top" ? "bottom" : "top")},
    white 0%,
    rgba(255, 255, 255, 0.9) 30%,
    transparent 100%
  );
  ${(props) => (props.$position === "top" ? "top: 0;" : "bottom: 0;")}
`;

const CarouselSection = styled.div`
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const CarouselItem = styled(motion.div)`
  position: absolute;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: default;
`;

const ScheduleTitle = styled.h1`
  margin-bottom: 8px;
  color: var(--foreground);
  flex-shrink: 0;
  letter-spacing: -1px;
`;

const ScheduleList = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  flex: 1;
  padding: 12px 0 120px 0; /* Reduced top padding, keeping bottom for centering last items */

  &::-webkit-scrollbar {
    display: none;
  }
  scrollbar-width: none;
  -ms-overflow-style: none;

  scroll-behavior: smooth;
`;

const ScheduleItem = styled.div<{ $active: boolean; $past: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 12px;
  border-radius: 10px;
  background: ${(props) =>
    props.$active ? "color-mix(in srgb, var(--google-blue) 8%, transparent)" : "transparent"};
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  transform: ${(props) => (props.$active ? "scale(1.01)" : "scale(1)")};
  opacity: ${(props) => (props.$past ? 0.4 : 1)};
  filter: ${(props) => (props.$past ? "grayscale(1)" : "none")};
`;

const TimeTag = styled.div<{ $active: boolean; $past: boolean }>`
  font-weight: 800;
  font-size: 0.7rem;
  color: ${(props) => (props.$past ? "#70757a" : "var(--google-blue)")};
  background: ${(props) =>
    props.$past ? "#f1f3f4" : "color-mix(in srgb, var(--google-blue) 12%, transparent)"};
  padding: 4px 10px;
  border-radius: 6px;
  white-space: nowrap;
  letter-spacing: 0.01em;
  min-width: 70px;
  text-align: center;
`;

const ActivityTitle = styled.div<{ $active: boolean; $past: boolean }>`
  font-size: 1.05rem;
  font-weight: ${(props) => (props.$active ? "800" : "600")};
  color: ${(props) => (props.$active ? "var(--foreground)" : props.$past ? "#70757a" : "#3c4043")};
  letter-spacing: -0.2px;
  line-height: 1.1;
`;

const SponsorsSection = styled.div`
  padding-top: 32px;
  padding-bottom: 16px;
  display: flex;
  justify-content: center;
  width: 100%;
  height: auto;
  flex-shrink: 0;
`;

const SponsorGrid = styled.div<{ $gap: number }>`
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: flex-end;
  gap: ${(props) => props.$gap}px;
  width: 100%;
`;

const SponsorLogo = styled.img<{ $height: number }>`
  height: ${(props) => props.$height}px;
  width: auto;
  object-fit: contain;
  transition: none;
`;

const SPONSOR_CONFIG = {
  gap: 30,
  multipliers: {
    0: 1.75, // Platinum
    1: 1.325, // Gold
    2: 1.0 // Silver
  } as Record<number, number>,
  marginHorizontal: 80 // 40px each side
};

export default function IntermissionPage({
  id,
  initialData
}: {
  id: string;
  initialData: IntermissionData;
}) {
  const t = useTranslations("intermission");
  const [data, setData] = useState<IntermissionData>(initialData);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [baseSponsorHeight, setBaseSponsorHeight] = useState(60);
  const [aspectRatios, setAspectRatios] = useState<Record<number, number>>({});
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const scheduleListRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const checkMobile = () => {
      // Mobile if width is less than 1024px or screen is taller than it is wide
      setIsMobile(window.innerWidth < 1024 || window.innerHeight > window.innerWidth);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleScroll = () => {
    if (!scheduleListRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scheduleListRef.current;
    setShowTopFade(scrollTop > 10);
    setShowBottomFade(scrollTop + clientHeight < scrollHeight - 10);
  };

  const isCurrentActivity = useCallback(
    (index: number) => {
      if (!data?.schedule) return false;
      const item = data.schedule[index];
      const nextItem = data.schedule[index + 1];

      const now = new Date();
      const [startH, startM] = item.startTime.split(":").map(Number);
      const start = new Date();
      start.setHours(startH, startM, 0, 0);

      if (item.endTime) {
        const [endH, endM] = item.endTime.split(":").map(Number);
        const end = new Date();
        end.setHours(endH, endM, 0, 0);
        return now >= start && now <= end;
      } else if (nextItem) {
        const [nextH, nextM] = nextItem.startTime.split(":").map(Number);
        const next = new Date();
        next.setHours(nextH, nextM, 0, 0);
        return now >= start && now < next;
      }

      return now >= start;
    },
    [data]
  );

  useEffect(() => {
    const unsubscribe = subscribeToHackathon(id, (updatedData: IntermissionData) => {
      setData(updatedData);
      setCarouselIndex(0);
    });

    return () => unsubscribe();
  }, [id]);

  const [activeIndex, setActiveIndex] = useState(-1);

  // Update active index
  useEffect(() => {
    const updateActiveIndex = () => {
      const newIndex = data.schedule.findIndex((_, i) => isCurrentActivity(i));
      setActiveIndex(newIndex);
    };

    updateActiveIndex();
    const interval = setInterval(updateActiveIndex, 1000); // Check every second for precision
    return () => clearInterval(interval);
  }, [data.schedule, isCurrentActivity]);

  // Handle auto-scroll to active item
  useEffect(() => {
    const performScroll = () => {
      if (activeIndex !== -1 && scheduleListRef.current) {
        const activeElement = itemRefs.current[activeIndex];
        if (activeElement) {
          const container = scheduleListRef.current;
          const containerHeight = container.offsetHeight;
          const elementOffset = activeElement.offsetTop;

          // Position the item a little higher than the center (at 35% of the container)
          const targetScroll = elementOffset - containerHeight * 0.35;
          container.scrollTo({ top: targetScroll, behavior: "smooth" });
        }
      }
    };

    performScroll(); // Initial scroll and on index change
    const scrollInterval = setInterval(performScroll, 5000); // Periodically keep centered

    return () => clearInterval(scrollInterval);
  }, [activeIndex]);

  useEffect(() => {
    const loadAspectRatios = async () => {
      const ratios: Record<number, number> = {};
      const promises = (data.sponsors || []).map((s, i) => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            ratios[i] = img.naturalWidth / img.naturalHeight;
            resolve();
          };
          img.onerror = () => {
            ratios[i] = 2; // Default fallback for unknown aspect ratio (2:1 as a safe bet)
            resolve();
          };
          img.src = s.logoUrl;
        });
      });

      await Promise.all(promises);
      setAspectRatios(ratios);
    };

    loadAspectRatios();
  }, [data.sponsors]);

  useEffect(() => {
    const calculateBaseHeight = () => {
      const sponsors = data.sponsors || [];
      if (sponsors.length === 0) return;

      const availableWidth = window.innerWidth - SPONSOR_CONFIG.marginHorizontal;
      const totalGaps = SPONSOR_CONFIG.gap * (sponsors.length - 1);

      // Calculate the sum of (multiplier * aspect_ratio) for each sponsor
      const sumWeightedRatios = sponsors.reduce((acc, s, i) => {
        const multiplier = SPONSOR_CONFIG.multipliers[s.tier] || 1;
        const ratio = aspectRatios[i] || 2; // Use loaded ratio or fallback
        return acc + multiplier * ratio;
      }, 0);

      const calculatedHeight = (availableWidth - totalGaps) / sumWeightedRatios;

      setBaseSponsorHeight(calculatedHeight);
    };

    calculateBaseHeight();
    window.addEventListener("resize", calculateBaseHeight);
    return () => window.removeEventListener("resize", calculateBaseHeight);
  }, [data.sponsors, aspectRatios]);

  const filteredCarousel = (data.carousel || []).filter((item) => item.duration !== 0);

  useEffect(() => {
    if (filteredCarousel.length === 0) return;

    const actualIndex = carouselIndex % filteredCarousel.length;
    const current = filteredCarousel[actualIndex];

    const timer = setTimeout(
      () => {
        setCarouselIndex((prev) => (prev + 1) % filteredCarousel.length);
      },
      (current.duration || 30) * 1000
    );

    return () => clearTimeout(timer);
  }, [carouselIndex, filteredCarousel]);

  const isPastActivity = (index: number) => {
    if (!data?.schedule) return false;
    const item = data.schedule[index];
    if (!item.endTime) return false;

    const now = new Date();
    const [endH, endM] = item.endTime.split(":").map(Number);
    const end = new Date();
    end.setHours(endH, endM, 0, 0);

    return now > end;
  };

  // Balanced sorting: tiered best in the middle
  const getBalancedSponsors = () => {
    const items = [...data.sponsors].sort((a, b) => a.tier - b.tier);
    const balanced: typeof items = [];
    items.forEach((item, i) => {
      if (i % 2 === 0) balanced.push(item);
      else balanced.unshift(item);
    });
    return balanced;
  };

  return (
    <>
      <GlobalIntermissionStyle />
      {isMobile ? (
        <MobileMessage>
          <h1>{t("mobile.title")}</h1>
          <p>{t("mobile.description")}</p>
        </MobileMessage>
      ) : (
        <Container>
          <TopBar>
            {data.organizerLogoUrl && <OrganizerLogo src={data.organizerLogoUrl} alt="Organizer" />}
          </TopBar>

          <MainContent>
            <ScheduleSection>
              <ScheduleTitle>{t("scheduleTitle")}</ScheduleTitle>
              <ScheduleContainer>
                <FadeOverlay $position="top" $visible={showTopFade} />
                <ScheduleList ref={scheduleListRef} onScroll={handleScroll}>
                  {data.schedule.map((item, i) => {
                    const active = i === activeIndex;
                    const past = isPastActivity(i);
                    return (
                      <ScheduleItem
                        key={i}
                        $active={active}
                        $past={past}
                        ref={(el) => {
                          itemRefs.current[i] = el;
                        }}
                      >
                        <TimeTag $active={active} $past={past}>
                          {item.startTime}
                          {item.endTime ? ` - ${item.endTime}` : "+"}
                        </TimeTag>
                        <ActivityTitle $active={active} $past={past}>
                          {item.title}
                        </ActivityTitle>
                      </ScheduleItem>
                    );
                  })}
                </ScheduleList>
                <FadeOverlay $position="bottom" $visible={showBottomFade} />
              </ScheduleContainer>
            </ScheduleSection>

            <CarouselSection>
              <AnimatePresence mode="wait">
                {filteredCarousel.length > 0 && (
                  <CarouselItem
                    key={carouselIndex % filteredCarousel.length}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <CarouselRenderer
                      element={filteredCarousel[carouselIndex % filteredCarousel.length].root}
                    />
                  </CarouselItem>
                )}
              </AnimatePresence>
            </CarouselSection>
          </MainContent>

          <SponsorsSection>
            <SponsorGrid $gap={SPONSOR_CONFIG.gap}>
              {getBalancedSponsors().map((s, i) => (
                <SponsorLogo
                  key={i}
                  src={s.logoUrl}
                  alt={s.name}
                  $height={baseSponsorHeight * (SPONSOR_CONFIG.multipliers[s.tier] || 1)}
                />
              ))}
            </SponsorGrid>
          </SponsorsSection>
        </Container>
      )}
    </>
  );
}
