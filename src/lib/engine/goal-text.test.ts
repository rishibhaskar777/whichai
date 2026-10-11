import { describe, expect, it } from "vitest";
import { catalogue } from "@/data/catalogue";
import { featureChip, goalChip } from "@/lib/plan/chips";
import {
  GOAL_CATEGORIES,
  GOAL_IDS,
  type GoalTemplate,
  type Tool,
} from "@/lib/schemas/catalogue";
import { LEVELS, type GoalType, type UnderstoodGoal } from "@/lib/schemas/plan";
import {
  buildPlan,
  slotFor,
  strengthsFor,
  type BuildOptions,
} from "./build-plan";
import { whyText } from "./describe";

const NO_OPTIONS: BuildOptions = {
  level: "simple",
  budget: null,
  toolsUsed: new Set(),
};

const GENERAL_ASSISTANTS = [
  "chatgpt",
  "claude",
  "gemini",
  "microsoft-copilot",
  "perplexity",
  "grok",
  "deepseek",
  "mistral-vibe",
];

const jobsById = new Map(catalogue.jobs.map((job) => [job.id, job]));
const aiJobIds = new Set(
  catalogue.jobs.filter((job) => job.category === "ai").map((job) => job.id),
);

function goalOf(template: GoalTemplate): UnderstoodGoal {
  return {
    goalType: template.id,
    title: template.title,
    chips: [
      goalChip(template.id, template.title),
      ...template.features.map((f) => featureChip(f.id, f.label)),
    ],
    inferredLevel: "simple",
  };
}

/** The headline and explanation a card would show for a tool in a slot. */
function cardText(
  tool: Tool,
  template: GoalTemplate,
  jobId: string,
  level: (typeof LEVELS)[number],
) {
  const goalLevel = template.levels[level];
  const slot = slotFor(goalLevel, jobsById.get(jobId)!);
  const why = whyText(tool, "new", null, strengthsFor(tool, slot, template));
  return `Use ${tool.name} to ${slot.task}. ${why}`;
}

describe("goal-specific text", () => {
  it("gives every goal, level and job a task, tags and a starter prompt", () => {
    let slots = 0;
    for (const goal of catalogue.goals) {
      for (const level of LEVELS) {
        const goalLevel = goal.levels[level];
        expect(goalLevel.goodFor.length, `${goal.id}/${level}`).toBeGreaterThan(
          0,
        );
        for (const jobId of goalLevel.jobs) {
          const slot = goalLevel.slots[jobId];
          expect(slot, `${goal.id}/${level}/${jobId}`).toBeDefined();
          expect(slot!.task.length).toBeGreaterThan(10);
          expect(slot!.starterPrompt.length).toBeGreaterThan(20);
          expect(slot!.tags.length).toBeGreaterThan(0);
          slots += 1;
        }
      }
    }
    expect(slots).toBeGreaterThan(600);
  });

  it("gives every job a general slot for parts a goal does not cover", () => {
    for (const job of catalogue.jobs) {
      expect(job.defaultSlot.task.length, job.id).toBeGreaterThan(10);
      expect(job.defaultSlot.starterPrompt.length, job.id).toBeGreaterThan(20);
    }
  });

  it("gives every tool that does an AI job strength tags with a note each", () => {
    const aiTools = catalogue.tools.filter(
      (tool) =>
        tool.kind === "ai-tool" || tool.jobs.some((job) => aiJobIds.has(job)),
    );
    expect(aiTools.length).toBeGreaterThan(70);
    for (const tool of aiTools) {
      expect(tool.strengthTags.length, tool.id).toBeGreaterThan(0);
      for (const tag of tool.strengthTags) {
        expect(tool.strengthNotes[tag], `${tool.id}/${tag}`).toBeDefined();
      }
    }
  });

  it("marks category notes for the general assistants as editorial", () => {
    for (const id of GENERAL_ASSISTANTS) {
      const tool = catalogue.tools.find((candidate) => candidate.id === id)!;
      for (const category of GOAL_CATEGORIES) {
        const note = tool.categoryNotes[category];
        expect(note, `${id}/${category}`).toBeDefined();
        expect(note!.source).toBe("editorial");
      }
    }
  });

  it("writes a different task for every goal and level of a job", () => {
    const seen = new Map<string, string>();
    for (const goal of catalogue.goals) {
      for (const level of LEVELS) {
        for (const [jobId, slot] of Object.entries(goal.levels[level].slots)) {
          const key = `${jobId}:${slot.task.toLowerCase()}`;
          expect(seen.get(key), `${goal.id}/${level}/${jobId}`).toBeUndefined();
          seen.set(key, `${goal.id}/${level}`);
        }
      }
    }
  });

  it("renders different card text in each goal for the same tool and job", () => {
    for (const tool of catalogue.tools) {
      const texts = new Map<string, string>();
      for (const goal of catalogue.goals) {
        for (const level of LEVELS) {
          for (const jobId of goal.levels[level].jobs) {
            if (!tool.jobs.includes(jobId)) continue;
            const text = cardText(tool, goal, jobId, level);
            const place = `${goal.id}/${level}/${jobId}`;
            expect(
              texts.get(`${jobId}:${text}`),
              `${tool.id} ${place}`,
            ).toBeUndefined();
            texts.set(`${jobId}:${text}`, place);
          }
        }
      }
    }
  });

  it("changes the card text with the goal and the level in a built plan", () => {
    const text = (goalId: GoalType, level: (typeof LEVELS)[number]) => {
      const template = catalogue.goals.find((g) => g.id === goalId)!;
      const plan = buildPlan(goalOf(template), {
        ...NO_OPTIONS,
        chosenTools: { "ai-assistant": "chatgpt" },
      });
      const job = plan.levels[level].jobs.find(
        (j) => j.jobId === "ai-assistant",
      )!;
      expect(job.toolId).toBe("chatgpt");
      return `${job.task} | ${job.why}`;
    };
    const texts = [
      text("game", "simple"),
      text("game", "advanced"),
      text("blog", "simple"),
      text("essay-writing", "polished"),
    ];
    expect(new Set(texts).size).toBe(texts.length);
  });

  it("gives swapped alternatives the same goal-specific text", () => {
    const game = catalogue.goals.find((g) => g.id === "game")!;
    const base = buildPlan(goalOf(game), NO_OPTIONS).levels.simple.jobs.find(
      (job) => job.jobId === "ai-assistant",
    )!;
    const alternative = base.alternatives[0]!;
    const swapped = buildPlan(goalOf(game), {
      ...NO_OPTIONS,
      chosenTools: { "ai-assistant": alternative.toolId },
    }).levels.simple.jobs.find((job) => job.jobId === "ai-assistant")!;

    expect(swapped.toolId).toBe(alternative.toolId);
    expect(swapped.task).toBe(base.task);
    expect(swapped.starterPrompt).toBe(base.starterPrompt);
    expect(swapped.why).toContain(alternative.toolName);
  });

  it("covers all goals", () => {
    expect(catalogue.goals.map((goal) => goal.id).sort()).toEqual(
      [...GOAL_IDS].sort(),
    );
  });
});

