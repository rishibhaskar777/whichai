import { describe, expect, it } from "vitest";
import { PLANS } from "@/lib/pricing/plans";
import {
  allTiers,
  canSaveProject,
  entitlementRows,
  entitlementsFor,
  isPaidTier,
  plansRemaining,
  requirementFor,
} from "./entitlements";

describe("entitlements", () => {
  it("gives guests 5 plans a day, no saving and searches for the visit only", () => {
    expect(entitlementsFor("guest")).toMatchObject({
      dailyPlans: 5,
      savedProjects: 0,
      keepSearches: false,
      shareLinks: false,
      advancedLevel: false,
      compare: false,
      exportPlans: false,
    });
  });

  it("gives a free account 20 plans, 10 projects and share links", () => {
    expect(entitlementsFor("free")).toMatchObject({
      dailyPlans: 20,
      savedProjects: 10,
      keepSearches: true,
      shareLinks: true,
      advancedLevel: false,
      compare: false,
      exportPlans: false,
    });
  });

  it("unlocks everything on every paid plan in plans.json", () => {
    const paid = PLANS.filter((plan) => plan.id !== "free");
    expect(paid.length).toBeGreaterThan(0);
    for (const plan of paid) {
      expect(isPaidTier(plan.id)).toBe(true);
      expect(entitlementsFor(plan.id)).toMatchObject({
        dailyPlans: null,
        savedProjects: null,
        advancedLevel: true,
        compare: true,
        exportPlans: true,
        shareLinks: true,
      });
    }
  });

  it("lists guest first and then every plan id from plans.json", () => {
    expect(allTiers()).toEqual(["guest", ...PLANS.map((plan) => plan.id)]);
  });

  it("counts what is left, never below zero, and null when unlimited", () => {
    expect(plansRemaining(entitlementsFor("guest"), 3)).toBe(2);
    expect(plansRemaining(entitlementsFor("guest"), 9)).toBe(0);
    expect(plansRemaining(entitlementsFor("pro"), 500)).toBeNull();
  });

  it("limits saving to the allowance", () => {
    expect(canSaveProject(entitlementsFor("guest"), 0)).toBe(false);
    expect(canSaveProject(entitlementsFor("free"), 9)).toBe(true);
    expect(canSaveProject(entitlementsFor("free"), 10)).toBe(false);
    expect(canSaveProject(entitlementsFor("plus"), 500)).toBe(true);
  });

  it("says what unlocks each feature", () => {
    const guest = entitlementsFor("guest");
    const free = entitlementsFor("free");
    const paid = entitlementsFor("plus");
    expect(requirementFor("saveProjects", guest)).toBe("account");
    expect(requirementFor("saveProjects", free)).toBe("none");
    expect(requirementFor("shareLinks", guest)).toBe("account");
    expect(requirementFor("shareLinks", free)).toBe("none");
    for (const feature of [
      "advancedLevel",
      "compare",
      "exportPlans",
    ] as const) {
      expect(requirementFor(feature, guest)).toBe("paid");
      expect(requirementFor(feature, free)).toBe("paid");
      expect(requirementFor(feature, paid)).toBe("none");
    }
  });

  it("builds the pricing rows from the same numbers", () => {
    const rows = entitlementRows(["guest", "free", "plus"]);
    expect(rows.find((row) => row.id === "plansPerDay")?.cells).toEqual([
      { kind: "count", value: 5 },
      { kind: "count", value: 20 },
      { kind: "unlimited" },
    ]);
    expect(rows.find((row) => row.id === "searches")?.cells[0]).toEqual({
      kind: "visit",
    });
  });
});
