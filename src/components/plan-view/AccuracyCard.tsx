import { useId } from "react";
import { useI18n } from "@/lib/i18n/provider";
import {
  BUDGET_VALUES,
  budgetLabel,
  type Currency,
} from "@/lib/plan/budget-labels";
import type { Budget } from "@/lib/schemas/plan";
import controls from "@/styles/controls.module.css";
import styles from "./AccuracyCard.module.css";

export interface ToolOption {
  id: string;
  name: string;
}

interface AccuracyCardProps {
  tools: readonly ToolOption[];
  usedTools: ReadonlySet<string>;
  onToggleTool: (toolId: string) => void;
  budget: Budget | null;
  onBudgetChange: (budget: Budget) => void;
  currency: Currency;
}

export function AccuracyCard({
  tools,
  usedTools,
  onToggleTool,
  budget,
  onBudgetChange,
  currency,
}: AccuracyCardProps) {
  const i18n = useI18n();
  const { t } = i18n;
  const titleId = useId();
  const toolsLabelId = useId();
  const budgetName = useId();

  return (
    <section
      className={styles.card}
      aria-labelledby={titleId}
      data-print-hide=""
    >
      <h2 id={titleId} className={styles.title}>
        {t("accuracy.title")}
      </h2>
      <p className={styles.hint}>{t("accuracy.hint")}</p>

      <div
        role="group"
        aria-labelledby={toolsLabelId}
        className={styles.question}
      >
        <p id={toolsLabelId} className={styles.questionText}>
          {t("accuracy.toolsQuestion")}
        </p>
        <ul className={styles.options}>
          {tools.map((tool) => (
            <li key={tool.id}>
              <button
                type="button"
                className={styles.toggle}
                aria-pressed={usedTools.has(tool.id)}
                onClick={() => onToggleTool(tool.id)}
              >
                {tool.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <fieldset className={styles.question}>
        <legend className={styles.questionText}>
          {t("accuracy.budgetQuestion")}
        </legend>
        <div className={styles.options}>
          {BUDGET_VALUES.map((value) => (
            <label key={value} className={styles.radio}>
              <input
                type="radio"
                name={budgetName}
                value={value}
                checked={budget === value}
                onChange={() => onBudgetChange(value)}
                className={controls.srOnly}
              />
              <span>{budgetLabel(value, currency, i18n)}</span>
            </label>
          ))}
        </div>
        <p role="status" className={styles.note}>
          {budget === "zero" ? t("accuracy.zeroNote") : null}
        </p>
      </fieldset>
    </section>
  );
}
