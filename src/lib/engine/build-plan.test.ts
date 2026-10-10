import { describe, expect, it } from "vitest";
import { catalogue } from "@/data/catalogue";
import { featureChip, goalChip, taskChip } from "@/lib/plan/chips";
import { collectStrings, hasConcretePrice } from "@/lib/catalogue/validate";
import { GOAL_IDS, type Catalogue, type Tool } from "@/lib/schemas/catalogue";
import {
  LEVELS,
  goalTypeSchema,
  planSchema,
  type Chip,
  type GoalType,
  type UnderstoodGoal,
} from "@/lib/schemas/plan";
import { buildPlan, jobIdsFor, type BuildOptions } from "./build-plan";
import { toAlternative } from "./describe";

const NO_OPTIONS: BuildOptions = {
  level: "simple",
  budget: null,
  toolsUsed: new Set(),
};

function goalOf(goalType: GoalType, extra: Chip[] = []): UnderstoodGoal {
  const template = catalogue.goals.find((g) => g.id === goalType)!;
  return {
    goalType,
    title: template.title,
    chips: [goalChip(goalType, template.title), ...extra],
    inferredLevel: "simple",
  };
}

function allFeatureChips(goalType: GoalType): Chip[] {
  const template = catalogue.goals.find((g) => g.id === goalType)!;
  return template.features.map((f) => featureChip(f.id, f.label));
}

