"use client";

import { create } from "zustand";

type Toast = { id: number; message: string; type: "success" | "error" };

type ToastState = {
  toasts: Toast[];
  push: (message: string, type: Toast["type"]) => void;
  remove: (id: number) => void;
};

// Small messages at the bottom of the screen.
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  // Shows a message and hides it after 3.5 seconds.
  push: (message, type) => {
    const id = Date.now() + Math.random();
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(
      () =>
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id),
        })),
      3500,
    );
  },
  remove: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));

// Shows a green (success) or red (error) message from anywhere.
export const toast = {
  success: (message: string) =>
    useToastStore.getState().push(message, "success"),
  error: (message: string) => useToastStore.getState().push(message, "error"),
};
