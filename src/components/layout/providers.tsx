"use client";

import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { useAuthStore } from "@/store/auth-store";
import { getProfile } from "@/api/account";
import { restoreSession } from "@/api/http";

// Sets up the theme and restores the saved login once on load.
export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    Promise.resolve(useAuthStore.persist.rehydrate())
      .then(() => restoreSession())
      .then(async (loggedIn) => {
        const auth = useAuthStore.getState();
        if (!loggedIn) return auth.logout();
        const profile = await getProfile();
        auth.setUser(profile.phone, profile.role);
      })
      .catch(() => undefined)
      .finally(() => useAuthStore.getState().setHydrated());
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
