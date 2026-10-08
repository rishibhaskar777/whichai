import { useId } from "react";
import { CopyButton } from "@/components/copy-button/CopyButton";
import type { PlanLevel } from "@/lib/schemas/plan";
import styles from "./PlanView.module.css";

export function Overview({ level }: { level: PlanLevel }) {
  const titleId = useId();
  return (
    <section className={styles.section} aria-labelledby={titleId}>
      <h3 id={titleId} className={styles.sectionTitle}>
        Overview
      </h3>
      <p className={styles.summary}>{level.summary}</p>
      <dl className={styles.overviewFacts}>
        <div>
          <dt>Estimated cost</dt>
          <dd>{level.estimatedCost}</dd>
        </div>
        <div>
          <dt>Estimated time</dt>
          <dd>{level.estimatedTime}</dd>
        </div>
      </dl>
    </section>
  );
}

export function TierBlock({
  tiers,
}: {
  tiers: NonNullable<PlanLevel["tiers"]>;
}) {
  const titleId = useId();
  return (
    <section className={styles.section} aria-labelledby={titleId}>
      <h3 id={titleId} className={styles.sectionTitle}>
        {tiers.toolName} plans for this goal
      </h3>
      <ul className={styles.tiers}>
        {tiers.tiers.map((tier) => (
          <li key={tier.name} className={styles.tier}>
            <h4 className={styles.tierName}>{tier.name}</h4>
            <p>{tier.forThisGoal}</p>
          </li>
        ))}
      </ul>
      <p className={styles.upgradeLine}>
        <strong>Start free.</strong> Upgrade only if {tiers.upgradeTrigger}.
      </p>
    </section>
  );
}

export function Workflow({ steps }: { steps: PlanLevel["workflow"] }) {
  const titleId = useId();
  return (
    <section className={styles.section} aria-labelledby={titleId}>
      <h3 id={titleId} className={styles.sectionTitle}>
        Workflow
      </h3>
      <ol className={styles.steps}>
        {steps.map((step) => (
          <li key={step.title} className={styles.step}>
            <p className={styles.stepTitle}>{step.title}</p>
            <p className={styles.stepDetail}>{step.detail}</p>
            {step.examplePrompt ? (
              <div className={styles.prompt}>
                <p className={styles.promptText}>{step.examplePrompt}</p>
                <CopyButton
                  text={step.examplePrompt}
                  label="Copy example prompt"
                />
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}

export function StarterBrief({ brief }: { brief: string }) {
  const titleId = useId();
  return (
    <section className={styles.section} aria-labelledby={titleId}>
      <div className={styles.briefHeader}>
        <h3 id={titleId} className={styles.sectionTitle}>
          Starter brief
        </h3>
        <CopyButton text={brief} label="Copy starter brief" />
      </div>
      <p className={styles.hint}>
        Fill in the brackets, then paste this into your AI assistant to begin.
      </p>
      <pre className={styles.brief}>{brief}</pre>
    </section>
  );
}

export function CheckTheFacts({ text }: { text: string }) {
  const titleId = useId();
  return (
    <aside className={styles.facts} aria-labelledby={titleId}>
      <h3 id={titleId} className={styles.factsTitle}>
        Check the facts
      </h3>
      <p>{text}</p>
    </aside>
  );
}

interface BulletSectionProps {
  title: string;
  items: readonly string[];
}

export function BulletSection({ title, items }: BulletSectionProps) {
  const titleId = useId();
  return (
    <section className={styles.section} aria-labelledby={titleId}>
      <h3 id={titleId} className={styles.sectionTitle}>
        {title}
      </h3>
      <ul className={styles.bullets}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
