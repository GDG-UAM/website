import styled from "styled-components";

export const HeroRoot = styled.section<{ $suppressAnimation: boolean }>`
  position: relative;
  min-height: calc(100svh - var(--navbar-height, 68px));
  display: flex;
  justify-content: center;
  overflow: hidden;
  background: transparent;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  ${({ $suppressAnimation }) =>
    $suppressAnimation &&
    `
    * {
      transition: none !important;
      animation-duration: 0s !important;
      animation-delay: 0s !important;
      animation-iteration-count: 1 !important;
      animation-play-state: paused !important;
      animation-fill-mode: both !important;
      scroll-behavior: auto !important;
    }
  `}
`;

export const Lockup = styled.div`
  text-align: center;
  max-width: 960px;
  padding-inline: 16px;
  opacity: 0;
  transform: translateY(8px) scale(0.985);
  animation: reveal 0.7s ease-out 0.1s forwards;
  margin-top: -40px;

  animation-delay: 0.2s;

  @keyframes reveal {
    to {
      opacity: 1;
      transform: translateY(-30) scale(1);
    }
  }
`;

export const TitleWrap = styled.span`
  display: inline-block;
  line-height: 1.02;
  --stagger: 35ms;

  .letter {
    display: inline-block;
    opacity: 0;
    transform: translateY(6px);
    will-change: transform, opacity, color;
    animation: letterInOther 800ms ease forwards;
  }

  .letter[data-i] {
    animation-delay: calc(var(--stagger) * var(--i, 0));
  }

  .letter.c0 {
    color: var(--google-blue);
  }
  .letter.c1 {
    color: var(--google-red);
  }
  .letter.c2 {
    color: var(--google-yellow);
  }
  .letter.c3 {
    color: var(--google-green);
  }

  .google .gletter {
    display: inline-block;
    opacity: 0;
    transform: translateY(6px);
    animation:
      letterInGoogle 1000ms ease forwards,
      googleBump 250ms ease 950ms both,
      googleToBlack 400ms ease 1600ms forwards;
  }

  .google .gletter[data-i] {
    animation-delay:
      calc(var(--stagger) * var(--i, 0)), calc(var(--stagger) * var(--i, 0) + 950ms),
      calc(var(--stagger) * var(--i, 0) + 1600ms);
  }

  .google .gletter[data-i="0"] {
    --brand: var(--google-blue);
  }
  .google .gletter[data-i="1"] {
    --brand: var(--google-red);
  }
  .google .gletter[data-i="2"] {
    --brand: var(--google-yellow);
  }
  .google .gletter[data-i="3"] {
    --brand: var(--google-blue);
  }
  .google .gletter[data-i="4"] {
    --brand: var(--google-green);
  }
  .google .gletter[data-i="5"] {
    --brand: var(--google-red);
  }

  @keyframes letterInOther {
    0% {
      opacity: 0;
      transform: translateY(6px);
    }
    70% {
      opacity: 1;
    }
    100% {
      opacity: 1;
      transform: translateY(0);
      color: var(--color-gray-900);
    }
  }

  @keyframes letterInGoogle {
    0% {
      opacity: 0;
      transform: translateY(6px);
      color: var(--google-blue);
    }
    33% {
      color: var(--google-red);
    }
    66% {
      color: var(--google-yellow);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
      color: var(--brand);
    }
  }

  @keyframes googleBump {
    0% {
      transform: translateY(0) scale(1);
    }
    60% {
      transform: translateY(-1px) scale(1.06);
    }
    100% {
      transform: translateY(0) scale(1);
    }
  }

  @keyframes googleToBlack {
    0% {
      color: var(--brand);
    }
    100% {
      color: var(--color-gray-900);
    }
  }
`;

export const AfterTitle = styled.div`
  opacity: 0;
  transform: translateY(6px);
  animation: afterIn 500ms ease forwards;
  animation-delay: 2100ms;

  @keyframes afterIn {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export const ColorUnderline = styled.span`
  display: block;
  height: 6px;
  border-radius: 999px;
  margin: 16px auto 0;
  width: 0%;
  background: linear-gradient(
    90deg,
    var(--google-blue) 0%,
    var(--google-blue) 5%,
    var(--google-red) 5%,
    var(--google-red) 10%,
    var(--google-yellow) 10%,
    var(--google-yellow) 15%,
    var(--google-green) 15%,
    var(--google-green) 20%,
    var(--google-blue) 20%,
    var(--google-blue) 40%,
    var(--google-red) 40%,
    var(--google-red) 60%,
    var(--google-yellow) 60%,
    var(--google-yellow) 80%,
    var(--google-green) 80%,
    var(--google-green) 100%
  );
  background-size: 500% 100%;
  background-position: 100% 0;
  animation:
    grow 900ms ease-out 200ms forwards,
    colorReveal 900ms ease-in-out 400ms forwards;

  @keyframes grow {
    to {
      width: 320px;
    }
  }

  @keyframes colorReveal {
    to {
      background-position: 0 0;
    }
  }

  @media (max-width: 480px) {
    @keyframes grow {
      to {
        width: 220px;
      }
    }
  }
`;

export const PillDots = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;

  & span {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }
  & span:nth-of-type(1) {
    background: var(--google-blue);
  }
  & span:nth-of-type(2) {
    background: var(--google-red);
  }
  & span:nth-of-type(3) {
    background: var(--google-yellow);
  }
  & span:nth-of-type(4) {
    background: var(--google-green);
  }
`;

export const ScrollHint = styled.div`
  position: absolute;
  left: 50%;
  bottom: 16px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0;
  color: var(--google-light-gray);

  @keyframes floatY {
    0%,
    100% {
      transform: translate(-50%, 0);
    }
    50% {
      transform: translate(-50%, -6px);
    }
  }
`;

export const Container = styled.div`
  max-width: 1200px;
  display: flex;
  align-items: center;
`;

export const MainTitle = styled.h1`
  font-weight: 900;
  letter-spacing: -0.6px;
  line-height: 1.02;

  font-size: clamp(2rem, 8.5vw, 4.8rem);
  margin-top: 48px;
  margin-bottom: 32px;
  line-height: 1.1;
  letter-spacing: normal;
`;

export const Subtitle = styled.h2`
  margin-top: 8px;
  font-weight: 600;
  color: var(--color-gray-500);
  font-size: 18px;

  @media (min-width: 900px) {
    font-size: 24px;
  }
`;

export const Description = styled.p`
  margin-top: 20px;
  margin-inline: auto;
  max-width: 760px;
  color: var(--google-light-gray);
  font-size: 16px;
  line-height: 1.65;

  @media (min-width: 900px) {
    font-size: 18px;
  }
`;

export const ButtonStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: center;
  margin-top: 28px;

  @media (min-width: 600px) {
    flex-direction: row;
  }
`;

export const TitleWord = styled.span`
  display: inline-block;
`;
