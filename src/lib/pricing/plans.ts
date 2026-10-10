import data from "@/data/pricing/plans.json";
import type { Locale } from "@/lib/i18n/locales";
import {
  pricingSchema,
  type Localized,
  type Plan,
  type PlanFeature,
  type PlanId,
  type PlanLimit,
} from "./schema";

export type { Localized, Plan, PlanFeature, PlanId, PlanLimit };

export const BILLINGS = ["monthly", "yearly"] as const;
export type Billing = (typeof BILLINGS)[number];
export const DEFAULT_BILLING: Billing = "monthly";

/** Plans a person can reach checkout for. Free and Institution cannot. */
export const CHECKOUT_PLAN_IDS = ["plus", "pro", "ultra"] as const;
export type CheckoutPlanId = (typeof CHECKOUT_PLAN_IDS)[number];

/** Parsed once at start-up, so a bad edit to plans.json fails the build. */
export const PLANS: readonly Plan[] = pricingSchema.parse(data).plans;

export function getPlan(id: PlanId): Plan {
  const plan = PLANS.find((candidate) => candidate.id === id);
  if (!plan) throw new Error(`Unknown plan: ${id}`);
  return plan;
}

export function localize(text: Localized, locale: Locale): string {
  return text[locale];
}

export function isCheckoutPlan(id: string): id is CheckoutPlanId {
  return (CHECKOUT_PLAN_IDS as readonly string[]).includes(id);
}

/** The price for a billing period, or null for "contact us". */
export function planPrice(plan: Plan, billing: Billing): number | null {
  return billing === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
}

/** Plans that cost money, in display order. */
export function pricedPlans(): Plan[] {
  return PLANS.filter((plan) => (plan.monthlyPrice ?? 0) > 0);
}

/** The plans shown as cards in a row: Free and the paid ones. */
export function cardPlans(): Plan[] {
  return PLANS.filter((plan) => plan.monthlyPrice !== null);
}

/** Features a plan has, inherited ones first. Each feature appears once. */
export function planFeatures(plan: Plan): PlanFeature[] {
  const inherited = plan.includes ? planFeatures(getPlan(plan.includes)) : [];
  return [...inherited, ...plan.features];
}

export interface YearlySavings {
  /** Rupees saved against twelve months at the monthly price. */
  amount: number;
  /** Whole months free, or null when the saving is not a whole month. */
  monthsFree: number | null;
}

/** What paying yearly saves. Derived from the prices, never typed by hand. */
export function yearlySavings(plan: Plan): YearlySavings | null {
  const { monthlyPrice, yearlyPrice } = plan;
  if (!monthlyPrice || yearlyPrice === null) return null;
  const amount = monthlyPrice * 12 - yearlyPrice;
  if (amount <= 0) return null;
  const months = amount / monthlyPrice;
  return { amount, monthsFree: Number.isInteger(months) ? months : null };
}

export interface ComparisonRow {
  id: string;
  name: Localized;
  description: Localized;
  /** One entry per plan in `plans`: included or not. */
  included: boolean[];
}

export interface LimitRow {
  id: string;
  label: Localized;
  /** One entry per plan in `plans`: the limit, or null when there is none. */
  values: (number | null)[];
}

export interface Comparison {
  plans: Plan[];
  features: ComparisonRow[];
  limits: LimitRow[];
}

/** The comparison table, built from the plan data. */
export function buildComparison(plans: Plan[] = cardPlans()): Comparison {
  const features = new Map<string, ComparisonRow>();
  const perPlan = plans.map((plan) => planFeatures(plan));

  for (const list of perPlan) {
    for (const feature of list) {
      if (!features.has(feature.id)) {
        features.set(feature.id, {
          id: feature.id,
          name: feature.name,
          description: feature.description,
          included: [],
        });
      }
    }
  }
  const rows = [...features.values()].map((row) => ({
    ...row,
    included: perPlan.map((list) =>
      list.some((feature) => feature.id === row.id),
    ),
  }));

  const limitLabels = new Map<string, Localized>();
  for (const plan of plans) {
    for (const limit of plan.limits) {
      if (!limitLabels.has(limit.id)) limitLabels.set(limit.id, limit.label);
    }
  }
  const limits = [...limitLabels].map(([id, label]) => ({
    id,
    label,
    values: plans.map(
      (plan) => plan.limits.find((limit) => limit.id === id)?.value ?? null,
    ),
  }));

  return { plans, features: rows, limits };
}