describe("every goal template", () => {
  it("matches the plan goal types", () => {
    expect([...goalTypeSchema.options].sort()).toEqual([...GOAL_IDS].sort());
  });

  it.each(GOAL_IDS)(
    "builds a valid plan at all three levels: %s",
    (goalType) => {
      const plan = buildPlan(goalOf(goalType), NO_OPTIONS);

      const result = planSchema.safeParse(plan);
      expect(result.success ? [] : result.error.issues).toEqual([]);
      for (const level of LEVELS) {
        expect(plan.levels[level].jobs.length).toBeGreaterThan(0);
        expect(plan.levels[level].workflow.length).toBeGreaterThan(0);
      }
    },
  );

  it.each(GOAL_IDS)(
    "stays valid with every feature switched on: %s",
    (goalType) => {
      const plan = buildPlan(goalOf(goalType, allFeatureChips(goalType)), {
        ...NO_OPTIONS,
        budget: "zero",
      });

      expect(planSchema.safeParse(plan).success).toBe(true);
    },
  );

  it.each(GOAL_IDS)("never puts a concrete price in a plan: %s", (goalType) => {
    const plan = buildPlan(
      goalOf(goalType, allFeatureChips(goalType)),
      NO_OPTIONS,
    );

    for (const text of collectStrings(plan)) {
      expect(hasConcretePrice(text), text).toBe(false);
    }
  });

  it.each(GOAL_IDS)("leaves no unfilled tool placeholder: %s", (goalType) => {
    const plan = buildPlan(goalOf(goalType), NO_OPTIONS);

    expect(collectStrings(plan).join("\n")).not.toMatch(/\{job:/);
  });

  it("is deterministic", () => {
    const goal = goalOf("portfolio-website");
    expect(buildPlan(goal, NO_OPTIONS)).toEqual(buildPlan(goal, NO_OPTIONS));
  });
});

describe("plan contents", () => {
  it("is marked as sample while any chosen record is unverified", () => {
    const plan = buildPlan(goalOf("study-plan"), NO_OPTIONS);
    const jobs = LEVELS.flatMap((level) => plan.levels[level].jobs);
    expect(plan.isSample).toBe(jobs.some((job) => !job.verified));
    for (const job of jobs) {
      const tool = catalogue.tools.find((t) => t.id === job.toolId)!;
      expect(job.verified).toBe(tool.verified);
      expect(job.lastVerified).toBe(tool.lastVerified);
      expect(job.sourceLabel).toBe(tool.verified ? "official-docs" : "sample");
    }
  });

  it("opens on the level it was asked for", () => {
    const plan = buildPlan(goalOf("study-plan"), {
      ...NO_OPTIONS,
      level: "advanced",
    });
    expect(plan.startLevel).toBe("advanced");
  });

  it("uses the headline of the goal template", () => {
    expect(buildPlan(goalOf("study-plan"), NO_OPTIONS).headline).toBe(
      "Your 60-day study plan",
    );
  });

  it("names the chosen tool in the summary and steps", () => {
    const plan = buildPlan(goalOf("portfolio-website"), NO_OPTIONS);
    const level = plan.levels.simple;
    const assistant = level.jobs.find((job) => job.jobId === "ai-assistant")!;

    expect(level.summary).toContain(assistant.toolName);
    expect(level.workflow.map((step) => step.detail).join(" ")).toContain(
      assistant.toolName,
    );
  });

  it("keeps the honest-plan prompt in the study plan", () => {
    const plan = buildPlan(goalOf("study-plan"), NO_OPTIONS);
    for (const level of LEVELS) {
      const prompts = plan.levels[level].workflow.map(
        (step) => step.examplePrompt,
      );
      expect(prompts).toContain(
        "Make a 60-day plan. Tell me honestly if my goal is unrealistic. List the three biggest risks in this plan.",
      );
      expect(plan.levels[level].checkTheFacts).toBeTruthy();
    }
  });

  it("does not use the same tool for different jobs inside one level unless it covers both", () => {
    const plan = buildPlan(
      goalOf("portfolio-website", allFeatureChips("portfolio-website")),
      NO_OPTIONS,
    );
    for (const level of LEVELS) {
      const jobs = plan.levels[level].jobs;
      expect(new Set(jobs.map((job) => job.jobId)).size).toBe(jobs.length);
    }
  });

  it("offers a different mix of tools for different goals", () => {
    const toolsFor = (goalType: GoalType) =>
      new Set(
        buildPlan(goalOf(goalType), NO_OPTIONS).levels.polished.jobs.map(
          (job) => job.toolId,
        ),
      );

    const all = new Set(GOAL_IDS.flatMap((id) => [...toolsFor(id)]));
    expect(all.size).toBeGreaterThan(15);
  });

  it("does not let one company dominate a level", () => {
    for (const goalType of GOAL_IDS) {
      for (const level of LEVELS) {
        const jobs = buildPlan(goalOf(goalType), NO_OPTIONS).levels[level].jobs;
        const providers = jobs.map(
          (job) => catalogue.tools.find((t) => t.id === job.toolId)!.providerId,
        );
        const counts = new Map<string, number>();
        for (const provider of providers)
          counts.set(provider, (counts.get(provider) ?? 0) + 1);
        expect(
          Math.max(...counts.values()),
          `${goalType} ${level}`,
        ).toBeLessThanOrEqual(2);
      }
    }
  });
});

describe("jobs from the understood goal", () => {
  const template = catalogue.goals.find((g) => g.id === "portfolio-website")!;

  it("starts from the level's own jobs", () => {
    expect(jobIdsFor(template, [], "simple")).toEqual(
      template.levels.simple.jobs,
    );
  });

  it("adds the jobs of the features present, once", () => {
    const ids = jobIdsFor(
      template,
      [featureChip("animation", "Animation"), featureChip("blog", "Blog")],
      "simple",
    );
    expect(ids).toEqual([
      ...template.levels.simple.jobs,
      "animation-library",
      "content-management",
    ]);
    const advanced = jobIdsFor(
      template,
      [featureChip("animation", "Animation")],
      "advanced",
    );
    expect(advanced.filter((id) => id === "animation-library")).toHaveLength(1);
  });

  it("drops a job when its feature chip is removed", () => {
    const withBlog = jobIdsFor(
      template,
      [featureChip("blog", "Blog")],
      "simple",
    );
    const without = jobIdsFor(template, [], "simple");
    expect(withBlog).toContain("content-management");
    expect(without).not.toContain("content-management");
  });

  it("uses the task chips for the pick-an-ai goal, and falls back to an assistant", () => {
    const fallback = catalogue.goals.find((g) => g.id === "pick-an-ai")!;
    expect(jobIdsFor(fallback, [], "simple")).toEqual(["ai-assistant"]);
    expect(
      jobIdsFor(
        fallback,
        [
          taskChip("design-tool", "Design tool"),
          taskChip("image-generation", "Image generation"),
        ],
        "simple",
      ),
    ).toEqual(["design-tool", "image-generation"]);
  });

  it("caps the number of jobs", () => {
    const chips = catalogue.jobs.map((job) => taskChip(job.id, job.name));
    const fallback = catalogue.goals.find((g) => g.id === "pick-an-ai")!;
    expect(jobIdsFor(fallback, chips, "simple")).toHaveLength(12);
  });

  it("shows the chosen task tools in the plan", () => {
    const goal = goalOf("pick-an-ai", [taskChip("design-tool", "Design tool")]);
    const plan = buildPlan(goal, NO_OPTIONS);
    expect(plan.levels.simple.jobs.map((job) => job.jobId)).toEqual([
      "design-tool",
    ]);
  });
});

describe("level and budget in a real plan", () => {
  it("uses only beginner tools at the simple level when they exist", () => {
    const plan = buildPlan(goalOf("study-plan"), NO_OPTIONS);
    for (const job of plan.levels.simple.jobs) {
      const tool = catalogue.tools.find((t) => t.id === job.toolId)!;
      expect(tool.skillLevel, job.jobId).toBe("beginner");
    }
  });

  it("gives different picks at different levels when the tools differ", () => {
    const plan = buildPlan(goalOf("build-an-app"), NO_OPTIONS);
    expect(plan.levels.simple.jobs.map((j) => j.jobId)).not.toEqual(
      plan.levels.advanced.jobs.map((j) => j.jobId),
    );
  });

  it("never offers a paid-only tool at a zero budget", () => {
    const paidOnly = new Set(
      catalogue.tools.filter((t) => t.hasFreeOption === false).map((t) => t.id),
    );
    for (const goalType of GOAL_IDS) {
      const plan = buildPlan(goalOf(goalType, allFeatureChips(goalType)), {
        ...NO_OPTIONS,
        budget: "zero",
      });
      for (const level of LEVELS) {
        for (const job of plan.levels[level].jobs) {
          expect(paidOnly.has(job.toolId)).toBe(false);
          for (const alt of job.alternatives) {
            expect(paidOnly.has(alt.toolId)).toBe(false);
            expect(alt.paidOnly).toBe(false);
          }
        }
      }
    }
  });

  it("says when a free option is not confirmed", () => {
    const plan = buildPlan(goalOf("study-plan"), {
      ...NO_OPTIONS,
      budget: "zero",
    });
    const texts = plan.levels.simple.jobs.map((job) => job.pricing).join(" ");
    expect(texts).toMatch(/Not confirmed as free yet|Has a free option/);
    expect(plan.levels.simple.estimatedCost).toMatch(/Free options only/);
  });

  it("marks a paid-only alternative as such", () => {
    const photoshop = catalogue.tools.find((t) => t.id === "adobe-photoshop")!;
    const canva = catalogue.tools.find((t) => t.id === "canva")!;
    expect(toAlternative(photoshop).paidOnly).toBe(true);
    expect(toAlternative(canva).paidOnly).toBe(false);
    expect(toAlternative(canva).chooseIf).toMatch(/^you want /);
  });
});

describe("tools that bundle another job", () => {
  const goal = goalOf("pick-an-ai", [
    taskChip("ui-templates", "UI templates"),
    taskChip("hosting", "Hosting"),
  ]);
  const withWix = () =>
    buildPlan(goal, { ...NO_OPTIONS, toolsUsed: new Set(["wix"]) });

  it("skips a later job that the pick already covers, and says so", () => {
    const jobs = withWix().levels.simple.jobs;

    expect(jobs.map((job) => job.jobId)).toEqual(["ui-templates"]);
    expect(jobs[0]?.toolId).toBe("wix");
    expect(jobs[0]?.why).toMatch(/also covers hosting/);
  });

  it("names the bundling tool wherever the skipped job is mentioned", () => {
    const template = catalogue.goals.find((g) => g.id === "business-website")!;
    const plan = buildPlan(goalOf("business-website"), {
      ...NO_OPTIONS,
      toolsUsed: new Set(["wix"]),
    });
    const text = collectStrings(plan.levels.polished).join(" ");
    expect(template.levels.polished.jobs).toContain("hosting");
    expect(plan.levels.polished.jobs.map((job) => job.jobId)).not.toContain(
      "hosting",
    );
    expect(text).not.toMatch(/your hosting/);
  });

  it("keeps the later job when the pick does not cover it", () => {
    const jobs = buildPlan(goal, {
      ...NO_OPTIONS,
      toolsUsed: new Set(["astro-themes"]),
    }).levels.advanced.jobs;

    expect(jobs.map((job) => job.jobId)).toEqual(["ui-templates", "hosting"]);
  });

  it("does not skip a job that came earlier in the plan", () => {
    const earlier = goalOf("pick-an-ai", [
      taskChip("hosting", "Hosting"),
      taskChip("ui-templates", "UI templates"),
    ]);
    const jobs = buildPlan(earlier, {
      ...NO_OPTIONS,
      toolsUsed: new Set(["wix"]),
    }).levels.simple.jobs;

    expect(jobs.map((job) => job.jobId)).toEqual(["hosting", "ui-templates"]);
  });
});

describe("tools already used", () => {
  it("tags a used tool Keep and puts it in the plan", () => {
    const base = buildPlan(goalOf("study-plan"), NO_OPTIONS);
    const alternative = base.levels.simple.jobs[0]!.alternatives[0]!;

    const plan = buildPlan(goalOf("study-plan"), {
      ...NO_OPTIONS,
      toolsUsed: new Set([alternative.toolId]),
    });

    const first = plan.levels.simple.jobs[0]!;
    expect(first.toolId).toBe(alternative.toolId);
    expect(first.tag).toBe("keep");
    expect(first.why).toMatch(/already use/);
  });

  it("marks the best tool Better when the person uses a clearly weaker one", () => {
    const weak = catalogue.tools.find(
      (t) =>
        (t.fitScores["ai-assistant"] ?? 9) <= 3 &&
        t.jobs.includes("ai-assistant"),
    )!;

    const plan = buildPlan(goalOf("study-plan"), {
      ...NO_OPTIONS,
      toolsUsed: new Set([weak.id]),
    });

    const assistant = plan.levels.simple.jobs.find(
      (j) => j.jobId === "ai-assistant",
    )!;
    expect(assistant.tag).toBe("better");
    expect(assistant.why).toContain(weak.name);
  });

  it("changes nothing for tools that are not in the catalogue", () => {
    const base = buildPlan(goalOf("study-plan"), NO_OPTIONS);
    const plan = buildPlan(goalOf("study-plan"), {
      ...NO_OPTIONS,
      toolsUsed: new Set(["nothing"]),
    });
    expect(plan).toEqual(base);
  });
});

describe("model guidance", () => {
  it("is attached to AI tools, with the class meaning", () => {
    const plan = buildPlan(goalOf("portfolio-website"), NO_OPTIONS);
    const assistant = plan.levels.polished.jobs.find(
      (j) => j.jobId === "ai-assistant",
    )!;

    expect(assistant.modelGuidance?.steps.map((s) => s.modelClass)).toEqual([
      "fast-and-cheap",
      "deep-reasoning",
    ]);
    expect(assistant.modelGuidance?.steps[1]?.effort).toBe("high");
    expect(assistant.modelGuidance?.steps[0]?.useFor).toBeTruthy();
  });

  it("is absent for tools that are not AI tools", () => {
    const plan = buildPlan(goalOf("portfolio-website"), NO_OPTIONS);
    for (const job of plan.levels.polished.jobs) {
      if (job.kind !== "ai-tool") expect(job.modelGuidance).toBeNull();
    }
  });

  it("names only classes, never model versions", () => {
    const text = collectStrings(
      GOAL_IDS.map((id) => buildPlan(goalOf(id), NO_OPTIONS)),
    ).join(" ");
    expect(text).not.toMatch(/\bgpt-?\d|opus \d|sonnet \d|haiku \d/i);
  });
});

describe("toolkit", () => {
  it("lists every chosen tool once, grouped by category", () => {
    const plan = buildPlan(
      goalOf("portfolio-website", allFeatureChips("portfolio-website")),
      NO_OPTIONS,
    );
    for (const level of LEVELS) {
      const toolkitIds = plan.levels[level].toolkit.flatMap((group) =>
        group.tools.map((t) => t.toolId),
      );
      const jobIds = [...new Set(plan.levels[level].jobs.map((j) => j.toolId))];
      expect(toolkitIds.sort()).toEqual(jobIds.sort());
    }
  });

  it("uses the category of each job", () => {
    const plan = buildPlan(goalOf("portfolio-website"), NO_OPTIONS);
    for (const group of plan.levels.advanced.toolkit) {
      for (const entry of group.tools) {
        const job = catalogue.jobs.find((j) => j.id === entry.jobId)!;
        expect(job.category).toBe(group.category);
      }
    }
  });

  it("lists a tool that serves two jobs once, pointing at its first card", () => {
    const goal = goalOf("pick-an-ai", [
      taskChip("design-tool", "Design"),
      taskChip("presentation-maker", "Slides"),
    ]);
    const plan = buildPlan(goal, {
      ...NO_OPTIONS,
      toolsUsed: new Set(["canva"]),
    });
    const ids = plan.levels.simple.toolkit.flatMap((g) =>
      g.tools.map((t) => t.toolId),
    );
    expect(ids.filter((id) => id === "canva")).toHaveLength(1);
  });
});

describe("compatibility notes", () => {
  it("states known compatibility between build tools", () => {
    const plan = buildPlan(goalOf("build-an-app"), NO_OPTIONS);
    const notes = plan.levels.advanced.jobs.flatMap((j) =>
      j.compatibilityNote ? [j.compatibilityNote] : [],
    );
    expect(notes.some((note) => note.startsWith("Works with"))).toBe(true);
  });

  it("warns when a build tool has no known link to the others", () => {
    const isolated: Tool = {
      ...catalogue.tools.find((t) => t.id === "nextjs")!,
      id: "island",
      name: "Island",
      providerId: catalogue.tools.find((t) => t.id === "astro")!.providerId,
      jobs: ["framework"],
      fitScores: { framework: 5 },
      worksWith: [],
    };
    const others = catalogue.tools.map((t) => ({
      ...t,
      worksWith: t.worksWith.filter((id) => id !== "island"),
    }));
    const data: Catalogue = {
      ...catalogue,
      tools: [
        isolated,
        ...others.filter(
          (t) =>
            t.id !== "nextjs" &&
            t.id !== "react" &&
            t.id !== "astro" &&
            t.id !== "expo",
        ),
      ],
    };

    const plan = buildPlan(goalOf("build-an-app"), NO_OPTIONS, data);
    const framework = plan.levels.advanced.jobs.find(
      (j) => j.jobId === "framework",
    )!;

    expect(framework.toolId).toBe("island");
    expect(framework.compatibilityNote).toMatch(/^No known compatibility with/);
  });

  it("gives no note to AI tools or when a build tool stands alone", () => {
    const plan = buildPlan(goalOf("study-plan"), NO_OPTIONS);
    for (const job of plan.levels.polished.jobs)
      expect(job.compatibilityNote).toBeNull();
  });
});

describe("errors", () => {
  it("rejects a goal type with no template", () => {
    const data: Catalogue = {
      ...catalogue,
      goals: catalogue.goals.filter((g) => g.id !== "study-plan"),
    };
    expect(() => buildPlan(goalOf("study-plan"), NO_OPTIONS, data)).toThrow(
      /Unknown goal type/,
    );
  });
});

describe("get it links in a plan", () => {
  it.each(GOAL_IDS)(
    "carry the chosen tool's own links, nothing else: %s",
    (goalType) => {
      const plan = buildPlan(goalOf(goalType), NO_OPTIONS);
      let checked = 0;
      for (const level of LEVELS) {
        for (const job of plan.levels[level].jobs) {
          const tool = catalogue.tools.find((t) => t.id === job.toolId)!;
          expect(job.getIt).toEqual(tool.getIt ?? null);
          checked += 1;
        }
      }
      expect(checked).toBeGreaterThan(0);
    },
  );
});