describe("get more data", () => {
  it("shows model names only with the page and the day they were read", () => {
    const named = catalogue.tools.filter((tool) => tool.models?.length);
    expect(named.length).toBeGreaterThan(0);
    for (const tool of named) {
      expect(tool.modelsUrl, tool.id).toBeDefined();
      expect(tool.modelsCheckedOn, tool.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    for (const goal of catalogue.goals) {
      const plan = buildPlan(goalOf(goal), NO_OPTIONS);
      for (const level of LEVELS) {
        for (const job of plan.levels[level].jobs) {
          if (!job.getMore?.models) continue;
          const tool = catalogue.tools.find((t) => t.id === job.toolId)!;
          expect(job.getMore.models.checkedOn).toBe(tool.modelsCheckedOn);
          expect(job.getMore.models.url).toBe(tool.modelsUrl);
        }
      }
    }
  });

  it("offers add-ons that are catalogue tools", () => {
    const ids = new Set(catalogue.tools.map((tool) => tool.id));
    let withAddOns = 0;
    for (const tool of catalogue.tools) {
      for (const entry of tool.enhancedBy) {
        expect(ids.has(entry.toolId), `${tool.id} -> ${entry.toolId}`).toBe(
          true,
        );
        withAddOns += 1;
      }
    }
    expect(withAddOns).toBeGreaterThan(0);
  });

  it("builds nothing for a tool that is not an AI tool or has no data", () => {
    const plan = buildPlan(
      goalOf(catalogue.goals.find((g) => g.id === "portfolio-website")!),
      NO_OPTIONS,
    );
    for (const level of LEVELS) {
      for (const job of plan.levels[level].jobs) {
        if (job.kind !== "ai-tool") expect(job.getMore).toBeNull();
        if (job.getMore) {
          const { models, tips, addOns, freePlanTips } = job.getMore;
          expect(
            models !== null ||
              tips.length > 0 ||
              addOns.length > 0 ||
              freePlanTips.length > 0,
          ).toBe(true);
        }
      }
    }
  });

  it("only lists add-ons that help the goal's category", () => {
    const template = catalogue.goals.find((g) => g.id === "game")!;
    const plan = buildPlan(goalOf(template), {
      ...NO_OPTIONS,
      chosenTools: { "ai-assistant": "gemini" },
    });
    const job = plan.levels.simple.jobs.find(
      (j) => j.jobId === "ai-assistant",
    )!;
    const tool = catalogue.tools.find((t) => t.id === "gemini")!;
    const expected = tool.enhancedBy
      .filter((entry) => entry.categories.includes("games"))
      .map((entry) => entry.toolId);
    expect(job.getMore?.addOns.map((a) => a.toolId) ?? []).toEqual(expected);
  });
});
