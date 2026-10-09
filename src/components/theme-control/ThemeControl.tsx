"use client";

import {
  useId,
  useSyncExternalStore,
  type ComponentType,
  type SVGProps,
} from "react";
import { MonitorIcon, MoonIcon, SunIcon } from "@/components/icons";
import { useLocalData } from "@/components/local-data/LocalDataProvider";
import { useI18n } from "@/lib/i18n/provider";
import { parseTheme, type ThemeChoice } from "@/lib/theme";
import styles from "./ThemeControl.module.css";

const OPTIONS: readonly {
  value: ThemeChoice;
  label: "theme.system" | "theme.light" | "theme.dark";
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}[] = [
  { value: "system", label: "theme.system", Icon: MonitorIcon },
  { value: "light", label: "theme.light", Icon: SunIcon },
  { value: "dark", label: "theme.dark", Icon: MoonIcon },
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
  const { t } = useI18n();
  const { updateSettings } = useLocalData();
  const name = useId();

  return (
    <fieldset className={styles.group} data-compact={compact}>
      <legend className={styles.srOnly}>{t("theme.label")}</legend>
      {OPTIONS.map(({ value, label, Icon }) => (
        <label key={value} className={styles.option}>
          <input
            type="radio"
            name={name}
            value={value}
            className={styles.input}
            checked={choice === value}
            onChange={() => void updateSettings({ theme: value })}
          />
          <span className={styles.face} title={t(label)}>
            <Icon width="16" height="16" />
            <span className={compact ? styles.srOnly : undefined}>
              {t(label)}
            </span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
