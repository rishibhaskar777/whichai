import { useId } from "react";
import { LEVELS, type Level } from "@/lib/schemas/plan";
import styles from "./LevelSwitch.module.css";

export const LEVEL_LABELS: Record<Level, string> = {
  simple: "Simple",
  polished: "Polished",
  advanced: "Advanced",
};

interface LevelSwitchProps {
  level: Level;
  onChange: (level: Level) => void;
}

export function LevelSwitch({ level, onChange }: LevelSwitchProps) {
  const name = useId();

  return (
    <div
      role="radiogroup"
      aria-label="Plan level"
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
          <span className={styles.text}>{LEVEL_LABELS[option]}</span>
        </label>
      ))}
    </div>
  );
}
