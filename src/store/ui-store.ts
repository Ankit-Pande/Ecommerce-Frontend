"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Theme colours: name -> "r g b" for the --color-accent variable.
export const ACCENTS = {
  "#0B7A5C": "11 122 92",
  "#1D4ED8": "29 78 216",
  "#B4235A": "180 35 90",
  "#7A4B00": "122 75 0",
} as const;

export type Accent = keyof typeof ACCENTS;
export type Language = "en" | "hi";

type UiState = {
  accent: Accent;
  language: Language;
  chatOpen: boolean;
  setAccent: (accent: Accent) => void;
  toggleLanguage: () => void;
  setChatOpen: (chatOpen: boolean) => void;
};

// Accent colour and header language (saved), and whether the assistant is open.
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      accent: "#0B7A5C",
      language: "en",
      chatOpen: false,
      setAccent: (accent) => set({ accent }),
      toggleLanguage: () =>
        set((state) => ({ language: state.language === "en" ? "hi" : "en" })),
      setChatOpen: (chatOpen) => set({ chatOpen }),
    }),
    {
      name: "apnakart-ui",
      skipHydration: true,
      partialize: (state) => ({
        accent: state.accent,
        language: state.language,
      }),
    },
  ),
);
