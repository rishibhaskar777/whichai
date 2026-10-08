"use client";

import {
  useId,
  useSyncExternalStore,
  type ComponentType,
  type SVGProps,
} from "react";
import { MonitorIcon, MoonIcon, SunIcon } from "@/components/icons";
import {
  THEME_COOKIE,
  parseTheme,
  type Theme,
  type ThemeChoice,
} from "@/lib/theme";
import styles from "./ThemeControl.module.css";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

const OPTIONS: readonly {
  value: ThemeChoice;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}[] = [
  { value: "system", label: "System", Icon: MonitorIcon },
  { value: "light", label: "Light", Icon: SunIcon },
  { value: "dark", label: "Dark", Icon: MoonIcon },
];

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

function applyChoice(choice: ThemeChoice) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  if (choice === "system") {
    delete document.documentElement.dataset.theme;
    document.cookie = `${THEME_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
    return;
  }
  const theme: Theme = choice;
  document.documentElement.dataset.theme = theme;
  document.cookie = `${THEME_COOKIE}=${theme}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax${secure}`;
}

interface ThemeControlProps {
  initialChoice: ThemeChoice;
  compact: boolean;
}

export function ThemeControl({ initialChoice, compact }: ThemeControlProps) {
  const choice = useSyncExternalStore(
    subscribe,
    readChoice,
    () => initialChoice,
  );
  const name = useId();

  return (
    <fieldset className={styles.group} data-compact={compact}>
      <legend className={styles.srOnly}>Theme</legend>
      {OPTIONS.map(({ value, label, Icon }) => (
        <label key={value} className={styles.option}>
          <input
            type="radio"
            name={name}
            value={value}
            className={styles.input}
            checked={choice === value}
            onChange={() => applyChoice(value)}
          />
          <span className={styles.face} title={label}>
            <Icon width="16" height="16" />
            <span className={compact ? styles.srOnly : undefined}>{label}</span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
