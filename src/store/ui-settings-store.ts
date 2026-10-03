"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppLanguage = "en" | "hi";
export type AppColor = "blue" | "green" | "purple" | "orange";

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
      color: "blue",
      setLanguage: (language) => set({ language }),
      setColor: (color) => set({ color }),
    }),
    { name: "apnakart-ui-v2", skipHydration: true },
  ),
);
