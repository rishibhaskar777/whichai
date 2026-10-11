"use client";

import { MoonIcon, SunIcon } from "@/components/icons";
import { useLocalData } from "@/components/local-data/LocalDataProvider";
import { useI18n } from "@/lib/i18n/provider";
import type { ThemeChoice } from "@/lib/theme";
import { revealTheme } from "@/lib/theme-transition";
import { useShownTheme } from "./use-theme-choice";
import { useTooltip } from "./use-tooltip";
import styles from "./SidebarContent.module.css";

interface ThemeToggleProps {
  initialTheme: ThemeChoice;
  collapsed: boolean;
}

/**
 * One click between light and dark. The icon is the mode you will switch to.
 * Settings keeps the System option, so a System choice flips to the opposite
 * of what is shown and becomes explicit.
 */
export function ThemeToggle({ initialTheme, collapsed }: ThemeToggleProps) {
  const { t } = useI18n();
  const { updateSettings } = useLocalData();
  const shown = useShownTheme(initialTheme);
  const next = shown === "dark" ? "light" : "dark";
  const label = t(
    next === "dark" ? "theme.switchToDark" : "theme.switchToLight",
  );
  const { targetRef, handlers, tip } = useTooltip(label, collapsed);

  return (
    <>
      <button
        ref={targetRef as React.RefObject<HTMLButtonElement>}
        type="button"
        className={styles.iconButton}
        aria-label={label}
        data-shown={shown}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          revealTheme(
            { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
            // updateSettings applies the theme before its first await.
            () => void updateSettings({ theme: next }),
          );
        }}
        {...handlers}
      >
        <MoonIcon className={styles.themeIcon} data-active={next === "dark"} />
        <SunIcon className={styles.themeIcon} data-active={next === "light"} />
      </button>
      {tip}
    </>
  );
}
