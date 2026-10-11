"use client";

import { useSyncExternalStore } from "react";
import { parseTheme, type Theme } from "@/lib/theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

function systemMedia(): MediaQueryList | null {
  return typeof window.matchMedia === "function"
    ? window.matchMedia(DARK_QUERY)
    : null;
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  const media = systemMedia();
  media?.addEventListener("change", onChange);
  return () => {
    observer.disconnect();
    media?.removeEventListener("change", onChange);
  };
}

function readShown(): Theme {
  const explicit = parseTheme(document.documentElement.dataset.theme);
  if (explicit) return explicit;
  return systemMedia()?.matches ? "dark" : "light";
}

/**
 * The theme the page is showing right now, whether it was chosen or comes
 * from the system. The server only knows an explicit choice.
 */
export function useShownTheme(initialChoice: Theme | "system"): Theme {
  return useSyncExternalStore(subscribe, readShown, () =>
    initialChoice === "dark" ? "dark" : "light",
  );
}
