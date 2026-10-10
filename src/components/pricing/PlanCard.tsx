"use client";

import Link from "next/link";
import { CheckIcon } from "@/components/icons";
import { useI18n } from "@/lib/i18n/provider";
import {
  getPlan,
  isCheckoutPlan,
  localize,
  type Billing,
  type Plan,
  type PlanId,
} from "@/lib/pricing/plans";
import { checkoutHref } from "@/lib/pricing/query";
import controls from "@/styles/controls.module.css";
import { PlanPrice, useSavingText } from "./PlanPrice";
import styles from "./Pricing.module.css";

interface PlanCardProps {
  plan: Plan;
  billing: Billing;
  currentPlan: PlanId;
}

export function PlanCard({ plan, billing, currentPlan }: PlanCardProps) {
  const { t, locale } = useI18n();
  const savingText = useSavingText();
  const name = localize(plan.name, locale);
  const nameId = `plan-${plan.id}`;
  const saving = billing === "yearly" ? savingText(plan) : null;
  const inherited = plan.includes ? getPlan(plan.includes) : null;
  const isCurrent = plan.id === currentPlan;

  return (
    <article
      className={styles.card}
      aria-labelledby={nameId}
      data-highlight={plan.highlight ? "true" : undefined}
      data-current={isCurrent ? "true" : undefined}
    >
      <header className={styles.cardHeader}>
        <div className={styles.cardTitleRow}>
          <h3 id={nameId} className={styles.cardTitle}>
            {name}
          </h3>
          {plan.label ? (
            <span className={styles.badge}>{localize(plan.label, locale)}</span>
          ) : null}
        </div>
        <p className={styles.tagline}>{localize(plan.tagline, locale)}</p>
      </header>

      <div className={styles.priceBlock}>
        <PlanPrice plan={plan} billing={billing} />
        <p className={styles.saving}>{saving}</p>
      </div>

      <div className={styles.cardFeatures}>
        {inherited ? (
          <p className={styles.inherit}>
            {t("pricing.everythingIn", {
              plan: localize(inherited.name, locale),
            })}
          </p>
        ) : null}
        <ul className={styles.featureList}>
          {plan.features.map((feature) => (
            <li key={feature.id}>
              <CheckIcon width="16" height="16" />
              <span>{localize(feature.name, locale)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.cardAction}>
        {isCurrent ? (
          <button type="button" className={controls.button} disabled>
            {t("pricing.currentPlan")}
          </button>
        ) : isCheckoutPlan(plan.id) ? (
          <Link
            href={checkoutHref(plan.id, billing)}
            className={`${controls.button} ${plan.highlight ? controls.primary : ""}`}
          >
            {t("pricing.choose", { plan: name })}
          </Link>
        ) : null}
      </div>
    </article>
  );
}
