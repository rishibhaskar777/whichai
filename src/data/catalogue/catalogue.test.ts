import { describe, expect, it } from "vitest";
import {
  collectStrings,
  findProblems,
  hasConcretePrice,
  withoutVerifiedPricing,
} from "@/lib/catalogue/validate";
import {
  GOAL_IDS,
  catalogueSchema,
  toolSchema,
  type Catalogue,
} from "@/lib/schemas/catalogue";
import { catalogue, toolFiles } from ".";
import goalsJson from "./goals.json";
import jobsJson from "./jobs.json";
import modelClassesJson from "./model-classes.json";
import providersJson from "./providers.json";

const raw = {
  providers: providersJson,
  jobs: jobsJson,
  tools: Object.values(toolFiles).flat(),
  modelClasses: modelClassesJson,
  goals: goalsJson,
};

describe("catalogue data files", () => {
  it("validate against the schemas", () => {
    const result = catalogueSchema.safeParse(raw);
    expect(result.success ? [] : result.error.issues).toEqual([]);
  });

  it("have no broken references, duplicate ids or concrete prices", () => {
    expect(findProblems(catalogue)).toEqual([]);
  });

  it("use https for every link, and only root pages", () => {
    const urls = [
      ...catalogue.providers.map((provider) => provider.homepage),
      ...catalogue.tools.map((tool) => tool.officialUrl),
    ];
    expect(urls.length).toBeGreaterThan(100);
    for (const url of urls) {
      expect(new URL(url).protocol).toBe("https:");
    }
    // Only projects on a shared host may point below the root.
    for (const url of urls) {
      const { hostname, pathname } = new URL(url);
      const shared =
        hostname === "github.com" ||
        hostname === "search.google.com" ||
        hostname.endsWith(".github.io");
      if (!shared) expect(pathname, url).toBe("/");
    }
  });

  it("keep the verification fields consistent, with editorial scores only", () => {
    for (const tool of catalogue.tools) {
      expect(tool.lastVerified !== null, tool.id).toBe(tool.verified);
      if (!tool.verified) expect(tool.pricing).toBe("[verify]");
      expect(tool.scoreSource).toBe("editorial-estimate");
    }
  });

  it("contain no concrete price anywhere", () => {
    for (const text of collectStrings(withoutVerifiedPricing(catalogue))) {
      expect(hasConcretePrice(text), text).toBe(false);
    }
  });

  it("do not name specific model versions", () => {
    const text = collectStrings(raw.modelClasses).join(" ");
    expect(text).not.toMatch(/\bgpt|opus|sonnet|haiku|gemini \d|\bo\d\b/i);
  });
});

