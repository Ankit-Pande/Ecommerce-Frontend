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

// Login state: access token in memory only; phone and role are saved for the next visit.
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
      partialize: (state) => ({ phone: state.phone, role: state.role }),
      merge: (saved, current) => {
        const { phone, role } = (saved ?? {}) as Partial<AuthState>;
        return { ...current, phone: phone ?? null, role: role ?? null };
      },
    },
  ),
);

// True for admins and the super admin.
export function isAdmin(role: UserRole | null) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}
