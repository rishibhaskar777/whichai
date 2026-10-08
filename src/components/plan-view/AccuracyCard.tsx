import { useId } from "react";
import controls from "@/styles/controls.module.css";
import styles from "./AccuracyCard.module.css";

export type Budget = "zero" | "under-1000" | "1000-3000" | "more";

const BUDGET_OPTIONS: readonly { value: Budget; label: string }[] = [
  { value: "zero", label: "₹0" },
  { value: "under-1000", label: "Under ₹1,000" },
  { value: "1000-3000", label: "₹1,000 to ₹3,000" },
  { value: "more", label: "More" },
];

interface AccuracyCardProps {
  tools: readonly string[];
  usedTools: ReadonlySet<string>;
  onToggleTool: (toolName: string) => void;
  budget: Budget | null;
  onBudgetChange: (budget: Budget) => void;
}

export function AccuracyCard({
  tools,
  usedTools,
  onToggleTool,
  budget,
  onBudgetChange,
}: AccuracyCardProps) {
  const titleId = useId();
  const toolsLabelId = useId();
  const budgetName = useId();

  return (
    <section className={styles.card} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.title}>
        Make this more accurate
      </h2>
      <p className={styles.hint}>
        Optional. Your answers stay on this page and are not sent anywhere.
      </p>

      <div
        role="group"
        aria-labelledby={toolsLabelId}
        className={styles.question}
      >
        <p id={toolsLabelId} className={styles.questionText}>
          Which of these do you already use?
        </p>
        <ul className={styles.options}>
          {tools.map((tool) => (
            <li key={tool}>
              <button
                type="button"
                className={styles.toggle}
                aria-pressed={usedTools.has(tool)}
                onClick={() => onToggleTool(tool)}
              >
                {tool}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <fieldset className={styles.question}>
        <legend className={styles.questionText}>Monthly budget?</legend>
        <div className={styles.options}>
          {BUDGET_OPTIONS.map((option) => (
            <label key={option.value} className={styles.radio}>
              <input
                type="radio"
                name={budgetName}
                value={option.value}
                checked={budget === option.value}
                onChange={() => onBudgetChange(option.value)}
                className={controls.srOnly}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        <p role="status" className={styles.note}>
          {budget === "zero"
            ? "Showing only free alternatives. Free plans have limits, so check them on the official page."
            : null}
        </p>
      </fieldset>
    </section>
  );
}
