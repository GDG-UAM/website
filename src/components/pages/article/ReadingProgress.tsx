"use client";

import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";

// Styled components
const Wrapper = styled.nav`
  z-index: 30;
  display: none; /* hidden by default on small screens */

  @media (min-width: 1080px) {
    display: flex;
    align-items: center;
  }
`;

const Track = styled.div`
  position: relative;
  width: 12px; /* DOT column width; labels appear to its left */
  padding-left: 12px; /* space for labels to render on the left */
  margin-right: 6px;
  height: 100%;
  border-left: 2px solid var(--progress-track, #e5e7eb);
  border-radius: 8px;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: var(--progress-track-hover, #d1d5db);
  }
`;

const TrackFill = styled.div`
  position: absolute;
  left: -2px; /* align with border-left */
  top: 0; /* fill from top down */
  width: 2px;
  background: linear-gradient(
    to bottom,
    var(--progress-fill-start, #22c55e),
    var(--progress-fill-end, #16a34a)
  );
  border-radius: 2px;
  transition: height 0.1s linear;
`;

const DotsLayer = styled.div`
  position: absolute;
  inset: 8px 0; /* small top/bottom padding so first/last dot are not flush */
`;

const DotRow = styled.div`
  position: absolute;
  left: -6px; /* center the dot around the track line */
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 10px;

  /* Show label when focusing via keyboard */
  &:focus-within span {
    opacity: 1;
    transform: translateX(0) translateY(-50%);
  }

  &[data-active="true"] > button {
    background: var(--dot-active, #22c55e);
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
  }
`;

const Dot = styled.button`
  all: unset;
  cursor: pointer;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--dot, #9ca3af);
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.1s ease;

  &:hover {
    transform: scale(1.15);
    background: var(--dot-hover, #6b7280);
  }

  &:focus-visible {
    outline: 2px solid #22c55e;
    outline-offset: 2px;
  }
`;

const Label = styled.span`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateX(10px) translateY(-50%);
  opacity: 0;
  pointer-events: none;
  color: var(--label, #374151);
  background: var(--label-bg, #ffffff);
  border: 1px solid var(--label-border, #e5e7eb);
  padding: 4px 8px;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 240px;
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;

  /* Reveal labels when hovering the track */
  ${Track}:hover & {
    opacity: 1;
    transform: translateX(0) translateY(-50%);
  }
`;

type HeadingItem = {
  id: string;
  text: string;
  level: 1 | 2;
  el: HTMLElement;
  top: number; // absolute top in page coords
};

