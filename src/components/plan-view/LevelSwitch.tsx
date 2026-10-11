import { useId } from "react";
import { LockedControl } from "@/components/entitlements/LockedControl";
import { useI18n } from "@/lib/i18n/provider";
import { LEVELS, type Level } from "@/lib/schemas/plan";
import styles from "./LevelSwitch.module.css";

interface LevelSwitchProps {
  level: Level;
  onChange: (level: Level) => void;
  /** Levels this person cannot use. They show a lock and lead to /pricing. */
  locked?: readonly Level[];
}

export function LevelSwitch({
  level,
  onChange,
  locked = [],
}: LevelSwitchProps) {
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
      {LEVELS.map((option) =>
        locked.includes(option) ? (
          <LockedControl
            key={option}
            requirement="paid"
            className={`${styles.option} ${styles.lockedOption}`}
          >
            <span className={styles.text}>{t(`level.${option}`)}</span>
          </LockedControl>
        ) : (
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
        ),
      )}
    </div>
  );
}
