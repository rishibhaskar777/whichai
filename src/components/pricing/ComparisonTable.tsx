"use client";

import { CheckIcon } from "@/components/icons";
import { useI18n } from "@/lib/i18n/provider";
import { buildComparison, localize } from "@/lib/pricing/plans";
import styles from "./Pricing.module.css";

/**
 * Every feature against every plan. On narrow screens each row becomes a small
 * block and the plan name is repeated beside its value.
 */
export function ComparisonTable() {
  const { t, formatNumber, locale } = useI18n();
  const { plans, features, limits } = buildComparison();
  const columns = plans.length + 1;

  return (
    <table className={styles.table}>
      <caption className={styles.srOnly}>{t("pricing.table.title")}</caption>
      <thead>
        <tr>
          <th scope="col">{t("pricing.table.feature")}</th>
          {plans.map((plan) => (
            <th
              key={plan.id}
              scope="col"
              data-highlight={plan.highlight ? "true" : undefined}
            >
              {localize(plan.name, locale)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {features.map((row) => (
          <tr key={row.id}>
            <th scope="row">
              <span className={styles.rowName}>
                {localize(row.name, locale)}
              </span>
              <span className={styles.rowHelp}>
                {localize(row.description, locale)}
              </span>
            </th>
            {plans.map((plan, index) => (
              <td key={plan.id}>
                <span className={styles.cellPlan}>
                  {localize(plan.name, locale)}
                </span>
                {row.included[index] ? (
                  <span className={styles.cellValue}>
                    <CheckIcon width="16" height="16" />
                    <span className={styles.srOnly}>
                      {t("pricing.table.included")}
                    </span>
                  </span>
                ) : (
                  <span className={styles.cellValue}>
                    <span aria-hidden="true">–</span>
                    <span className={styles.srOnly}>
                      {t("pricing.table.notIncluded")}
                    </span>
                  </span>
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
      {limits.length > 0 ? (
        <tbody>
          <tr>
            <th scope="colgroup" colSpan={columns} className={styles.group}>
              {t("pricing.table.limits")}
            </th>
          </tr>
          {limits.map((row) => (
            <tr key={row.id}>
              <th scope="row">
                <span className={styles.rowName}>
                  {localize(row.label, locale)}
                </span>
              </th>
              {plans.map((plan, index) => {
                const value = row.values[index];
                return (
                  <td key={plan.id}>
                    <span className={styles.cellPlan}>
                      {localize(plan.name, locale)}
                    </span>
                    <span className={styles.cellValue}>
                      {value === null || value === undefined ? (
                        <>
                          <span aria-hidden="true">–</span>
                          <span className={styles.srOnly}>
                            {t("pricing.table.notIncluded")}
                          </span>
                        </>
                      ) : (
                        formatNumber(value)
                      )}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      ) : null}
    </table>
  );
}
