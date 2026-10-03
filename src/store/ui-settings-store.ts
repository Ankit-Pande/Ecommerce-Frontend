"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppLanguage = "en" | "hi";
export type AppColor = "slate" | "teal" | "purple" | "orange";

type UiSettings = {
  language: AppLanguage;
  color: AppColor;
  setLanguage: (language: AppLanguage) => void;
  setColor: (color: AppColor) => void;
};

export const useUiSettings = create<UiSettings>()(
  persist(
    (set) => ({
      language: "en",
      color: "slate",
      setLanguage: (language) => set({ language }),
      setColor: (color) => set({ color }),
    }),
    { name: "apnakart-ui", skipHydration: true },
  ),
);
