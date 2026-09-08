"use client";

import { useState } from "react";

type Theme = "light" | "dark";
const STORAGE_KEY = "theme";

function systemPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function readStoredTheme(): Theme | null {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : null;
}

function resolveInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return readStoredTheme() ?? (systemPrefersDark() ? "dark" : "light");
}

/**
 * No mount-time effect: the blocking script in layout.tsx already sets
 * data-theme on <html> before paint when a preference is stored, and CSS's
 * prefers-color-scheme media query handles the no-preference case on its
 * own. This component only needs to read the same source once for its own
 * label, and write the DOM/localStorage when the user actually toggles.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(resolveInitialTheme);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  const switchToLabel = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${switchToLabel} theme`}
      suppressHydrationWarning
      className="rounded border border-border px-2 py-1 text-xs text-text-muted hover:text-text-primary"
    >
      {theme === "dark" ? "Dark" : "Light"}
    </button>
  );
}
