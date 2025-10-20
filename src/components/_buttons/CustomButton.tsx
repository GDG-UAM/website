"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@heroui/button";
import type { PressEvent as HeroUIPressEvent } from "@heroui/button";
import styled, { keyframes } from "styled-components";
import Tooltip from "@mui/material/Tooltip";
import { useButtonContext } from "./ButtonProvider";
import { useTranslations } from "next-intl";

export type PressEvent = HeroUIPressEvent;

// Define a styled component for the button to apply custom styles
const StyledButton = styled(Button)<{
  iconSize: number;
  $holdProgress: number;
  $buttonColor: string;
  $hoverColor?: string;
  $noBackground?: boolean;
  $borderRadius?: number;
  $canClick: boolean;
  $hasBorder: boolean;
  $isSlim: boolean;
  $disableHover: boolean;
  $fullWidth: boolean;
}>`
  background-color: ${({ $noBackground, $buttonColor }) =>
    $noBackground ? "transparent" : `color-mix(in srgb, ${$buttonColor}, transparent 92.5%)`};
  min-width: ${({ iconSize }) => iconSize * 2}px;
  ${({ $fullWidth }) => $fullWidth && `width: 100%;`}
  height: fit-content;
  min-height: ${({ $isSlim, iconSize }) => ($isSlim ? iconSize : iconSize * 2)}px;
  color: ${({ $buttonColor }) => $buttonColor};
  gap: ${({ iconSize }) => iconSize / 2}px;
  padding: ${({ $isSlim, iconSize }) =>
    $isSlim ? `${iconSize / 2.5}px ${iconSize / 2}px` : `${iconSize / 2}px`};
  border: ${({ $hasBorder, $buttonColor }) =>
    $hasBorder ? `3px color-mix(in srgb, ${$buttonColor}, transparent 75%) solid` : "none"};
  border-radius: ${({ $borderRadius }) => $borderRadius}px;
  box-sizing: border-box;
  font-weight: 600;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  pointer-events: ${({ $canClick }) => ($canClick ? "auto" : "none")};
  transition:
    background-color 0.2s ease-in-out,
    border-radius 0.2s ease-in-out;

  ${({ $disableHover, $noBackground, $buttonColor }) =>
    !$disableHover &&
    `
    &:not(:disabled):hover {
      background-color: ${
        $noBackground
          ? `color-mix(in srgb, ${$buttonColor}, transparent 95%)`
          : `color-mix(in srgb, ${$buttonColor}, transparent 87.5%)`
      };
    }
  `}

  .nextui-ripple {
    display: none !important;
  }

  & .nextui-button-icon {
    color: currentColor;
  }

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: ${({ $holdProgress }) => $holdProgress}%;
    height: 100%;
    background-color: color-mix(in srgb, ${({ $buttonColor }) => $buttonColor}, transparent 75%);
    transition: width 0.1s linear;
    z-index: 1;
  }

  & > svg {
    position: relative;
    z-index: 2;
    transition: fill 0.2s ease-in-out;
  }

  ${({ $disableHover, $hoverColor }) =>
    !$disableHover && $hoverColor
      ? `
        &:hover > svg {
          fill: ${$hoverColor};
          color: ${$hoverColor};
        }
      `
      : ""}
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const getColor = (color: string, isDisabled: boolean) => {
  let baseColor;
  switch (color) {
    case "primary":
      baseColor = "var(--button-primary-bg)";
      break;
    case "secondary":
      baseColor = "var(--button-secondary-bg)";
      break;
    case "success":
      baseColor = "var(--button-success-bg)";
      break;
    case "warning":
      baseColor = "var(--button-warning-bg)";
      break;
    case "danger":
      baseColor = "var(--button-danger-bg)";
      break;
    default:
      baseColor = "var(--button-default-bg)";
  }
  return isDisabled ? `color-mix(in srgb, ${baseColor}, transparent 50%)` : baseColor;
};

const CustomSpinner = styled.div<{ size: number; color: string }>`
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-left-color: ${({ color }) => getColor(color, false)};
  border-radius: 50%;
  box-sizing: border-box;
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  animation: ${spin} 1s linear infinite;
  position: relative;
  z-index: 2;
