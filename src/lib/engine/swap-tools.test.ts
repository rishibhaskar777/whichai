import { describe, expect, it } from "vitest";
import { catalogue } from "@/data/catalogue";
import { pricingInfo } from "@/lib/catalogue/pricing";
import { goalChip } from "@/lib/plan/chips";
import { GOAL_IDS, VERIFY } from "@/lib/schemas/catalogue";
import {
  LEVELS,
  planSchema,
  type GoalType,
  type JobRecommendation,
  type UnderstoodGoal,
} from "@/lib/schemas/plan";
import { buildPlan, type BuildOptions } from "./build-plan";

const NO_OPTIONS: BuildOptions = {
  level: "simple",
  budget: null,
  toolsUsed: new Set(),
};

function goalOf(goalType: GoalType): UnderstoodGoal {
  const template = catalogue.goals.find((g) => g.id === goalType)!;
  return {
    goalType,
    title: template.title,
    chips: [goalChip(goalType, template.title)],
    inferredLevel: "simple",
  };
}

const GOAL = goalOf("portfolio-website");

/** The first job at the polished level that has at least one alternative. */
function swappable(): JobRecommendation {
  const job = buildPlan(GOAL, NO_OPTIONS).levels.polished.jobs.find(
    (candidate) => candidate.alternatives.length > 0,
  );
  if (!job) throw new Error("no job with alternatives");
  return job;
}