describe("catalogue coverage", () => {
  it("has the jobs the plans rely on", () => {
    const ids = catalogue.jobs.map((job) => job.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "ai-assistant",
        "research-with-sources",
        "coding-assistant",
        "image-generation",
        "video-generation",
        "voice-and-audio",
        "presentation-maker",
        "writing-and-editing",
        "note-taking",
        "flashcards-and-quizzes",
        "ui-templates",
        "component-library",
        "animation-library",
        "framework",
        "content-management",
        "database",
        "authentication",
        "payments-india",
        "hosting",
        "analytics",
        "contact-form",
        "resume-builder",
        "design-tool",
      ]),
    );
  });

  it("has a good number of tools from many companies", () => {
    expect(catalogue.tools.length).toBeGreaterThanOrEqual(200);
    expect(catalogue.tools.length).toBeLessThanOrEqual(300);
    const providers = new Set(catalogue.tools.map((tool) => tool.providerId));
    expect(providers.size).toBeGreaterThanOrEqual(100);
  });

  it("has at least three tools for every job", () => {
    for (const job of catalogue.jobs) {
      const count = catalogue.tools.filter((tool) =>
        tool.jobs.includes(job.id),
      ).length;
      expect(count, job.id).toBeGreaterThanOrEqual(3);
    }
  });

  it("has a free or unconfirmed option for every job, so a zero budget still gets a pick", () => {
    for (const job of catalogue.jobs) {
      const usable = catalogue.tools.filter(
        (tool) => tool.jobs.includes(job.id) && tool.hasFreeOption !== false,
      );
      expect(usable.length, job.id).toBeGreaterThanOrEqual(1);
    }
  });

  it("includes open-source and India-relevant options", () => {
    const ids = catalogue.tools.map((tool) => tool.id);
    expect(ids).toEqual(
      expect.arrayContaining(["razorpay", "cashfree", "payu"]),
    );
    const open = catalogue.tools.filter((tool) => tool.hasFreeOption === true);
    expect(open.length).toBeGreaterThan(15);
  });

  it("has one goal template per goal id", () => {
    expect(catalogue.goals.map((goal) => goal.id).sort()).toEqual(
      [...GOAL_IDS].sort(),
    );
  });

  it("gives every goal level steps, mistakes and upgrade advice", () => {
    for (const goal of catalogue.goals) {
      for (const level of Object.values(goal.levels)) {
        expect(level.steps.length).toBeGreaterThan(0);
        expect(level.commonMistakes.length).toBeGreaterThan(0);
        expect(level.whenToUpgrade.length).toBeGreaterThan(0);
      }
    }
  });

  it("gives accuracy-sensitive goals a fact-check note at every level", () => {
    for (const id of [
      "study-plan",
      "research-and-reading",
      "resume-and-job-search",
    ]) {
      const goal = catalogue.goals.find((candidate) => candidate.id === id);
      for (const level of Object.values(goal?.levels ?? {})) {
        expect(level.checkTheFacts, id).toBeTruthy();
      }
    }
  });
});

describe("catalogue files", () => {
  it("keeps each tool in the file for its first job's category", () => {
    const jobCategory = new Map(
      catalogue.jobs.map((job) => [job.id, job.category]),
    );
    for (const [category, tools] of Object.entries(toolFiles)) {
      for (const tool of tools) {
        expect(jobCategory.get(tool.jobs[0]!), tool.id).toBe(category);
      }
    }
  });

  it("has well-known general assistants from several companies", () => {
    const ids = catalogue.tools.map((tool) => tool.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "chatgpt",
        "claude",
        "gemini",
        "grok",
        "perplexity",
        "microsoft-copilot",
        "meta-ai",
        "deepseek",
      ]),
    );
    const assistants = catalogue.tools.filter((tool) =>
      tool.jobs.includes("ai-assistant"),
    );
    expect(
      new Set(assistants.map((tool) => tool.providerId)).size,
    ).toBeGreaterThan(8);
  });

  it("has the new kinds and jobs", () => {
    const kinds = new Set(catalogue.tools.map((tool) => tool.kind));
    for (const kind of ["model", "extension", "cli"] as const) {
      expect(kinds.has(kind), kind).toBe(true);
    }
    const jobs = catalogue.jobs.map((job) => job.id);
    expect(jobs).toEqual(
      expect.arrayContaining([
        "run-ai-locally",
        "browser-extension",
        "meeting-notes-and-transcription",
        "translation",
        "music-generation",
        "data-analysis",
        "spreadsheet-ai",
        "automation-and-workflows",
        "chatbot-builder",
        "pdf-and-document-chat",
        "email-writing",
        "social-media",
        "seo",
        "3d-and-design-assets",
      ]),
    );
  });

  it("keeps every record unverified until a person checks it", () => {
    for (const tool of catalogue.tools) {
      expect(tool.verified, tool.id).toBe(false);
      expect(tool.lastVerified, tool.id).toBeNull();
      expect(tool.pricing, tool.id).toBe("[verify]");
    }
  });
});

