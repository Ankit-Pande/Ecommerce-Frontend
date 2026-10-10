"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

// Switches between light and dark theme.
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Use light theme" : "Use dark theme"}
      className="icon-button"
    >
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
