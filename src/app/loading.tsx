"use client";

import React from "react";
import styled, { keyframes } from "styled-components";
import { useTranslations } from "next-intl";

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const Loader = styled.div`
  margin: 100px auto;
  width: 48px;
  height: 48px;
  border: 6px solid var(--loading-border);
  border-top: 6px solid var(--loading-border-top);
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
`;

const LoadingText = styled.div`
  margin-top: 16px;
  color: var(--loading-text);
  font-size: 1.2rem;
`;

const Loading: React.FC = () => {
  const t = useTranslations("loading");
  return (
    <LoadingContainer>
      <Loader />
      <LoadingText>{t("text")}</LoadingText>
    </LoadingContainer>
  );
};

export default Loading;
