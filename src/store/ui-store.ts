"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage } from "@/api/assistant";

export const ACCENTS = {
  "#0B7A5C": "11 122 92",
  "#1D4ED8": "29 78 216",
  "#B4235A": "180 35 90",
  "#7A4B00": "122 75 0",
} as const;

export type Accent = keyof typeof ACCENTS;

type UiState = {
  accent: Accent;
  language: "en" | "hi";
  menuOpen: boolean;
  sideHidden: boolean;
  chatOpen: boolean;
  chatMessages: ChatMessage[];
  setAccent: (accent: Accent) => void;
  toggleLanguage: () => void;
  setMenuOpen: (menuOpen: boolean) => void;
  setSideHidden: (sideHidden: boolean) => void;
  setChatOpen: (chatOpen: boolean) => void;
  setChatMessages: (chatMessages: ChatMessage[]) => void;
};

// Theme colour, language, open drawers and the assistant chat (colour and language are saved).
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      accent: "#0B7A5C",
      language: "en",
      menuOpen: false,
      sideHidden: false,
      chatOpen: false,
      chatMessages: [],
      setAccent: (accent) => set({ accent }),
      toggleLanguage: () =>
        set((state) => ({ language: state.language === "en" ? "hi" : "en" })),
      setMenuOpen: (menuOpen) => set({ menuOpen }),
      setSideHidden: (sideHidden) => set({ sideHidden }),
      setChatOpen: (chatOpen) => set({ chatOpen }),
      setChatMessages: (chatMessages) => set({ chatMessages }),
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
