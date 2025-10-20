"use client";

import React, { useState, useCallback, useEffect } from "react";
import { ToastContext, ToastType } from "./ToastContext";
import Toast, { ToastProps } from "./Toast";
import styled from "styled-components";
import { toastEmitter } from "./toastEmitter";

interface ToastState extends Omit<ToastProps, "onClose"> {
  id: number;
  isClosing?: boolean;
}

const ToastContainerWrapper = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now();
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);
  }, []);

  // Listen for toast events
  useEffect(() => {
    const handleToastEvent = (event: CustomEvent) => {
      const { message, type } = event.detail;
      addToast(message, type);
    };

    toastEmitter.addEventListener("toast", handleToastEvent as EventListener);

    return () => {
      toastEmitter.removeEventListener("toast", handleToastEvent as EventListener);
    };
  }, [addToast]);

  const removeToast = useCallback((id: number) => {
    setToasts((prevToasts) =>
      prevToasts.map((toast) => (toast.id === id ? { ...toast, isClosing: true } : toast))
    );

    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    }, 400);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainerWrapper>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={removeToast} />
        ))}
      </ToastContainerWrapper>
    </ToastContext.Provider>
  );
};
