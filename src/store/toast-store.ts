"use client";

import { create } from "zustand";

const AUTO_DISMISS_MS = 3500;

type Toast = { id: number; message: string; type: "success" | "error" };

type ToastState = {
  toasts: Toast[];
  push: (message: string, type: Toast["type"]) => void;
  remove: (id: number) => void;
};

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, type) => {
    const id = Date.now() + Math.random();
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(
      () => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      AUTO_DISMISS_MS,
    );
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (message: string) =>
    useToastStore.getState().push(message, "success"),
  error: (message: string) => useToastStore.getState().push(message, "error"),
};
