"use client";

import { useMemo } from "react";
import styled from "styled-components";

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: var(--global-error-bg);
  color: var(--global-error-text);
`;

const ErrorTitle = styled.h1`
  font-size: 2rem;
  margin-bottom: 1rem;
`;

const ErrorMessage = styled.p`
  font-size: 1.2rem;
`;

function GlobalError({ error }: { error?: Error }) {
  // Fallback i18n without NextIntl context (global error can render outside providers)
  const locale = useMemo(() => {
    if (typeof document === "undefined") return "es";
    const match = document.cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("NEXT_LOCALE="));
    return match?.split("=")[1] || "es";
  }, []);

  const messages = {
    en: { title: "Something went wrong", unexpected: "An unexpected error has occurred." },
    es: { title: "Algo salió mal", unexpected: "Ha ocurrido un error inesperado." }
  } as const;

  const m = messages[locale === "en" ? "en" : "es"];

  return (
    <ErrorContainer>
      <ErrorTitle>{m.title}</ErrorTitle>
      <ErrorMessage>{error?.message || m.unexpected}</ErrorMessage>
    </ErrorContainer>
  );
}

export default GlobalError;
