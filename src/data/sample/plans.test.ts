import { describe, expect, it } from "vitest";
import {
  LEVELS,
  goalTypeSchema,
  jobRecommendationSchema,
  planSchema,
  type Plan,
} from "@/lib/schemas/plan";
import { getSamplePlan, samplePlans } from "./plans";

function allStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(allStrings);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(allStrings);
  }
  return [];
}

function jobsOf(plan: Plan) {
  return LEVELS.flatMap((level) => plan.levels[level].jobs);
}

describe("sample plans", () => {
  it("validate against the plan schema", () => {
    for (const plan of samplePlans) {
      expect(planSchema.safeParse(plan).success).toBe(true);
    }
  });

  it("cover every goal type once", () => {
    const covered = samplePlans.map((plan) => plan.goalType).sort();
    expect(covered).toEqual([...goalTypeSchema.options].sort());
    expect(new Set(samplePlans.map((plan) => plan.id)).size).toBe(
      samplePlans.length,
    );
  });

  it("looks a plan up by goal type", () => {
    expect(getSamplePlan("study-plan").headline).toBe("Your 60-day study plan");
  });

  it("marks every job as sample data with no verification date", () => {
    for (const plan of samplePlans) {
      for (const job of jobsOf(plan)) {
        expect(job.sourceLabel).toBe("sample");
        expect(job.lastVerified).toBeNull();
      }
    }
  });

  it("contains no concrete prices, only placeholders", () => {
    for (const plan of samplePlans) {
      for (const text of allStrings(plan)) {
        expect(text).not.toMatch(/₹\s*\d/);
        expect(text).not.toMatch(/(?:\$|€|£|\bRs\.?\s)\s*\d/);
      }
    }
  });

  it("links only to https official pages", () => {
    for (const plan of samplePlans) {
      for (const job of jobsOf(plan)) {
        if (job.officialUrl) {
          expect(new URL(job.officialUrl).protocol).toBe("https:");
        }
      }
    }
  });

  it("gives the study plan fact-checking notes and the honesty prompt", () => {
    const study = getSamplePlan("study-plan");
    for (const level of LEVELS) {
      expect(study.levels[level].checkTheFacts).toBeTruthy();
      const prompts = study.levels[level].workflow.map(
        (step) => step.examplePrompt,
      );
      expect(prompts).toContain(
        "Make a 60-day plan. Tell me honestly if my goal is unrealistic. List the three biggest risks in this plan.",
      );
      expect(study.levels[level].jobs[0]?.watchOutFor).toMatch(/agree/i);
    }
  });

  it("adds content management, contact form and analytics only at the advanced level", () => {
    const portfolio = getSamplePlan("portfolio-website");
    const jobNames = (level: (typeof LEVELS)[number]) =>
      portfolio.levels[level].jobs.map((job) => job.jobName);
    for (const name of ["Content management", "Contact form", "Analytics"]) {
      expect(jobNames("advanced")).toContain(name);
      expect(jobNames("simple")).not.toContain(name);
      expect(jobNames("polished")).not.toContain(name);
    }
  });

  it("exercises both the present and absent tier and fact-check cases", () => {
    const levels = samplePlans.flatMap((plan) =>
      LEVELS.map((level) => plan.levels[level]),
    );
    expect(levels.some((level) => level.tiers === null)).toBe(true);
    expect(levels.some((level) => level.tiers !== null)).toBe(true);
    expect(levels.some((level) => level.checkTheFacts === null)).toBe(true);
    expect(levels.some((level) => level.checkTheFacts !== null)).toBe(true);
  });
});

describe("plan schema", () => {
  const job = getSamplePlan("study-plan").levels.simple.jobs[0]!;

  it("rejects plans that are not marked as samples", () => {
    const real = { ...samplePlans[0], isSample: false };
    expect(planSchema.safeParse(real).success).toBe(false);
  });

  it("rejects non-https official links and malformed dates", () => {
    expect(
      jobRecommendationSchema.safeParse({
        ...job,
        officialUrl: "http://example.com",
      }).success,
    ).toBe(false);
    expect(
      jobRecommendationSchema.safeParse({ ...job, lastVerified: "yesterday" })
        .success,
    ).toBe(false);
  });

  it("accepts a verification date in ISO format", () => {
    expect(
      jobRecommendationSchema.safeParse({ ...job, lastVerified: "2026-10-09" })
        .success,
    ).toBe(true);
  });
});
