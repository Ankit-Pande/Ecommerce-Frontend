"use client";

import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { useAuthStore } from "@/store/auth-store";
import { getProfile } from "@/api/account";
import { restoreSession } from "@/api/http";
import { useUiSettings } from "@/store/ui-settings-store";

/**
 * Client-side setup for the whole app: colour theme plus reading the saved
 * login out of localStorage after mount (see the note in auth-store).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const language = useUiSettings((state) => state.language);
  const color = useUiSettings((state) => state.color);

  useEffect(() => {
    void useUiSettings.persist.rehydrate();
    Promise.resolve(useAuthStore.persist.rehydrate())
      .then(() => restoreSession())
      .then(async (loggedIn) => {
        const auth = useAuthStore.getState();
        if (!loggedIn) return auth.logout();
        // The saved role can be old (admin removed, user blocked), so the
        // admin panel is shown only for the role the backend returns now.
        const profile = await getProfile();
        auth.setUser(profile.phone, profile.role);
      })
      .catch(() => undefined)
      .finally(() => useAuthStore.getState().setHydrated());
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dataset.color = color;
  }, [color, language]);

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