type Props = {
  containerRef: React.RefObject<HTMLElement | null>;
  pageContainerRef: React.RefObject<HTMLElement | null>;
  selector?: string;
  scrollOffset?: number;
  labelWidth?: number;
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function ReadingProgress({
  containerRef,
  pageContainerRef,
  selector = "h1, h2",
  scrollOffset = 80,
  labelWidth = 240
}: Props) {
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [progress, setProgress] = useState(0); // 0..1 along the full article
  const [activeIndex, setActiveIndex] = useState(0);
  const rafRef = useRef<number | null>(null);
  const [wrapperStyle, setWrapperStyle] = useState<React.CSSProperties>({});

  // Build heading list and ensure each has an id
  useEffect(() => {
    function build() {
      const root = containerRef.current;
      if (!root) return;

      const found = Array.from(root.querySelectorAll(selector)) as HTMLElement[];
      // Filter only h1 and h2
      const filtered = found.filter((el) => /H[12]/.test(el.tagName));
      if (filtered.length === 0) {
        setHeadings([]);
        return;
      }

      const usedIds = new Set<string>();
      const items: HeadingItem[] = filtered.map((el) => {
        let id = el.id?.trim();
        if (!id) {
          const base = slugify(el.textContent || "section");
          let candidate = base || "section";
          let i = 2;
          while (usedIds.has(candidate) || document.getElementById(candidate)) {
            candidate = `${base}-${i++}`;
          }
          id = candidate;
          el.id = id;
        }
        usedIds.add(id);
        // Provide some default scroll margin for fixed headers
        el.style.scrollMarginTop = `${scrollOffset}px`;
        const rect = el.getBoundingClientRect();
        const top = window.scrollY + rect.top;
        const level = el.tagName === "H1" ? 1 : 2;
        return { id, text: el.textContent || "", level, el, top };
      });

      setHeadings(items);
    }

    build();

    // Observe DOM changes in the container to rebuild headings when content updates
    const root = containerRef.current;
    if (!root) return;
    const observer = new MutationObserver(() => build());
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [containerRef, selector, scrollOffset]);

  // Update wrapper style based on page container position
  useEffect(() => {
    function updateStyle() {
      const pageEl = pageContainerRef.current;
      if (!pageEl) return;
      const rect = pageEl.getBoundingClientRect();
      const sectionTop = window.scrollY + rect.top;
      const sectionHeight = rect.height;
      const progressHeight = Math.min(sectionHeight - 120, window.innerHeight - 120);
      const progressTop = sectionTop + 40 + Math.max(0, (sectionHeight - 120 - progressHeight) / 2);
      setWrapperStyle({
        position: "fixed",
        right: `10px`,
        top: `${progressTop}px`,
        height: `${progressHeight}px`,
        maxHeight: `${progressHeight}px`
      });
    }
    updateStyle();
    window.addEventListener("resize", updateStyle);
    window.addEventListener("orientationchange", updateStyle);
    return () => {
      window.removeEventListener("resize", updateStyle);
      window.removeEventListener("orientationchange", updateStyle);
    };
  }, [pageContainerRef]);

  // Scroll listener to compute progress and active index
  useEffect(() => {
    const root = containerRef.current;
    if (!root || headings.length === 0) return;

    const onScroll = () => {
      if (rafRef.current != null) return; // throttle with rAF
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const articleRect = root.getBoundingClientRect();
        const articleTop = window.scrollY + articleRect.top;
        const articleBottom = articleTop + root.offsetHeight;
        const y = window.scrollY + scrollOffset; // reading cursor

        // Active section = last heading with top <= y
        let idx = -1;
        for (let i = 0; i < headings.length; i++) {
          if (headings[i].top - 1 <= y) idx = i;
        }
        setActiveIndex(idx);

        // Compute smooth progress across headings
        let pct = 0;
        if (headings.length === 1) {
          // Single section: based on article from first heading
          const denom = Math.max(1, articleBottom - headings[0].top);
          pct = clamp((y - headings[0].top) / denom, 0, 1);
        } else {
          const totalSections = headings.length - 1;
          const curr = headings[idx < 0 ? 0 : idx];
          const next = headings[(idx < 0 ? 0 : idx) + 1] ?? { top: articleBottom };
          const sectionSpan = Math.max(1, (next.top as number) - curr.top);
          const within = clamp((y - curr.top) / sectionSpan, 0, 1);
          pct = clamp(((idx < 0 ? 0 : idx) + within) / totalSections, 0, 1);
        }
        setProgress(pct);
      });
    };

    onScroll(); // initialize
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("orientationchange", onScroll);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("orientationchange", onScroll);
    };
  }, [containerRef, headings, scrollOffset]);

  const hasHeadings = headings.length > 0;
  if (!hasHeadings) return null;

  return (
    <Wrapper
      aria-hidden={false}
      role="navigation"
      aria-label="Reading progress"
      style={wrapperStyle}
    >
      <Track>
        <TrackFill style={{ height: `${progress * 100}%` }} />
        <DotsLayer>
          {headings.map((h, i) => {
            const n = Math.max(1, headings.length - 1);
            const topPct = headings.length === 1 ? 0 : (i / n) * 100;
            return (
              <DotRow key={h.id} data-active={i === activeIndex} style={{ top: `${topPct}%` }}>
                <Dot
                  aria-label={h.text}
                  title={h.text}
                  onClick={(e) => {
                    e.preventDefault();
                    const el = h.el;
                    if (!el) return;
                    const targetTop =
                      window.scrollY + el.getBoundingClientRect().top - scrollOffset;
                    window.scrollTo({ top: targetTop, behavior: "smooth" });
                  }}
                />
                <Label style={{ maxWidth: labelWidth }}>{h.text}</Label>
              </DotRow>
            );
          })}
        </DotsLayer>
      </Track>
    </Wrapper>
  );
}
