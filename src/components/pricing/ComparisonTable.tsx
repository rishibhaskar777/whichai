"use client";

import { CheckIcon } from "@/components/icons";
import { useI18n } from "@/lib/i18n/provider";
import {
  ENTITLEMENT_FEATURE_IDS,
  entitlementRows,
  GUEST_TIER,
  type Cell,
  type Tier,
} from "@/lib/plans/entitlements";
import { buildComparison, localize } from "@/lib/pricing/plans";
import styles from "./Pricing.module.css";

/**
 * Every feature against every plan, with a Guest column for people who have
 * no account. The first block is built from the entitlements, so its numbers
 * are the ones the app enforces. The second lists what the paid plans add.
 * On narrow screens each row becomes a small block and the plan name is
 * repeated beside its value.
 */
export function ComparisonTable() {
  const { t, formatNumber, locale } = useI18n();
  const { plans, features, limits } = buildComparison();
  const tiers: Tier[] = [GUEST_TIER, ...plans.map((plan) => plan.id)];
  const rows = entitlementRows(tiers);
  const more = features.filter((row) => !ENTITLEMENT_FEATURE_IDS.has(row.id));
  const columns = tiers.length + 1;

  const notIncluded = (
    <>
      <span aria-hidden="true">–</span>
      <span className={styles.srOnly}>{t("pricing.table.notIncluded")}</span>
    </>
  );
  const included = (
    <>
      <CheckIcon width="16" height="16" />
      <span className={styles.srOnly}>{t("pricing.table.included")}</span>
    </>
  );

  function cellContent(cell: Cell) {
    switch (cell.kind) {
      case "count":
        return formatNumber(cell.value);
      case "unlimited":
        return t("pricing.table.unlimited");
      case "visit":
        return t("pricing.table.thisVisit");
      case "yes":
        return included;
      case "no":
        return notIncluded;
    }
  }

  return (
    <>
      <table className={styles.table}>
        <caption className={styles.srOnly}>{t("pricing.table.title")}</caption>
        <thead>
          <tr>
            <th scope="col">{t("pricing.table.feature")}</th>
            <th scope="col">{t("pricing.table.guest")}</th>
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
          {rows.map((row) => (
            <tr key={row.id}>
              <th scope="row">
                <span className={styles.rowName}>
                  {t(`pricing.row.${row.id}`)}
                </span>
              </th>
              {row.cells.map((cell, index) => (
                <td key={tiers[index]}>
                  <span className={styles.cellPlan}>{tierName(index)}</span>
                  <span className={styles.cellValue}>{cellContent(cell)}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {more.length > 0 ? (
          <tbody>
            <tr>
              <th scope="colgroup" colSpan={columns} className={styles.group}>
                {t("pricing.table.more")}
              </th>
            </tr>
            {more.map((row) => (
              <tr key={row.id}>
                <th scope="row">
                  <span className={styles.rowName}>
                    {localize(row.name, locale)}
                  </span>
                  <span className={styles.rowHelp}>
                    {localize(row.description, locale)}
                  </span>
                </th>
                <td>
                  <span className={styles.cellPlan}>{tierName(0)}</span>
                  <span className={styles.cellValue}>{notIncluded}</span>
                </td>
                {plans.map((plan, index) => (
                  <td key={plan.id}>
                    <span className={styles.cellPlan}>
                      {localize(plan.name, locale)}
                    </span>
                    <span className={styles.cellValue}>
                      {row.included[index] ? included : notIncluded}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        ) : null}
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
                <td>
                  <span className={styles.cellPlan}>{tierName(0)}</span>
                  <span className={styles.cellValue}>{notIncluded}</span>
                </td>
                {plans.map((plan, index) => {
                  const value = row.values[index];
                  return (
                    <td key={plan.id}>
                      <span className={styles.cellPlan}>
                        {localize(plan.name, locale)}
                      </span>
                      <span className={styles.cellValue}>
                        {value === null || value === undefined
                          ? notIncluded
                          : formatNumber(value)}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        ) : null}
      </table>
      <p className={styles.note}>{t("pricing.table.browserNote")}</p>
    </>
  );

  function tierName(index: number): string {
    const plan = plans[index - 1];
    return index === 0 || !plan
      ? t("pricing.table.guest")
      : localize(plan.name, locale);
  }
}
