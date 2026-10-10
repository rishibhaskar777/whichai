"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";
import { contactUrl } from "@/lib/links";
import {
  BILLINGS,
  cardPlans,
  getPlan,
  localize,
  pricedPlans,
  yearlySavings,
  type Billing,
  type PlanId,
} from "@/lib/pricing/plans";
import { pricingHref } from "@/lib/pricing/query";
import { CheckIcon } from "@/components/icons";
import controls from "@/styles/controls.module.css";
import content from "@/components/content/Content.module.css";
import { ComparisonTable } from "./ComparisonTable";
import { LegalLinks } from "./LegalLinks";
import { PlanCard } from "./PlanCard";
import styles from "./Pricing.module.css";

interface PricingViewProps {
  billing: Billing;
  currentPlan: PlanId;
}

const FAQ = [1, 2, 3, 4, 5] as const;

/** The months free that every paid plan shares, or null when they differ. */
function sharedMonthsFree(): number | null {
  const months = new Set(
    pricedPlans().map((plan) => yearlySavings(plan)?.monthsFree ?? null),
  );
  const [only] = [...months];
  return months.size === 1 && only !== undefined ? only : null;
}

export function PricingView({ billing, currentPlan }: PricingViewProps) {
  const { t, tn, locale } = useI18n();
  const institution = getPlan("institution");
  const months = sharedMonthsFree();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("pricing.title")}</h1>
        <p className={styles.lede}>{t("pricing.lede")}</p>

        <div className={styles.controls}>
          <div
            role="group"
            aria-label={t("pricing.billing.label")}
            className={styles.switch}
          >
            {BILLINGS.map((value) => (
              <Link
                key={value}
                href={pricingHref(value)}
                scroll={false}
                replace
                className={styles.switchLink}
                aria-current={value === billing ? "true" : undefined}
              >
                {t(`pricing.billing.${value}`)}
              </Link>
            ))}
          </div>
          {billing === "yearly" && months !== null ? (
            <p className={styles.yearlyNote}>
              {t("pricing.billing.yearlyNote", {
                saving: tn("pricing.monthsFree", months),
              })}
            </p>
          ) : null}
        </div>
      </header>

      <section aria-labelledby="pricing-plans">
        <h2 id="pricing-plans" className={styles.srOnly}>
          {t("pricing.plans.label")}
        </h2>
        <div className={styles.cardsWrap}>
          <ul className={styles.cards}>
            {cardPlans().map((plan) => (
              <li key={plan.id}>
                <PlanCard
                  plan={plan}
                  billing={billing}
                  currentPlan={currentPlan}
                />
              </li>
            ))}
          </ul>
        </div>
        <p className={styles.note}>{t("pricing.plannedNote")}</p>
        <p className={styles.note}>{t("pricing.smallPrint")}</p>
      </section>

      <section className={styles.institution} aria-labelledby="pricing-inst">
        <div className={styles.institutionText}>
          <h2 id="pricing-inst" className={styles.sectionTitle}>
            {localize(institution.name, locale)}
          </h2>
          <p className={styles.tagline}>
            {t("pricing.institution.audience")}.{" "}
            {t("pricing.institution.priceNote")}
          </p>
          <ul className={styles.featureList}>
            {institution.features.map((feature) => (
              <li key={feature.id}>
                <CheckIcon width="16" height="16" />
                <span>{localize(feature.name, locale)}</span>
              </li>
            ))}
          </ul>
        </div>
        <a
          href={contactUrl(
            t("pricing.institution.subject"),
            t("pricing.institution.body"),
          )}
          className={controls.button}
        >
          {t("pricing.contactUs")}
        </a>
      </section>

      <section aria-labelledby="pricing-table">
        <h2 id="pricing-table" className={styles.sectionTitle}>
          {t("pricing.table.title")}
        </h2>
        <ComparisonTable />
      </section>

      <section aria-labelledby="pricing-faq">
        <h2 id="pricing-faq" className={styles.sectionTitle}>
          {t("pricing.faq.title")}
        </h2>
        <div className={content.faq}>
          {FAQ.map((number) => (
            <details key={number}>
              <summary>{t(`pricing.faq.q${number}`)}</summary>
              <p>{t(`pricing.faq.a${number}`)}</p>
            </details>
          ))}
        </div>
      </section>

      <LegalLinks />
    </div>
  );
}
