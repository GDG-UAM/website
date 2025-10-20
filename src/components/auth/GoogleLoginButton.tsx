"use client";

import { useState } from "react";
import styled from "styled-components";
import { signIn } from "next-auth/react";

type Size = "sm" | "md";

export interface GoogleLoginButtonProps {
  label: string;
  callbackUrl?: string;
  size?: Size;
  fullWidth?: boolean;
  disabled?: boolean;
}

export default function GoogleLoginButton({
  label,
  callbackUrl,
  size = "md",
  fullWidth = false,
  disabled
}: GoogleLoginButtonProps) {
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    try {
      setLoading(true);
      const cb = callbackUrl || (typeof window !== "undefined" ? window.location.href : "/");
      await signIn("google", { callbackUrl: cb, redirect: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      $size={size}
      $fullWidth={fullWidth}
    >
      {loading ? <Spinner /> : <GoogleIcon />}
      {label}
    </Button>
  );
}

const Button = styled.button<{ $size: Size; $fullWidth: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: ${({ $fullWidth }) => ($fullWidth ? "100%" : "auto")};
  padding: ${({ $size }) => ($size === "sm" ? "8px 12px" : "12px 24px")};
  border: 2px solid var(--auth-login-button-border);
  border-radius: 8px;
  background: var(--auth-login-button-bg);
  color: var(--auth-login-button-text);
  font-size: ${({ $size }) => ($size === "sm" ? "14px" : "16px")};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    border-color: var(--auth-login-button-border-hover);
    box-shadow: 0 2px 8px var(--auth-login-button-shadow);
  }

  &:focus-visible {
    outline: none;
    border-color: var(--auth-login-button-border-hover);
    box-shadow: 0 0 0 2px var(--auth-login-button-shadow);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const GoogleIcon = styled.div`
  width: 20px;
  height: 20px;
  background-image: url("data:image/svg+xml,%3Csvg width='18' height='18' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M17.6 9.2l-.1-1.8H9v3.4h4.8C13.6 12 13 13 12 13.6v2.2h3A8.8 8.8 0 0 0 17.6 9.2z' fill='%234285F4'/%3E%3Cpath d='M9 18c2.4 0 4.5-.8 6-2.2l-3-2.2a5.4 5.4 0 0 1-8-2.9H1V13a9 9 0 0 0 8 5z' fill='%2334A853'/%3E%3Cpath d='M4 10.7a5.4 5.4 0 0 1 0-3.4V5H1a9 9 0 0 0 0 8l3-2.3z' fill='%23FBBC05'/%3E%3Cpath d='M9 3.6c1.3 0 2.5.4 3.4 1.3L15 2.3A9 9 0 0 0 1 5l3 2.4c.8-2.2 3-3.8 5-3.8z' fill='%23EA4335'/%3E%3C/g%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
`;

const Spinner = styled.div`
  width: 20px;
  height: 20px;
  box-sizing: border-box;
  border: 2px solid var(--auth-login-loading-spinner-border);
  border-top: 2px solid var(--auth-login-loading-spinner-border-top);
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;
