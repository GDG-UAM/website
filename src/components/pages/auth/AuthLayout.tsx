"use client";

import styled from "styled-components";

const AuthContainer = styled.div`
  min-height: 75vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--auth-layout-bg);
  padding: 20px;
`;

const AuthCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 48px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  max-width: 420px;
  width: 100%;
  text-align: center;

  @media (max-width: 480px) {
    padding: 32px 24px;
    margin: 16px;
  }
`;

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthContainer>
      <AuthCard>{children}</AuthCard>
    </AuthContainer>
  );
}
