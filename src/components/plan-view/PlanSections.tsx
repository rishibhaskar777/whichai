import { useId } from "react";
import { CopyButton } from "@/components/copy-button/CopyButton";
import { useI18n } from "@/lib/i18n/provider";
import type { PlanLevel } from "@/lib/schemas/plan";
import styles from "./PlanView.module.css";

export function Overview({ level }: { level: PlanLevel }) {
  const { t } = useI18n();
  const titleId = useId();
  return (
    <section className={styles.section} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.sectionTitle}>
        {t("plan.overview")}
      </h2>
      <p className={styles.summary}>{level.summary}</p>
      <dl className={styles.overviewFacts}>
        <div>
          <dt>{t("plan.estimatedCost")}</dt>
          <dd>{level.estimatedCost}</dd>
        </div>
        <div>
          <dt>{t("plan.estimatedTime")}</dt>
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
  const { t } = useI18n();
  const titleId = useId();
  return (
    <section className={styles.section} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.sectionTitle}>
        {t("plan.tiersTitle", { tool: tiers.toolName })}
      </h2>
      <ul className={styles.tiers}>
        {tiers.tiers.map((tier) => (
          <li key={tier.name} className={styles.tier}>
            <h3 className={styles.tierName}>{tier.name}</h3>
            <p>{tier.forThisGoal}</p>
          </li>
        ))}
      </ul>
      <p className={styles.upgradeLine}>
        <strong>{t("plan.startFree")}</strong>{" "}
        {t("plan.upgradeOnlyIf", { trigger: tiers.upgradeTrigger })}
      </p>
    </section>
  );
}

export function Workflow({ steps }: { steps: PlanLevel["workflow"] }) {
  const { t } = useI18n();
  const titleId = useId();
  return (
    <section className={styles.section} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.sectionTitle}>
        {t("plan.workflow")}
      </h2>
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
                  label={t("plan.copyPrompt")}
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
  const { t } = useI18n();
  const titleId = useId();
  return (
    <section className={styles.section} aria-labelledby={titleId}>
      <div className={styles.briefHeader}>
        <h2 id={titleId} className={styles.sectionTitle}>
          {t("plan.starterBrief")}
        </h2>
        <CopyButton text={brief} label={t("plan.copyBrief")} />
      </div>
      <p className={styles.hint}>{t("plan.starterBriefHint")}</p>
      <pre className={styles.brief}>{brief}</pre>
    </section>
  );
}

export function CheckTheFacts({ text }: { text: string }) {
  const { t } = useI18n();
  const titleId = useId();
  return (
    <aside className={styles.facts} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.factsTitle}>
        {t("plan.checkFacts")}
      </h2>
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
      <h2 id={titleId} className={styles.sectionTitle}>
        {title}
      </h2>
      <ul className={styles.bullets}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