`;

export const DEFAULT_CONFIRMATION_TIME = 750;
export type CustomButtonColor =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger";

export interface CustomButtonProps {
  onClick?: (event?: PressEvent) => Promise<void> | void;
  path?: string;
  isPathElement?: boolean;
  id?: string;
  color?: CustomButtonColor;
  ariaLabel?: string;
  tooltip?: React.ReactNode | string;
  disabled?: boolean;
  isLoading?: boolean;
  showSpinner?: boolean;
  confirmationDuration?: number;
  className?: string;
  iconSize?: number;
  viewBox?: string;
  hoverColor?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  noBackground?: boolean;
  borderRadius?: number;
  hasBorder?: boolean;
  slim?: boolean;
  noHover?: boolean;
  fullWidth?: boolean;
  dontUseContext?: boolean;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  onClick,
  path,
  isPathElement = false,
  id,
  color = "default",
  ariaLabel,
  tooltip,
  disabled = false,
  isLoading = false,
  showSpinner = false,
  confirmationDuration = 0,
  className,
  iconSize = 24,
  viewBox = "0 -960 960 960",
  hoverColor,
  style,
  noBackground = false,
  borderRadius = 8,
  hasBorder,
  slim = false,
  noHover = false,
  fullWidth = false,
  dontUseContext = false,
  children = null
}) => {
  const [loading, setLoading] = useState(isLoading);
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { disableAll, setDisableAll } = useButtonContext();
  const disableAllEffective = dontUseContext ? false : disableAll;

  const t = useTranslations("buttons");

  const needsConfirmation = confirmationDuration > 0;

  const endHold = useCallback(() => {
    setIsHolding(false);
    setHoldProgress(0);
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const executeClick = useCallback(
    async (event?: PressEvent) => {
      endHold();
      if (showSpinner) {
        setLoading(true);
      }
      setDisableAll(true);
      try {
        const result = onClick?.(event);
        if (result instanceof Promise) {
          await result;
        }
      } finally {
        if (showSpinner) {
          setLoading(false);
        }
        setDisableAll(false);
      }
    },
    [endHold, onClick, showSpinner, setDisableAll]
  );

  const startHold = useCallback(() => {
    if (disabled || loading || disableAllEffective || !needsConfirmation) return;

    setIsHolding(true);
    setHoldProgress(0);

    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      const progress = Math.min((elapsedTime / confirmationDuration) * 100, 100);
      setHoldProgress(progress);

      if (progress === 100) {
        clearInterval(progressIntervalRef.current!);
        if (holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }
        executeClick();
      }
    }, 50);

    holdTimerRef.current = setTimeout(() => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (isHolding) {
        executeClick();
      }
    }, confirmationDuration);
  }, [
    disabled,
    loading,
    disableAllEffective,
    needsConfirmation,
    confirmationDuration,
    isHolding,
    executeClick
  ]);

  const handlePress = (event?: PressEvent) => {
    if (!needsConfirmation) {
      executeClick(event);
    } else {
      setShowTooltip(true);
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
      tooltipTimeoutRef.current = setTimeout(() => {
        setShowTooltip(false);
      }, 1000);
    }
  };

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  const isActuallyDisabled = disabled || loading || disableAllEffective;
  const buttonColor = getColor(color, isActuallyDisabled);

  const realHasBorder = hasBorder !== undefined ? hasBorder : noBackground;

  const buttonEl = (
    <StyledButton
      id={id}
      isIconOnly={!children}
      aria-label={ariaLabel}
      isDisabled={isActuallyDisabled}
      onPressStart={startHold}
      onPressEnd={endHold}
      onPress={handlePress}
      className={className}
      disableRipple
      iconSize={iconSize}
      viewBox={viewBox}
      style={style}
      $holdProgress={holdProgress}
      $buttonColor={disabled ? "var(--button-disabled-bg)" : buttonColor}
      $hoverColor={hoverColor}
      $noBackground={noBackground}
      $borderRadius={borderRadius}
      $canClick={!!onClick}
      $hasBorder={realHasBorder}
      $isSlim={slim}
      $disableHover={noHover}
      $fullWidth={fullWidth}
    >
      {loading && showSpinner ? (
        <>
          <CustomSpinner size={iconSize} color={color} />
          {children}
        </>
      ) : path ? (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height={`${iconSize}px`}
            viewBox={viewBox}
            width={`${iconSize}px`}
            fill={disabled ? "var(--button-disabled-bg)" : buttonColor}
          >
            {isPathElement ? <g dangerouslySetInnerHTML={{ __html: path }} /> : <path d={path} />}
          </svg>
          {children}
        </>
      ) : (
        <>{children}</>
      )}
    </StyledButton>
  );

  // Hold-to-confirm tooltip takes precedence. If not active, use provided tooltip when available.
  if (showTooltip || tooltip) {
    const controlledProps = showTooltip ? { open: true } : {};
    return (
      <Tooltip
        title={showTooltip ? t("tooltip.keepPressed") : (tooltip ?? "")}
        placement="top"
        arrow
        {...controlledProps}
      >
        {buttonEl}
      </Tooltip>
    );
  }

  return buttonEl;
};
