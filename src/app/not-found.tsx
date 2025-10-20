"use client";

import styled from "styled-components";
import { useTranslations } from "next-intl";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--not-found-bg);
  height: 100%;
`;

const Title = styled.h1`
  font-size: 3rem;
  color: var(--not-found-title-text);
  margin-bottom: 0.5rem;
  margin-top: 0;
`;

const Message = styled.p`
  font-size: 1.25rem;
  color: var(--not-found-message-text);
  margin: 0;
`;

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <Container>
      <Title>{t("title")}</Title>
      <Message>{t("message")}</Message>
    </Container>
  );
}
