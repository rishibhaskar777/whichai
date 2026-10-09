import { useId } from "react";
import { useI18n } from "@/lib/i18n/provider";
import controls from "@/styles/controls.module.css";
import styles from "./NoMatchCard.module.css";

interface CoveredGoal {
  goalType: string;
  title: string;
  example: string;
}

interface NoMatchCardProps {
  goals: readonly CoveredGoal[];
  onChoose: (example: string) => void;
}

export function NoMatchCard({ goals, onChoose }: NoMatchCardProps) {
  const { t } = useI18n();
  const titleId = useId();

  return (
    <section className={styles.card} aria-labelledby={titleId}>
      <h1 id={titleId} className={styles.title}>
        {t("noMatch.title")}
      </h1>
      <p className={styles.text}>{t("noMatch.text")}</p>
      <ul className={styles.goals} aria-label={t("noMatch.goals")}>
        {goals.map((goal) => (
          <li key={goal.goalType}>
            <button
              type="button"
              className={`${controls.button} ${styles.goal}`}
              onClick={() => onChoose(goal.example)}
            >
              {goal.title}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