describe("swapping a tool into a job", () => {
  it("puts the alternative in the card and the previous pick in the list", () => {
    const original = swappable();
    const alternative = original.alternatives[0]!;

    const plan = buildPlan(GOAL, {
      ...NO_OPTIONS,
      chosenTools: { [original.jobId]: alternative.toolId },
    });
    const job = plan.levels.polished.jobs.find(
      (candidate) => candidate.jobId === original.jobId,
    )!;

    expect(job.toolId).toBe(alternative.toolId);
    expect(job.toolName).toBe(alternative.toolName);
    expect(job.alternatives.map((a) => a.toolId)).toContain(original.toolId);
    expect(job.alternatives.map((a) => a.toolId)).not.toContain(
      alternative.toolId,
    );
    expect(job.autoPick).toEqual({
      toolId: original.toolId,
      toolName: original.toolName,
    });
    expect(planSchema.safeParse(plan).success).toBe(true);
  });

  it("shows the alternative's own details, not the previous pick's", () => {
    const original = swappable();
    const alternative = original.alternatives[0]!;
    const tool = catalogue.tools.find((t) => t.id === alternative.toolId)!;

    const job = buildPlan(GOAL, {
      ...NO_OPTIONS,
      chosenTools: { [original.jobId]: tool.id },
    }).levels.polished.jobs.find((j) => j.jobId === original.jobId)!;

    expect(job.why).toContain(tool.summary);
    expect(job.kind).toBe(tool.kind);
    expect(job.officialUrl).toBe(tool.officialUrl);
    expect(job.getIt).toEqual(tool.getIt ?? null);
    expect(job.freeOption).toBe(tool.hasFreeOption);
    expect(job.pricing).toEqual(pricingInfo(tool));
    expect(job.fitScore).toBe(tool.fitScores[original.jobId]);
    expect(job.watchOutFor).toContain(tool.watchOutFor[0]!);
  });

  it("updates the toolkit and the starter brief", () => {
    const original = swappable();
    const alternative = original.alternatives[0]!;

    const before = buildPlan(GOAL, NO_OPTIONS).levels.polished;
    const after = buildPlan(GOAL, {
      ...NO_OPTIONS,
      chosenTools: { [original.jobId]: alternative.toolId },
    }).levels.polished;

    const toolkitIds = (level: typeof before) =>
      level.toolkit.flatMap((group) => group.tools.map((t) => t.toolId));
    expect(toolkitIds(before)).toContain(original.toolId);
    expect(toolkitIds(after)).toContain(alternative.toolId);
    expect(toolkitIds(after)).not.toContain(original.toolId);

    expect(before.starterBrief).toContain(original.toolName);
    expect(after.starterBrief).toContain(alternative.toolName);
    expect(after.starterBrief).not.toContain(original.toolName);
    expect(after.starterBrief.length).toBeLessThanOrEqual(1200);
  });

  it("keeps the brief's own fill-in lines and closing line", () => {
    const brief = buildPlan(GOAL, NO_OPTIONS).levels.simple.starterBrief;
    const lines = brief.split("\n");
    expect(lines.at(-1)).toMatch(/^Ask me/);
    expect(lines.at(-2)).toMatch(/^Tools I plan to use: /);
  });

  it("goes back to the engine's pick when the original is chosen again", () => {
    const original = swappable();
    const plain = buildPlan(GOAL, NO_OPTIONS);

    const back = buildPlan(GOAL, {
      ...NO_OPTIONS,
      chosenTools: { [original.jobId]: original.toolId },
    });

    expect(back).toEqual(plain);
    expect(
      back.levels.polished.jobs.every((job) => job.autoPick === null),
    ).toBe(true);
  });

  it("ignores a tool that does not exist or cannot do the job", () => {
    const original = swappable();
    const plain = buildPlan(GOAL, NO_OPTIONS);
    const wrongJob = catalogue.tools.find(
      (tool) => !tool.jobs.includes(original.jobId),
    )!;

    for (const toolId of ["no-such-tool", wrongJob.id]) {
      const plan = buildPlan(GOAL, {
        ...NO_OPTIONS,
        chosenTools: { [original.jobId]: toolId, "no-such-job": toolId },
      });
      expect(plan).toEqual(plain);
    }
  });

  it("tags a hand-picked tool Keep when the person already uses it", () => {
    const original = swappable();
    const alternative = original.alternatives[0]!;

    const job = buildPlan(GOAL, {
      ...NO_OPTIONS,
      toolsUsed: new Set([alternative.toolId]),
      chosenTools: { [original.jobId]: alternative.toolId },
    }).levels.polished.jobs.find((j) => j.jobId === original.jobId)!;

    expect(job.tag).toBe("keep");
  });

  it("keeps working for every goal at every level", () => {
    for (const goalType of GOAL_IDS) {
      const goal = goalOf(goalType);
      const plain = buildPlan(goal, NO_OPTIONS);
      for (const level of LEVELS) {
        const chosenTools = Object.fromEntries(
          plain.levels[level].jobs.flatMap((job) =>
            job.alternatives[0]
              ? [[job.jobId, job.alternatives[0].toolId]]
              : [],
          ),
        );
        const plan = buildPlan(goal, { ...NO_OPTIONS, chosenTools });
        expect(planSchema.safeParse(plan).success).toBe(true);
        const ids = plan.levels[level].jobs.map((job) => job.jobId);
        expect(new Set(ids).size).toBe(ids.length);
      }
    }
  });
});

describe("what a plan may say about prices", () => {
  it("never carries the placeholder in any text", () => {
    for (const goalType of GOAL_IDS) {
      const plan = buildPlan(goalOf(goalType), NO_OPTIONS);
      expect(JSON.stringify(plan)).not.toContain(VERIFY);
    }
  });

  it("gives the pricing page, or the official site when there is none", () => {
    const [tool] = catalogue.tools;
    const base = {
      hasFreeOption: true as const,
      pricing: VERIFY,
      officialUrl: tool!.officialUrl,
    };
    expect(pricingInfo(base)).toEqual({
      hasFreeOption: true,
      text: null,
      checkedOn: null,
      url: tool!.officialUrl,
    });
    expect(
      pricingInfo({
        ...base,
        pricing: "Free plan; paid from $20/month",
        pricingUrl: "https://example.com/pricing",
        pricingCheckedOn: "2026-10-11",
      }),
    ).toEqual({
      hasFreeOption: true,
      text: "Free plan; paid from $20/month",
      checkedOn: "2026-10-11",
      url: "https://example.com/pricing",
    });
  });

  it("shows no text when the date it was read is missing", () => {
    const info = pricingInfo({
      hasFreeOption: "verify",
      pricing: "Free plan",
      officialUrl: "https://example.com",
    });
    expect(info.text).toBeNull();
  });
});
