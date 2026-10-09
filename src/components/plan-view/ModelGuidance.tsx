import { useI18n } from "@/lib/i18n/provider";
import type { ModelGuidance as ModelGuidanceData } from "@/lib/schemas/plan";
import styles from "./JobCard.module.css";

export function ModelGuidance({ guidance }: { guidance: ModelGuidanceData }) {
  const { t } = useI18n();
  const sentence = (step: ModelGuidanceData["steps"][number]) =>
    step.effort
      ? t("models.stepEffort", {
          task: step.task,
          modelClass: step.modelClass,
          effort: step.effort,
        })
      : t("models.step", { task: step.task, modelClass: step.modelClass });
  const classes = new Map(
    guidance.steps.map((step) => [step.modelClass, step.useFor]),
  );

  return (
    <div className={styles.models}>
      <p className={styles.modelsLabel}>{t("models.label")}</p>
      <p>{guidance.steps.map(sentence).join(" ")}</p>
      <p className={styles.modelsNote}>{t("models.note")}</p>
      <details className={styles.modelsMore}>
        <summary>{t("models.explain")}</summary>
        <dl>
          {[...classes].map(([modelClass, useFor]) => (
            <div key={modelClass}>
              <dt>{modelClass}</dt>
              <dd>{useFor}</dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  );
}
