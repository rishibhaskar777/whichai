import { useId } from "react";
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
  const titleId = useId();

  return (
    <section className={styles.card} aria-labelledby={titleId}>
      <h1 id={titleId} className={styles.title}>
        We don&apos;t have a plan for this goal yet
      </h1>
      <p className={styles.text}>
        Nothing we cover matches what you wrote, and we won&apos;t guess. For
        now we can plan the goals below. Tap one, or describe something else.
      </p>
      <ul className={styles.goals} aria-label="Goals we cover">
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
