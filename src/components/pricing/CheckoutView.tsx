"use client";

import Link from "next/link";
import { CheckIcon } from "@/components/icons";
import { useI18n } from "@/lib/i18n/provider";
import { formatPrice } from "@/lib/pricing/format";
import {
  BILLINGS,
  getPlan,
  localize,
  planPrice,
  type Billing,
  type CheckoutPlanId,
} from "@/lib/pricing/plans";
import { checkoutHref, pricingHref } from "@/lib/pricing/query";
import { LegalLinks } from "./LegalLinks";
import { PayButton } from "./PayButton";
import { useSavingText } from "./PlanPrice";
import styles from "./Pricing.module.css";

interface CheckoutViewProps {
  plan: CheckoutPlanId;
  billing: Billing;
  /** The signed-in display name, or null for a guest. */
  viewerName: string | null;
}

export function CheckoutView({
  plan: planId,
  billing,
  viewerName,
}: CheckoutViewProps) {
  const { t, locale } = useI18n();
  const savingText = useSavingText();
  const plan = getPlan(planId);
  const inherited = plan.includes ? getPlan(plan.includes) : null;
  const amount = planPrice(plan, billing) ?? 0;
  const price = formatPrice(amount, locale);
  const saving = billing === "yearly" ? savingText(plan) : null;
  const period =
    billing === "yearly" ? t("pricing.perYear") : t("pricing.perMonth");

  return (
    <div className={styles.checkout}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("checkout.title")}</h1>
        <p className={styles.lede}>{t("checkout.lede")}</p>
      </header>

      <section
        className={styles.summary}
        aria-labelledby="checkout-summary"
        data-highlight={plan.highlight ? "true" : undefined}
      >
        <h2 id="checkout-summary" className={styles.sectionTitle}>
          {t("checkout.summary")}
        </h2>

        <dl className={styles.summaryList}>
          <dt>{t("checkout.plan")}</dt>
          <dd>
            {localize(plan.name, locale)}{" "}
            <Link href={pricingHref(billing)}>{t("checkout.changePlan")}</Link>
          </dd>

          <dt id="checkout-billing">{t("checkout.billing")}</dt>
          <dd>
            <div
              role="group"
              aria-labelledby="checkout-billing"
              className={styles.switch}
            >
              {BILLINGS.map((value) => (
                <Link
                  key={value}
                  href={checkoutHref(planId, value)}
                  replace
                  scroll={false}
                  className={styles.switchLink}
                  aria-current={value === billing ? "true" : undefined}
                >
                  {t(`pricing.billing.${value}`)}
                </Link>
              ))}
            </div>
          </dd>

          <dt>{t("checkout.price")}</dt>
          <dd>
            {price} {period}
            {saving ? <> · {saving}</> : null}
          </dd>

          <dt>{t("checkout.account")}</dt>
          <dd>
            {viewerName
              ? t("checkout.signedInAs", { name: viewerName })
              : t("checkout.signInNeeded")}
          </dd>
        </dl>

        <div className={styles.included}>
          <h3>{t("checkout.included")}</h3>
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

        <p className={styles.fine}>{t("pricing.plannedNote")}</p>
      </section>

      <div className={styles.checkoutActions}>
        <PayButton label={t("checkout.pay", { amount: price })} />
      </div>
      <p className={styles.fine}>
        {t("checkout.noDetails")} {t("pricing.smallPrint")}
      </p>

      <LegalLinks />
    </div>
  );
}
