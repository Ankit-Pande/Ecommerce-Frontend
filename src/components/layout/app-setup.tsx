"use client";

import { useEffect } from "react";
import { getProfile } from "@/api/account";
import { restoreSession } from "@/api/http";
import { useAuthStore } from "@/store/auth-store";
import { ACCENTS, useUiStore } from "@/store/ui-store";

// Runs once on load: restores the saved theme, language and login, then applies the theme colour.
export function AppSetup() {
  const accent = useUiStore((state) => state.accent);
  const language = useUiStore((state) => state.language);

  useEffect(() => {
    void useUiStore.persist.rehydrate();
    Promise.resolve(useAuthStore.persist.rehydrate())
      .then(() => (useAuthStore.getState().phone ? restoreSession() : false))
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
    const root = document.documentElement;
    root.style.setProperty(
      "--color-accent",
      ACCENTS[accent] ?? ACCENTS["#0B7A5C"],
    );
    root.lang = language;
  }, [accent, language]);

  return null;
}
