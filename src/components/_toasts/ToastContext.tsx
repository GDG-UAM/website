"use client";

import { createContext } from "react";

export type ToastType = "success" | "error" | "info";

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);
