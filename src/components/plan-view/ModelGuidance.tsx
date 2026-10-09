import type { ModelGuidance as ModelGuidanceData } from "@/lib/schemas/plan";
import styles from "./JobCard.module.css";

function sentence(step: ModelGuidanceData["steps"][number]): string {
  const effort = step.effort ? `, ${step.effort} effort` : "";
  return `For ${step.task}: ${step.modelClass} model${effort}.`;
}

export function ModelGuidance({ guidance }: { guidance: ModelGuidanceData }) {
  const classes = new Map(
    guidance.steps.map((step) => [step.modelClass, step.useFor]),
  );

  return (
    <div className={styles.models}>
      <p className={styles.modelsLabel}>Which model to pick</p>
      <p>{guidance.steps.map(sentence).join(" ")}</p>
      <p className={styles.modelsNote}>
        Model names change. Check the tool&apos;s model picker and choose the
        closest match.
      </p>
      <details className={styles.modelsMore}>
        <summary>What do these mean?</summary>
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
