"use client";

import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { useAuthStore } from "@/store/auth-store";
import { getProfile } from "@/api/account";
import { restoreSession } from "@/api/http";
import { ACCENTS, useUiStore } from "@/store/ui-store";

// Sets the light theme and accent colour, and restores the saved login once on load.
export function Providers({ children }: { children: React.ReactNode }) {
  const accent = useUiStore((state) => state.accent);
  const language = useUiStore((state) => state.language);

  useEffect(() => {
    void useUiStore.persist.rehydrate();
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

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--color-accent",
      ACCENTS[accent] ?? ACCENTS["#0B7A5C"],
    );
    document.documentElement.lang = language;
  }, [accent, language]);

  return (
    <ThemeProvider attribute="class" forcedTheme="light">
      {children}
    </ThemeProvider>
  );
}
