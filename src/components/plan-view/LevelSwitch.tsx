import { useId } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { LEVELS, type Level } from "@/lib/schemas/plan";
import styles from "./LevelSwitch.module.css";

interface LevelSwitchProps {
  level: Level;
  onChange: (level: Level) => void;
}

export function LevelSwitch({ level, onChange }: LevelSwitchProps) {
  const { t } = useI18n();
  const name = useId();

  return (
    <div
      role="radiogroup"
      aria-label={t("plan.levelGroup")}
      className={styles.switch}
      data-level={level}
    >
      <span className={styles.indicator} aria-hidden="true" />
      {LEVELS.map((option) => (
        <label key={option} className={styles.option}>
          <input
            type="radio"
            name={name}
            value={option}
            checked={option === level}
            onChange={() => onChange(option)}
            className={styles.input}
          />
          <span className={styles.text}>{t(`level.${option}`)}</span>
        </label>
      ))}
    </div>
  );
}
