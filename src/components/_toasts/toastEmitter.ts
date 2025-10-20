"use client";

import { ToastType } from "./ToastContext";

// Custom event-based toast system
class ToastEmitter extends EventTarget {
  emit(message: string, type: ToastType) {
    this.dispatchEvent(
      new CustomEvent("toast", {
        detail: { message, type }
      })
    );
  }
}

export const toastEmitter = new ToastEmitter();

// Global functions that can be called from anywhere
export const newErrorToast = (message: string) => {
  toastEmitter.emit(message, "error");
};

export const newInfoToast = (message: string) => {
  toastEmitter.emit(message, "info");
};

export const newSuccessToast = (message: string) => {
  toastEmitter.emit(message, "success");
};
