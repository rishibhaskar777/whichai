/*
 * What each kind of visitor may do. This is the only place the limits are
 * written down: the plan flow, the locks and the table on /pricing all read it.
 * Which plans are paid comes from src/data/pricing/plans.json.
 *
 * Nothing here is enforced by a server. The limits are checked in the browser,
 * so a person who clears their site data can get past them. See
 * docs/decisions/0020-entitlements.md.
 */
import { PLANS, type PlanId } from "@/lib/pricing/plans";

/** A person with no account, or one of the plans in plans.json. */
export type Tier = "guest" | PlanId;

export const GUEST_TIER = "guest" satisfies Tier;
export const FREE_TIER = "free" satisfies Tier;

/** `null` means no limit. */
export interface Entitlements {
  tier: Tier;
  /** Plans that may be made from a new goal in one local day. */
  dailyPlans: number | null;
  /** Projects that may be saved. 0 means saving is not available. */
  savedProjects: number | null;
  /** False means searches last for the current visit only. */
  keepSearches: boolean;
  shareLinks: boolean;
  advancedLevel: boolean;
  compare: boolean;
  exportPlans: boolean;
}

type Limits = Omit<Entitlements, "tier">;

const GUEST_LIMITS: Limits = {
  dailyPlans: 5,
  savedProjects: 0,
  keepSearches: false,
  shareLinks: false,
  advancedLevel: false,
  compare: false,
  exportPlans: false,
};

const FREE_LIMITS: Limits = {
  dailyPlans: 20,
  savedProjects: 10,
  keepSearches: true,
  shareLinks: true,
  advancedLevel: false,
  compare: false,
  exportPlans: false,
};

const PAID_LIMITS: Limits = {
  dailyPlans: null,
  savedProjects: null,
  keepSearches: true,
  shareLinks: true,
  advancedLevel: true,
  compare: true,
  exportPlans: true,
};

/** Every plan in plans.json other than Free is a paid plan. */
export function isPaidTier(tier: Tier): boolean {
  return tier !== GUEST_TIER && tier !== FREE_TIER;
}

/** The tiers in display order: guest first, then the plans as listed. */
export function allTiers(): Tier[] {
  return [GUEST_TIER, ...PLANS.map((plan) => plan.id)];
}

export function entitlementsFor(tier: Tier): Entitlements {
  const limits =
    tier === GUEST_TIER
      ? GUEST_LIMITS
      : tier === FREE_TIER
        ? FREE_LIMITS
        : PAID_LIMITS;
  return { tier, ...limits };
}

/** The features a lock can sit on. A feature that does not exist stays out. */
export type LockableFeature =
  "advancedLevel" | "compare" | "exportPlans" | "shareLinks" | "saveProjects";

/**
 * What a person needs in order to use a feature: nothing, a free account or a
 * paid plan. Saving and share links are open to a free account, so a guest is
 * pointed to Register rather than to /pricing.
 */
export type Requirement = "none" | "account" | "paid";

export function requirementFor(
  feature: LockableFeature,
  entitlements: Entitlements,
): Requirement {
  switch (feature) {
    case "saveProjects":
      return entitlements.savedProjects === 0 ? "account" : "none";
    case "shareLinks":
      return entitlements.shareLinks ? "none" : "account";
    case "advancedLevel":
      return entitlements.advancedLevel ? "none" : "paid";
    case "compare":
      return entitlements.compare ? "none" : "paid";
    case "exportPlans":
      return entitlements.exportPlans ? "none" : "paid";
  }
}

/** Plans still available today, or null when there is no limit. */
export function plansRemaining(
  entitlements: Entitlements,
  usedToday: number,
): number | null {
  if (entitlements.dailyPlans === null) return null;
  return Math.max(0, entitlements.dailyPlans - usedToday);
}

/** Whether another project may be saved when `saved` already exist. */
export function canSaveProject(
  entitlements: Entitlements,
  saved: number,
): boolean {
  return (
    entitlements.savedProjects === null || saved < entitlements.savedProjects
  );
}

/** Shown beside the search box when this few plans are left. */
export const LOW_REMAINING_THRESHOLD = 2;

/** One cell of the comparison on /pricing. */
export type Cell =
  | { kind: "count"; value: number }
  | { kind: "unlimited" }
  | { kind: "yes" }
  | { kind: "no" }
  | { kind: "visit" };

export type EntitlementRowId =
  | "plansPerDay"
  | "savedProjects"
  | "searches"
  | "shareLinks"
  | "advancedLevel"
  | "compare"
  | "exportPlans";

export interface EntitlementRow {
  id: EntitlementRowId;
  cells: Cell[];
}

function countCell(value: number | null): Cell {
  if (value === null) return { kind: "unlimited" };
  return value === 0 ? { kind: "no" } : { kind: "count", value };
}

function flagCell(value: boolean): Cell {
  return { kind: value ? "yes" : "no" };
}

/** The table on /pricing: one row per feature, one cell per tier. */
export function entitlementRows(tiers: readonly Tier[]): EntitlementRow[] {
  const list = tiers.map(entitlementsFor);
  return [
    { id: "plansPerDay", cells: list.map((e) => countCell(e.dailyPlans)) },
    { id: "savedProjects", cells: list.map((e) => countCell(e.savedProjects)) },
    {
      id: "searches",
      cells: list.map((e): Cell =>
        e.keepSearches ? { kind: "yes" } : { kind: "visit" },
      ),
    },
    { id: "shareLinks", cells: list.map((e) => flagCell(e.shareLinks)) },
    { id: "advancedLevel", cells: list.map((e) => flagCell(e.advancedLevel)) },
    { id: "compare", cells: list.map((e) => flagCell(e.compare)) },
    { id: "exportPlans", cells: list.map((e) => flagCell(e.exportPlans)) },
  ];
}

/**
 * Feature ids in plans.json that the rows above already state, so the table
 * does not list them twice.
 */
export const ENTITLEMENT_FEATURE_IDS: ReadonlySet<string> = new Set([
  "plans-three-levels",
  "advanced-level",
  "saved-local",
  "share-links",
  "library-compare",
  "pdf-export",
]);
