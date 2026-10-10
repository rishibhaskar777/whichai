import { describe, expect, it } from "vitest";
import data from "@/data/pricing/plans.json";
import { contactUrl, mailtoUrl } from "@/lib/links";
import { getCurrentPlan } from "./current-plan";
import { formatPrice } from "./format";
import {
  PLANS,
  buildComparison,
  cardPlans,
  getPlan,
  planFeatures,
  planPrice,
  yearlySavings,
} from "./plans";
import { parseBilling, parseCheckoutQuery } from "./query";
import { pricingSchema } from "./schema";

describe("plan data", () => {
  it("matches the schema", () => {
    expect(pricingSchema.safeParse(data).success).toBe(true);
  });

  it("lists Free, Plus, Pro, Ultra and Institution in that order", () => {
    expect(PLANS.map((plan) => plan.id)).toEqual([
      "free",
      "plus",
      "pro",
      "ultra",
      "institution",
    ]);
  });

  it("uses the agreed prices in rupees", () => {
    const prices = Object.fromEntries(
      PLANS.map((plan) => [plan.id, [plan.monthlyPrice, plan.yearlyPrice]]),
    );
    expect(prices).toEqual({
      free: [0, 0],
      plus: [49, 490],
      pro: [149, 1490],
      ultra: [299, 2990],
      institution: [null, null],
    });
  });

  it("highlights only Pro, with a label in both languages", () => {
    expect(PLANS.filter((plan) => plan.highlight).map((p) => p.id)).toEqual([
      "pro",
    ]);
    expect(getPlan("pro").label).toEqual({
      en: "Recommended",
      hi: "सुझाया गया",
    });
  });

  it("rejects a plan with a missing translation", () => {
    const broken = structuredClone(data) as unknown as {
      plans: { name: Record<string, string> }[];
    };
    delete broken.plans[0]!.name.hi;
    expect(pricingSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects a yearly price above twelve months", () => {
    const broken = structuredClone(data);
    broken.plans[1]!.yearlyPrice = 600;
    expect(pricingSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects a price given for only one period", () => {
    const broken = structuredClone(data) as unknown as {
      plans: { yearlyPrice: number | null }[];
    };
    broken.plans[4]!.yearlyPrice = 100;
    expect(pricingSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects an include that is not listed earlier", () => {
    const broken = structuredClone(data) as unknown as {
      plans: { includes?: string }[];
    };
    broken.plans[1]!.includes = "ultra";
    expect(pricingSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects a repeated feature id", () => {
    const broken = structuredClone(data);
    broken.plans[1]!.features.push(broken.plans[0]!.features[0]!);
    expect(pricingSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects a data file with no free plan", () => {
    const broken = { ...data, plans: data.plans.slice(1) };
    expect(pricingSchema.safeParse(broken).success).toBe(false);
  });
});

describe("features", () => {
  it("builds each paid plan on the one before it", () => {
    expect(planFeatures(getPlan("free"))).toHaveLength(7);
    expect(planFeatures(getPlan("plus"))).toHaveLength(11);
    expect(planFeatures(getPlan("pro"))).toHaveLength(15);
    expect(planFeatures(getPlan("ultra"))).toHaveLength(19);
  });

  it("gives Free only what works today", () => {
    expect(planFeatures(getPlan("free")).map((f) => f.id)).toEqual([
      "plans-three-levels",
      "library-compare",
      "live-news",
      "saved-local",
      "share-links",
      "pdf-export",
      "languages",
    ]);
  });
});

describe("yearly savings", () => {
  it("is two months free for every paid plan", () => {
    for (const id of ["plus", "pro", "ultra"] as const) {
      expect(yearlySavings(getPlan(id))?.monthsFree).toBe(2);
    }
  });

  it("is computed from the prices", () => {
    expect(yearlySavings(getPlan("plus"))).toEqual({
      amount: 98,
      monthsFree: 2,
    });
    expect(yearlySavings(getPlan("pro"))).toEqual({
      amount: 298,
      monthsFree: 2,
    });
    expect(yearlySavings(getPlan("ultra"))).toEqual({
      amount: 598,
      monthsFree: 2,
    });
  });

  it("reports an amount without whole months when it is not a whole month", () => {
    const plan = { ...getPlan("plus"), yearlyPrice: 500 };
    expect(yearlySavings(plan)).toEqual({ amount: 88, monthsFree: null });
  });

  it("is absent for Free, Institution and a yearly price that saves nothing", () => {
    expect(yearlySavings(getPlan("free"))).toBeNull();
    expect(yearlySavings(getPlan("institution"))).toBeNull();
    expect(yearlySavings({ ...getPlan("plus"), yearlyPrice: 588 })).toBeNull();
  });
});

describe("prices", () => {
  it("picks the price for the billing period", () => {
    expect(planPrice(getPlan("pro"), "monthly")).toBe(149);
    expect(planPrice(getPlan("pro"), "yearly")).toBe(1490);
    expect(planPrice(getPlan("institution"), "monthly")).toBeNull();
  });

  it("formats in Indian rupees for English and Hindi", () => {
    expect(formatPrice(0, "en")).toBe("₹0");
    expect(formatPrice(149, "en")).toBe("₹149");
    expect(formatPrice(1490, "en")).toBe("₹1,490");
    expect(formatPrice(2990, "hi")).toBe("₹2,990");
  });

  it("uses lakh grouping for large amounts", () => {
    expect(formatPrice(125000, "en")).toBe("₹1,25,000");
  });
});

describe("comparison table", () => {
  const table = buildComparison();

  it("has a column for each plan that has a price", () => {
    expect(table.plans.map((plan) => plan.id)).toEqual([
      "free",
      "plus",
      "pro",
      "ultra",
    ]);
    expect(cardPlans()).toHaveLength(4);
  });

  it("marks a feature on its own plan and every plan above it", () => {
    const row = table.features.find((entry) => entry.id === "change-alerts");
    expect(row?.included).toEqual([false, true, true, true]);
    const base = table.features.find((entry) => entry.id === "pdf-export");
    expect(base?.included).toEqual([true, true, true, true]);
  });

  it("lists limits with a value, or null where a plan has none", () => {
    const compare = table.limits.find((row) => row.id === "compare-tools");
    expect(compare?.values).toEqual([3, 3, 6, 6]);
    const team = table.limits.find((row) => row.id === "team-members");
    expect(team?.values).toEqual([null, null, null, 5]);
  });
});

describe("current plan", () => {
  it("is Free for everyone until payments exist", () => {
    expect(getCurrentPlan()).toBe("free");
  });
});

describe("checkout query", () => {
  it("accepts a paid plan with a billing period", () => {
    expect(parseCheckoutQuery({ plan: "pro", billing: "yearly" })).toEqual({
      plan: "pro",
      billing: "yearly",
    });
  });

  it("defaults the billing period to monthly", () => {
    expect(parseCheckoutQuery({ plan: "plus" })).toEqual({
      plan: "plus",
      billing: "monthly",
    });
  });

  it("rejects Free, Institution, unknown, missing and repeated values", () => {
    for (const params of [
      { plan: "free" },
      { plan: "institution" },
      { plan: "enterprise" },
      { plan: "pro", billing: "weekly" },
      {},
      { plan: ["pro", "plus"] },
      { plan: "PRO" },
    ]) {
      expect(parseCheckoutQuery(params), JSON.stringify(params)).toBeNull();
    }
  });
});

describe("billing switch", () => {
  it("reads yearly and falls back to monthly", () => {
    expect(parseBilling({ billing: "yearly" })).toBe("yearly");
    expect(parseBilling({ billing: "weekly" })).toBe("monthly");
    expect(parseBilling({ billing: ["yearly", "monthly"] })).toBe("yearly");
    expect(parseBilling({})).toBe("monthly");
  });
});

describe("contact links", () => {
  it("builds a prefilled email with encoded spaces", () => {
    const url = mailtoUrl("Institution plan", "Hello there");
    expect(url.startsWith("mailto:")).toBe(true);
    expect(url).toContain("subject=Institution%20plan");
    expect(url).not.toContain("+");
  });

  it("uses the email while one is configured", () => {
    expect(contactUrl("Hi", "Body").startsWith("mailto:")).toBe(true);
  });
});
