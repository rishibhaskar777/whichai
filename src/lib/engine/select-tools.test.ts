import { describe, expect, it } from "vitest";
import type { Tool } from "@/lib/schemas/catalogue";
import {
  KEEP_MARGIN,
  fitsBudget,
  fitsLevel,
  hashText,
  isCompatible,
  rankTools,
  selectForJob,
  type SelectionContext,
} from "./select-tools";

function tool(id: string, patch: Partial<Tool> = {}): Tool {
  const jobs = patch.jobs ?? ["writing"];
  return {
    id,
    name: id.toUpperCase(),
    providerId: `provider-${id}`,
    jobs,
    summary: `${id} summary`,
    kind: "ai-tool",
    skillLevel: "beginner",
    hasFreeOption: true,
    pricing: "[verify]",
    platforms: ["web"],
    worksWith: [],
    includes: [],
    strengths: [`${id} strength`],
    watchOutFor: [`${id} caution`],
    fitScores: Object.fromEntries(jobs.map((job) => [job, 3])),
    scoreSource: "editorial-estimate",
    officialUrl: `https://${id}.example.com`,
    verified: false,
    lastVerified: null,
    ...patch,
  };
}

function context(patch: Partial<SelectionContext> = {}): SelectionContext {
  return {
    level: "advanced",
    budget: null,
    toolsUsed: new Set(),
    chosen: [],
    seed: "goal:writing",
    ...patch,
  };
}

describe("level filter", () => {
  it("allows a tool only up to its skill level", () => {
    const beginner = tool("a", { skillLevel: "beginner" });
    const intermediate = tool("b", { skillLevel: "intermediate" });
    const advanced = tool("c", { skillLevel: "advanced" });

    expect(
      [beginner, intermediate, advanced].map((t) => fitsLevel(t, "simple")),
    ).toEqual([true, false, false]);
    expect(
      [beginner, intermediate, advanced].map((t) => fitsLevel(t, "polished")),
    ).toEqual([true, true, false]);
    expect(
      [beginner, intermediate, advanced].map((t) => fitsLevel(t, "advanced")),
    ).toEqual([true, true, true]);
  });

  it("keeps a harder tool out of the simple level when an easier one exists", () => {
    const hard = tool("hard", {
      skillLevel: "advanced",
      fitScores: { writing: 5 },
    });
    const easy = tool("easy", { fitScores: { writing: 3 } });

    const selection = selectForJob(
      "writing",
      [hard, easy],
      context({ level: "simple" }),
    );

    expect(selection?.pick.id).toBe("easy");
    expect(selection?.levelStretched).toBe(false);
  });

  it("falls back to a harder tool, and says so, when nothing easier exists", () => {
    const hard = tool("hard", { skillLevel: "advanced" });

    const selection = selectForJob(
      "writing",
      [hard],
      context({ level: "simple" }),
    );

    expect(selection?.pick.id).toBe("hard");
    expect(selection?.levelStretched).toBe(true);
  });
});

describe("budget filter", () => {
  it("excludes paid-only tools at a zero budget, but not unconfirmed ones", () => {
    expect(fitsBudget(tool("p", { hasFreeOption: false }), "zero")).toBe(false);
    expect(fitsBudget(tool("f", { hasFreeOption: true }), "zero")).toBe(true);
    expect(fitsBudget(tool("v", { hasFreeOption: "verify" }), "zero")).toBe(
      true,
    );
  });

  it("does not filter any other budget, or no answer", () => {
    const paid = tool("p", { hasFreeOption: false });
    for (const budget of ["under-1000", "1000-3000", "more", null] as const) {
      expect(fitsBudget(paid, budget)).toBe(true);
    }
  });

  it("never picks or offers a paid-only tool at zero", () => {
    const paid = tool("paid", {
      hasFreeOption: false,
      fitScores: { writing: 5 },
    });
    const free = tool("free", { fitScores: { writing: 2 } });

    const selection = selectForJob(
      "writing",
      [paid, free],
      context({ budget: "zero" }),
    );

    expect(selection?.pick.id).toBe("free");
    expect(selection?.alternatives).toEqual([]);
  });

  it("returns nothing when every tool needs payment at zero", () => {
    const paid = tool("paid", { hasFreeOption: false });
    expect(
      selectForJob("writing", [paid], context({ budget: "zero" })),
    ).toBeNull();
  });
});