describe("tool schema rules", () => {
  const sample = catalogue.tools[0]!;

  it("rejects non-https links", () => {
    const result = toolSchema.safeParse({
      ...sample,
      officialUrl: "http://example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects scores outside 1 to 5 or for a job the tool does not do", () => {
    const job = sample.jobs[0]!;
    const tooHigh = { ...sample.fitScores, [job]: 6 };
    const extra = { ...sample.fitScores, "other-job": 3 };
    expect(
      toolSchema.safeParse({ ...sample, fitScores: tooHigh }).success,
    ).toBe(false);
    expect(toolSchema.safeParse({ ...sample, fitScores: extra }).success).toBe(
      false,
    );
  });

  it("requires a verified record to carry its check date", () => {
    const withoutDate = { ...sample, verified: true, lastVerified: null };
    expect(toolSchema.safeParse(withoutDate).success).toBe(false);

    const checked = {
      ...sample,
      verified: true,
      lastVerified: "2026-10-09",
      pricing: "Checked on the official page.",
    };
    expect(toolSchema.safeParse(checked).success).toBe(true);
  });

  it("keeps an unverified record on the placeholder", () => {
    const priced = { ...sample, pricing: "Free forever" };
    const dated = { ...sample, lastVerified: "2026-10-09" };
    expect(toolSchema.safeParse(priced).success).toBe(false);
    expect(toolSchema.safeParse(dated).success).toBe(false);
  });
});

describe("findProblems", () => {
  function withTool(patch: Partial<Catalogue["tools"][number]>): Catalogue {
    const [first, ...rest] = catalogue.tools;
    return { ...catalogue, tools: [{ ...first!, ...patch }, ...rest] };
  }

  it("reports unknown providers and compatible tools", () => {
    const firstId = catalogue.tools[0]!.id;
    expect(findProblems(withTool({ providerId: "nobody" }))).toContain(
      `tool ${firstId}: unknown provider nobody`,
    );
    expect(findProblems(withTool({ worksWith: ["no-such-tool"] })).join()).toMatch(
      /unknown tool no-such-tool/,
    );
  });

  it("reports an included job that is unknown or already listed", () => {
    const unknown = withTool({ includes: ["nope"] });
    expect(findProblems(unknown).join()).toMatch(/includes unknown job nope/);
    const listed = withTool({ includes: [catalogue.tools[0]!.jobs[0]!] });
    expect(findProblems(listed).join()).toMatch(/already lists/);
  });

  it("reports duplicate ids and non-root links", () => {
    const duplicate = {
      ...catalogue,
      tools: [...catalogue.tools, catalogue.tools[0]!],
    };
    expect(findProblems(duplicate).join()).toMatch(/duplicate id/);
    const deep = withTool({ officialUrl: "https://example.com/deep/page" });
    expect(findProblems(deep).join()).toMatch(/root page/);
  });

  it("allows a price in the pricing text of a verified record", () => {
    const checked = withTool({
      verified: true,
      lastVerified: "2026-10-09",
      pricing: "Paid plan: $20 per month. Checked on the official page.",
    });
    expect(findProblems(checked)).toEqual([]);
  });

  it("reports a price in a verified record outside its pricing text", () => {
    const checked = withTool({
      verified: true,
      lastVerified: "2026-10-09",
      summary: "Costs $20 a month.",
    });
    expect(findProblems(checked).join()).toMatch(/concrete price/);
  });

  it("reports a concrete price", () => {
    const priced = withTool({ summary: "Costs $20 a month." });
    expect(findProblems(priced).join()).toMatch(/concrete price/);
  });

  it("reports a goal that points at an unknown job", () => {
    const goals = catalogue.goals.map((goal, index) =>
      index === 0
        ? {
            ...goal,
            features: [
              { id: "x", label: "X", keywords: ["x"], jobs: ["nope"] },
            ],
          }
        : goal,
    );
    expect(findProblems({ ...catalogue, goals }).join()).toMatch(
      /unknown job nope/,
    );
  });
});

describe("price detection", () => {
  it.each(["₹499", "Rs. 500", "$20", "USD 5", "20 dollars", "₹ 1,000"])(
    "flags %s",
    (text) => expect(hasConcretePrice(text)).toBe(true),
  );

  it.each(["₹[verify]", "[verify]", "Free option: [verify]", "Plan 2 of 3"])(
    "allows %s",
    (text) => expect(hasConcretePrice(text)).toBe(false),
  );
});
