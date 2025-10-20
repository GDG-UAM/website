"use client";

import { PropsWithChildren } from "react";
import styled from "styled-components";

type StyledProps = { $color: string };

const CardContainer = styled.div<StyledProps>`
  background: var(--color-white);
  border-radius: 16px;
  padding: 0 32px 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease,
    border 0.3s ease;
  border: 2px solid transparent;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-8px);
    border: 2px solid ${({ $color }) => $color};
    box-shadow: 0 12px 32px ${({ $color }) => `color-mix(in srgb, ${$color} 20%, transparent)`};
  }

  @media (max-width: 768px) {
    &:hover {
      transform: none;
      box-shadow: 0 6px 12px ${({ $color }) => `color-mix(in srgb, ${$color} 20%, transparent)`};
    }
  }
`;

export type InfoCardProps = PropsWithChildren<{
  color: string;
  className?: string;
}>;

export default function InfoCard({ color, className, children }: InfoCardProps) {
  return (
    <CardContainer $color={color} className={className}>
      {children}
    </CardContainer>
  );
}