describe("ranking and variety", () => {
  it("ranks by fit score first", () => {
    const ranked = rankTools(
      [
        tool("low", { fitScores: { writing: 2 } }),
        tool("high", { fitScores: { writing: 5 } }),
      ],
      "writing",
      [],
      "seed",
    );
    expect(ranked.map((t) => t.id)).toEqual(["high", "low"]);
  });

  it("prefers a provider that is not already in the plan when scores tie", () => {
    const sameCompany = tool("same", { providerId: "acme" });
    const otherCompany = tool("other", { providerId: "globex" });
    const chosen = [
      tool("already", { providerId: "acme", jobs: ["other-job"] }),
    ];

    for (const order of [
      [sameCompany, otherCompany],
      [otherCompany, sameCompany],
    ]) {
      expect(rankTools(order, "writing", chosen, "seed")[0]?.id).toBe("other");
    }
  });

  it("does not let variety beat a higher score", () => {
    const better = tool("better", {
      providerId: "acme",
      fitScores: { writing: 5 },
    });
    const other = tool("other", {
      providerId: "globex",
      fitScores: { writing: 4 },
    });
    const chosen = [
      tool("already", { providerId: "acme", jobs: ["other-job"] }),
    ];

    expect(rankTools([other, better], "writing", chosen, "seed")[0]?.id).toBe(
      "better",
    );
  });

  it("prefers a tool that works with those already chosen when everything else ties", () => {
    const friend = tool("friend", { providerId: "p1" });
    const stranger = tool("stranger", { providerId: "p2" });
    const chosen = [
      tool("base", {
        providerId: "p3",
        jobs: ["other-job"],
        worksWith: ["friend"],
      }),
    ];

    expect(
      rankTools([stranger, friend], "writing", chosen, "seed")[0]?.id,
    ).toBe("friend");
  });

  it("is deterministic, and varies equal tools between seeds", () => {
    const tools = Array.from({ length: 6 }, (_, index) => tool(`t${index}`));
    const first = (seed: string) =>
      rankTools(tools, "writing", [], seed)[0]?.id;

    expect(first("a")).toBe(first("a"));
    const winners = new Set(
      ["a", "b", "c", "d", "e", "f", "g", "h"].map(first),
    );
    expect(winners.size).toBeGreaterThan(1);
    expect(hashText("same")).toBe(hashText("same"));
  });

  it("picks one recommendation and at most two alternatives, from other companies", () => {
    const tools = ["a", "b", "c", "d"].map((id) => tool(id));

    const selection = selectForJob("writing", tools, context());

    expect(selection?.alternatives).toHaveLength(2);
    const ids = [
      selection?.pick.id,
      ...(selection?.alternatives.map((t) => t.id) ?? []),
    ];
    expect(new Set(ids).size).toBe(3);
  });

  it("spreads a plan across companies when the same company has several equal tools", () => {
    const tools = [
      tool("a1", { providerId: "acme" }),
      tool("a2", { providerId: "acme" }),
      tool("g1", { providerId: "globex" }),
    ];

    const selection = selectForJob("writing", tools, context());
    const providers = [selection?.pick, ...(selection?.alternatives ?? [])].map(
      (t) => t?.providerId,
    );

    expect(providers.slice(0, 2).sort()).toEqual(["acme", "globex"]);
  });
});

describe("keep, better and new", () => {
  const best = tool("best", { fitScores: { writing: 5 } });
  const close = tool("close", { fitScores: { writing: 5 - KEEP_MARGIN } });
  const weak = tool("weak", { fitScores: { writing: 5 - KEEP_MARGIN - 1 } });
  const all = [best, close, weak];

  it("tags a recommendation new when the person uses nothing for the job", () => {
    const selection = selectForJob("writing", all, context());
    expect(selection?.tag).toBe("new");
    expect(selection?.pick.id).toBe("best");
  });

  it("keeps a tool the person uses when it is within one point of the best", () => {
    const selection = selectForJob(
      "writing",
      all,
      context({ toolsUsed: new Set(["close"]) }),
    );
    expect(selection?.tag).toBe("keep");
    expect(selection?.pick.id).toBe("close");
    expect(selection?.alternatives.map((t) => t.id)).toContain("best");
  });

  it("keeps the best tool when the person already uses it", () => {
    const selection = selectForJob(
      "writing",
      all,
      context({ toolsUsed: new Set(["best"]) }),
    );
    expect(selection?.tag).toBe("keep");
    expect(selection?.pick.id).toBe("best");
  });

  it("calls the best tool a better option when the person uses a lower-scoring one", () => {
    const selection = selectForJob(
      "writing",
      all,
      context({ toolsUsed: new Set(["weak"]) }),
    );
    expect(selection?.tag).toBe("better");
    expect(selection?.pick.id).toBe("best");
    expect(selection?.outscored?.id).toBe("weak");
  });

  it("judges the highest-scoring of several tools the person uses", () => {
    const selection = selectForJob(
      "writing",
      all,
      context({ toolsUsed: new Set(["weak", "close"]) }),
    );
    expect(selection?.tag).toBe("keep");
    expect(selection?.pick.id).toBe("close");
  });

  it("ignores tools used for other jobs", () => {
    const elsewhere = tool("elsewhere", { jobs: ["other-job"] });
    const selection = selectForJob(
      "writing",
      [...all, elsewhere],
      context({ toolsUsed: new Set(["elsewhere"]) }),
    );
    expect(selection?.tag).toBe("new");
  });
});

describe("compatibility", () => {
  it("is symmetrical", () => {
    const a = tool("a", { worksWith: ["b"] });
    const b = tool("b");
    expect(isCompatible(a, b)).toBe(true);
    expect(isCompatible(b, a)).toBe(true);
    expect(isCompatible(a, tool("c"))).toBe(false);
  });
});
