"use client";

import { MoonIcon, SunIcon } from "@/components/icons";
import { THEME_COOKIE, type Theme } from "@/lib/theme";
import styles from "./ThemeToggle.module.css";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function currentTheme(): Theme {
  const chosen = document.documentElement.dataset.theme;
  if (chosen === "light" || chosen === "dark") return chosen;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${THEME_COOKIE}=${theme}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax${secure}`;
}

interface ThemeToggleProps {
  showLabel: boolean;
}

export function ThemeToggle({ showLabel }: ThemeToggleProps) {
  return (
    <button
      type="button"
      className={styles.toggle}
      aria-label="Switch between light and dark theme"
      onClick={() => applyTheme(currentTheme() === "dark" ? "light" : "dark")}
    >
      <span className={styles.icons}>
        <SunIcon className={styles.sun} />
        <MoonIcon className={styles.moon} />
      </span>
      {showLabel ? <span>Theme</span> : null}
    </button>
  );
}
