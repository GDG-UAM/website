import styled, { css } from "styled-components";

export type BrandColor = "blue" | "green" | "red" | "yellow" | "gray";

export const Section = styled.section`
  color: var(--google-dark-gray);
  padding: clamp(32px, 7vh, 60px) 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  min-height: 60svh;
`;

export const Header = styled.header`
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 clamp(16px, 3vw, 24px);
`;

export const Eyebrow = styled.p`
  font-weight: 600;
  font-size: 0.875rem;
  line-height: 1.2;
  color: var(--google-light-gray);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin: 0 0 6px 0;
`;

export const Grid = styled.div`
  max-width: 1100px;
  margin: 40px auto 0;
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: clamp(24px, 5vw, 60px);
  align-items: start;
  padding: 0 clamp(16px, 3vw, 24px);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const Copy = styled.div`
  p {
    margin: 0 0 14px 0;
    font-weight: 400;
    font-size: 1.05rem;
    line-height: 1.75;
  }
`;

export const Bullets = styled.ul`
  margin: 8px 0 16px 0;
  padding-left: 20px;
  color: var(--google-light-gray);
  li {
    margin: 4px 0;
  }
`;

export const Card = styled.article`
  border: 1px solid var(--color-gray-200);
  border-radius: 16px;
  padding: 36px 32px 20px;
  background: var(--color-white);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  position: relative;
  min-height: 220px;
  display: flex;
  flex-direction: column;
  margin-top: -25px;

  @media (max-width: 768px) {
    margin-top: 0;
  }
`;

export const Badge = styled.span<{ $visible?: boolean; $past?: boolean }>`
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 8px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.7rem;
  line-height: 1;
  background: color-mix(
    in oklab,
    var(--google-${({ $past }) => ($past ? "yellow" : "green")}),
    var(--color-white) 78%
  );
  color: var(--google-${({ $past }) => ($past ? "yellow" : "green")});
  border: 1px solid
    color-mix(
      in oklab,
      var(--google-${({ $past }) => ($past ? "yellow" : "green")}),
      var(--color-white) 50%
    );
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transform: translateY(${({ $visible }) => ($visible ? "0" : "-6px")});
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
  pointer-events: none;
`;

export const CardHeader = styled.header`
  margin-bottom: 10px;
`;

export const CardTitle = styled.h3`
  margin: 0 0 6px 0;
  font-weight: 800;
  font-size: clamp(1.25rem, 2.4vw, 1.6rem);
  line-height: 1.2;
`;

export const CardSubtitle = styled.p`
  margin: 0;
  color: var(--google-light-gray);
  font-weight: 500;
  font-size: 1rem;
  line-height: 1.45;
`;

export const Meta = styled.dl`
  margin: 12px 0;
`;

export const MetaRow = styled.div`
  display: block;
  & + & {
    margin-top: 8px;
  }
  dt {
    display: none;
  }
  dd {
    margin: 0;
    font-weight: 500;
    font-size: 1.05rem;
    line-height: 1.55;
  }
`;

export const Desc = styled.p`
  margin: 10px 0 16px 0;
  font-weight: 400;
  font-size: 1rem;
  line-height: 1.6;
`;

export const CardFooter = styled.footer`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: auto;
`;

export const Timeline = styled.div`
  max-width: 1100px;
  margin: 100px auto 0;
  position: relative;

  @media (max-width: 768px) {
    margin: 60px auto 0;
  }
`;

export const TimelinePadding = styled.div`
  padding: 20px 32px 8px;
`;

export const Axis = styled.div`
  position: relative;
  height: 42px;
  border-top: 2px solid var(--color-gray-200);
`;

export const Months = styled.div`
  position: relative;
  height: 100%;
`;

export const Tick = styled.i`
  display: block;
  width: 2px;
  height: 12px;
  background: var(--color-gray-200);
  border-radius: 1px;
  transform: translateY(3px);
`;

export const Month = styled.div`
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  text-align: center;
  font-weight: 700;
  font-size: 0.85rem;
  line-height: 1;
  color: var(--google-light-gray);
  display: flex;
  flex-direction: column;
  align-items: center;

  span {
    margin-top: 8px;
  }

  &[data-edge="true"] ${Tick} {
    transform: translateY(-1.5px);
    height: 16.5px;
    margin-bottom: -4.5px;
  }
`;

export const Cursor = styled.div`
  position: absolute;
  top: 0;
  height: 44px;
  transform: translateX(-50%);
  pointer-events: none;
  &::before {
    content: "";
    position: absolute;
    top: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 2px;
    height: 48px;
    background: var(--google-red);
    opacity: 0.9;
  }
`;

export const CursorLabel = styled.span`
  position: absolute;
  top: -28px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-white);
  border: 1px solid var(--color-gray-200);
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.7rem;
  line-height: 1;
  color: var(--google-red);
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
`;

export const Points = styled.ol`
  list-style: none;
  margin: 12px 0 0 0;
  padding: 0;
  position: absolute;
  left: 0;
  right: 0;
  top: -24px;
  height: 16px;
  pointer-events: none;
`;

export const PointItem = styled.li`
  /* Keep list items non-positioned so the button's absolute positioning
  uses the Points container as its containing block */
`;

const dotColor = (c: BrandColor) => {
  const col =
    c === "blue"
      ? "var(--google-blue)"
      : c === "green"
        ? "var(--google-green)"
        : c === "red"
          ? "var(--google-red)"
          : c === "yellow"
            ? "var(--google-yellow)"
            : "var(--google-dark-gray)";
  return css`
    color: ${col};
    background: var(--color-white);
    border: 2px solid ${col};
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  `;
};

export const PointButton = styled.button<{ $color: BrandColor }>`
  position: absolute;
  top: 0;
  transform: translate(-50%, 0) rotate(90deg);
  width: 12px;
  height: 12px;
  border-radius: 999px;
  cursor: pointer;
  color: currentColor;
  margin-top: 1.25px;
  ${(p) => dotColor(p.$color)};
  transition:
    transform 0.2s cubic-bezier(0.2, 0.8, 0.4, 1.2),
    box-shadow 0.2s ease;
  pointer-events: auto;

  &:hover {
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  }

  &[aria-selected="true"] {
    transform: translate(-50%, 0) scale(1.25);
    background: currentColor;
    border-color: transparent;
  }
`;

export const SrOnly = styled.span`
  position: absolute !important;
  height: 1px;
  width: 1px;
  overflow: hidden;
  clip: rect(1px, 1px, 1px, 1px);
  white-space: nowrap;
  border: 0;
  padding: 0;
  margin: -1px;
`;

export const DateText = styled.time`
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.45;
  letter-spacing: 0.01em;
  color: var(--google-blue);
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const LocationText = styled.time`
  color: var(--color-gray-600);
  display: flex;
  align-items: center;
  gap: 8px;
`;
