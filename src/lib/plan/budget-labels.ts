import type { I18n } from "@/lib/i18n/translate";
import type { Budget } from "@/lib/schemas/plan";

export type Currency = "₹" | "$";

/*
 * The budget bands are defined in rupees. The dollar bands are rounded
 * equivalents for display only, not live exchange rates.
 */
const BANDS: Record<Currency, { under: number; low: number; high: number }> = {
  "₹": { under: 1000, low: 1000, high: 3000 },
  $: { under: 12, low: 12, high: 35 },
};

export const BUDGET_VALUES: readonly Budget[] = [
  "zero",
  "under-1000",
  "1000-3000",
  "more",
];

export function budgetLabel(
  budget: Budget,
  currency: Currency,
  { t, formatNumber }: Pick<I18n, "t" | "formatNumber">,
): string {
  const band = BANDS[currency];
  const money = (amount: number) => `${currency}${formatNumber(amount)}`;
  switch (budget) {
    case "zero":
      return t("budget.zero", { currency });
    case "under-1000":
      return t("budget.under", { amount: money(band.under) });
    case "1000-3000":
      return t("budget.between", {
        low: money(band.low),
        high: money(band.high),
      });
    case "more":
      return t("budget.more");
  }
}
