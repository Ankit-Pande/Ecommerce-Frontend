"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserRole } from "@/lib/types";

type AuthState = {
  accessToken: string | null;
  phone: string | null;
  role: UserRole | null;
  hydrated: boolean;
  setAccessToken: (accessToken: string) => void;
  setUser: (phone: string, role: UserRole) => void;
  setHydrated: () => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      phone: null,
      role: null,
      hydrated: false,
      setAccessToken: (accessToken) => set({ accessToken }),
      setUser: (phone, role) => set({ phone, role }),
      setHydrated: () => set({ hydrated: true }),
      logout: () => set({ accessToken: null, phone: null, role: null }),
    }),
    {
      name: "auth",
      skipHydration: true,
      partialize: (s) => ({
        phone: s.phone,
        role: s.role,
      }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<AuthState>;
        return {
          ...current,
          phone: saved.phone ?? null,
          role: saved.role ?? null,
        };
      },
    },
  ),
);

// True for admin and super admin.
export function isAdmin(role: UserRole | null): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}
