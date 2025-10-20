"use client";

import React from "react";
import styled, { css, keyframes } from "styled-components";
import Link from "next/link";

const shimmer = keyframes`
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
`;

const Card = styled.div<{ $skeleton?: boolean }>`
  background-color: var(--color-white);
  border-radius: 8px;
  transition:
    background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-width: 350px;
  min-width: 275px;
  height: 100%;
  cursor: ${({ $skeleton }) => ($skeleton ? "default" : "pointer")};
  position: relative;
  padding: 0;
  margin: auto;
  border: 1px var(--color-gray-200) solid;

  ${({ $skeleton }) =>
    !$skeleton &&
    css`
      &:hover {
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15) !important;
      }
    `}
`;

const Content = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: 8px;
  background: transparent;
  margin: 0;
  border-radius: 0 0 32px 32px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100%;
`;

const Top = styled.div<{ $skeleton?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  ${({ $skeleton }) =>
    $skeleton &&
    css`
      display: grid;
      gap: 6px;
      > div {
        height: 16px;
        border-radius: 6px;
        background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
        background-size: 400% 100%;
        animation: ${shimmer} 1.4s ease infinite;
      }
    `}
`;

const Title = styled.h3<{ $skeleton?: boolean }>`
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  transition: color 0.3s ease;
  padding: 0;
  ${({ $skeleton }) =>
    $skeleton &&
    css`
      display: grid;
      gap: 6px;
      > div {
        height: 20px;
        border-radius: 6px;
        background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
        background-size: 400% 100%;
        animation: ${shimmer} 1.4s ease infinite;
      }
    `}
`;

const Meta = styled.div`
  display: flex;
  color: var(--color-gray-500);
  font-size: 0.9rem;
  margin-top: 2px;
  font-weight: 400;
  transition: color 0.3s ease;
  padding: 0;
  gap: 8px;
`;

const Bottom = styled.div<{ $skeleton?: boolean }>`
  margin-bottom: 24px;
  ${({ $skeleton }) =>
    $skeleton &&
    css`
      display: grid;
      gap: 6px;
      > div {
        height: 12px;
        border-radius: 6px;
        background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
        background-size: 400% 100%;
        animation: ${shimmer} 1.4s ease infinite;
      }
    `}
`;

const Status = styled.span`
  font-size: 12px;
  color: #555;
  &.active {
    color: var(--google-green);
  }
  &.paused {
    color: var(--google-yellow);
  }
`;

const CalendarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="18px"
    viewBox="0 -960 960 960"
    width="18px"
    fill="currentColor"
  >
    <path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Z" />
  </svg>
);

type GiveawayCardProps = {
  href?: string;
  title?: string;
  description?: string;
  joinedAtNode?: React.ReactNode;
  statusLabel?: string;
  statusClass?: string;
  skeleton?: boolean;
};

export function GiveawayCard({
  href = "#",
  title,
  description,
  joinedAtNode,
  statusLabel,
  statusClass,
  skeleton
}: GiveawayCardProps) {
  return (
    <Card $skeleton={skeleton}>
      <Link
        href={href}
        style={{
          textDecoration: "none",
          height: "100%",
          pointerEvents: skeleton ? "none" : "auto"
        }}
      >
        <Content style={{ justifyContent: "space-between" }}>
          <Top $skeleton={skeleton}>
            <Title $skeleton={skeleton}>
              {skeleton ? (
                <>
                  <div style={{ width: "80%" }} />
                </>
              ) : (
                title
              )}
            </Title>
            {skeleton ? (
              <>
                <div style={{ marginTop: 12 }} />
                <div style={{ width: "90%" }} />
              </>
            ) : description ? (
              <Meta>{description}</Meta>
            ) : null}
          </Top>
          <Bottom $skeleton={skeleton}>
            {skeleton ? (
              <>
                <div style={{ width: "70%", marginBottom: 4 }} />
                <div style={{ width: "20%", height: 10, marginBottom: -2 }} />
                <span style={{ width: 0, height: 0 }} />
              </>
            ) : (
              <>
                <Meta>
                  <CalendarIcon />
                  <span>{joinedAtNode}</span>
                </Meta>
                {statusLabel ? <Status className={statusClass}>{statusLabel}</Status> : null}
              </>
            )}
          </Bottom>
        </Content>
      </Link>
    </Card>
  );
}
