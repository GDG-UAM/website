"use client";

import React, { useEffect, useCallback } from "react";
import styled, { keyframes } from "styled-components";
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from "react-icons/fa";

type ToastType = "success" | "error" | "info";

export interface ToastProps {
  id: number;
  message: string;
  type: ToastType;
  onClose: (id: number) => void;
  isClosing?: boolean;
}

const toastIcons = {
  success: <FaCheckCircle />,
  error: <FaExclamationCircle />,
  info: <FaInfoCircle />
};

const toastColors = {
  success: "var(--toast-success-bg)",
  error: "var(--toast-error-bg)",
  info: "var(--toast-info-bg)"
};

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const ToastContainer = styled.div<{ type: ToastType; $isClosing?: boolean }>`
  display: flex;
  align-items: center;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 8px;
  color: white;
  background-color: color-mix(in srgb, ${({ type }) => toastColors[type]}, transparent 25%);
  border: 3px solid ${({ type }) => toastColors[type]};
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  animation: ${fadeIn} 0.3s ease-in-out;
  max-width: 320px;
  transition: all 0.4s ease-in-out;
  opacity: ${({ $isClosing }) => ($isClosing ? 0 : 1)};
  max-height: ${({ $isClosing }) => ($isClosing ? "0" : "1000px")};
  padding-top: ${({ $isClosing }) => ($isClosing ? 0 : "10px")};
  padding-bottom: ${({ $isClosing }) => ($isClosing ? 0 : "10px")};
  margin-bottom: ${({ $isClosing }) => ($isClosing ? 0 : "10px")};
  overflow: hidden;
`;

const IconWrapper = styled.div`
  margin-right: 10px;
  font-size: 1.5em;
  display: flex;
  justify-content: center;
`;

const Message = styled.div`
  font-size: 1em;
  flex-grow: 1;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.2em;
  cursor: pointer;
  margin-left: 10px;
  padding: 5px;
  line-height: 1;
  display: flex;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background-color: rgba(0, 0, 0, 0.15);
  }
`;

const Toast: React.FC<ToastProps> = ({ id, message, type, onClose, isClosing }) => {
  const handleClose = useCallback(() => {
    onClose(id);
  }, [id, onClose]);

  useEffect(() => {
    const timer = setTimeout(handleClose, 5000);
    return () => clearTimeout(timer);
  }, [handleClose]);

  return (
    <ToastContainer type={type} $isClosing={isClosing}>
      <IconWrapper>{toastIcons[type]}</IconWrapper>
      <Message>{message}</Message>
      <CloseButton onClick={handleClose}>
        <FaTimes />
      </CloseButton>
    </ToastContainer>
  );
};

export default Toast;
