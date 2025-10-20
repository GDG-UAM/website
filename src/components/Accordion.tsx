"use client";

import React, { useId, useMemo, useState } from "react";
import styled from "styled-components";
import { ChevronDownButton } from "@/components/Buttons";

const Item = styled.div`
  border-radius: 12px;
  background: var(--color-white);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  padding: 14px 16px;
  cursor: pointer;
  background: transparent;
  border: none;

  &:focus {
    outline: none;
  }
`;

const Title = styled.div`
  color: var(--google-blue);
  font-weight: 600;
`;

const PanelWrapper = styled.div<{ $open: boolean }>`
  display: grid;
  grid-template-rows: ${({ $open }) => ($open ? "1fr" : "0fr")};
  transition: grid-template-rows 0.28s ease;
`;

const PanelContent = styled.div<{ $open: boolean }>`
  overflow: hidden;
  padding: ${({ $open }) => ($open ? "12px 16px 18px 16px" : "0 16px")};
  transition: padding 0.28s ease;
  color: var(--google-dark-gray);
  background: transparent;
  border-top: ${({ $open }) =>
    $open ? "1px solid var(--color-gray-200)" : "1px solid transparent"};
`;

const Chevron = styled.span<{ $open: boolean }>`
  display: inline-block;
  transform: rotate(${({ $open }) => ($open ? "180deg" : "0deg")});
  transition: transform 0.18s ease;
`;

type AccordionProps = {
  title: React.ReactNode;
  children: React.ReactNode;
  id?: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const Accordion: React.FC<AccordionProps> = ({
  title,
  children,
  id,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange
}) => {
  const reactId = useId();
  const regionId = useMemo(() => id ?? `acc-panel-${reactId}`, [id, reactId]);
  const headingId = useMemo(() => `acc-header-${reactId}`, [reactId]);
  const chevronBtnId = useMemo(() => `acc-chevron-${reactId}`, [reactId]);

  const [uncontrolledOpen, setUncontrolledOpen] = useState<boolean>(defaultOpen);
  const open = controlledOpen ?? uncontrolledOpen;

  const toggle = () => {
    const next = !open;
    if (controlledOpen === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  const triggerChevronClick = () => {
    const el = typeof document !== "undefined" ? document.getElementById(chevronBtnId) : null;
    el?.click();
  };

  return (
    <Item>
      <Header
        id={headingId}
        aria-controls={regionId}
        aria-expanded={open}
        role="button"
        tabIndex={0}
        onClick={triggerChevronClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            triggerChevronClick();
          }
        }}
      >
        <Title>{title}</Title>
        <Chevron $open={open} aria-hidden>
          <ChevronDownButton
            id={chevronBtnId}
            noBackground
            hasBorder={false}
            slim
            color="primary"
            noHover
            onClick={() => toggle()}
          />
        </Chevron>
      </Header>
      <PanelWrapper id={regionId} role="region" aria-labelledby={headingId} $open={open}>
        <PanelContent $open={open}>{children}</PanelContent>
      </PanelWrapper>
    </Item>
  );
};

export default Accordion;
