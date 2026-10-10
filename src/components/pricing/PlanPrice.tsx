"use client";

import { useI18n } from "@/lib/i18n/provider";
import { formatPrice } from "@/lib/pricing/format";
import {
  planPrice,
  yearlySavings,
  type Billing,
  type Plan,
} from "@/lib/pricing/plans";
import styles from "./Pricing.module.css";

/** The saving for yearly billing as words, or null when there is none. */
export function useSavingText() {
  const { t, tn, locale } = useI18n();
  return (plan: Plan): string | null => {
    const savings = yearlySavings(plan);
    if (!savings) return null;
    return savings.monthsFree !== null
      ? tn("pricing.monthsFree", savings.monthsFree)
      : t("pricing.saveAmount", {
          amount: formatPrice(savings.amount, locale),
        });
  };
}

interface PlanPriceProps {
  plan: Plan;
  billing: Billing;
}

export function PlanPrice({ plan, billing }: PlanPriceProps) {
  const { t, locale } = useI18n();
  const amount = planPrice(plan, billing);
  if (amount === null) return null;
  return (
    <p className={styles.price}>
      <span className={styles.amount}>{formatPrice(amount, locale)}</span>
      <span className={styles.period}>
        {billing === "yearly" ? t("pricing.perYear") : t("pricing.perMonth")}
      </span>
    </p>
  );
}
