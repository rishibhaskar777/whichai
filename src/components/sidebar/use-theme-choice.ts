"use client";

import { useSyncExternalStore } from "react";
import { parseTheme, type ThemeChoice } from "@/lib/theme";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function readChoice(): ThemeChoice {
  return parseTheme(document.documentElement.dataset.theme) ?? "system";
}

/** The theme choice on the page, following changes made anywhere. */
export function useThemeChoice(initialChoice: ThemeChoice): ThemeChoice {
  return useSyncExternalStore(subscribe, readChoice, () => initialChoice);
}
