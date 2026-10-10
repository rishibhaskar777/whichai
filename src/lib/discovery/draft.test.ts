import { describe, expect, it } from "vitest";
import { catalogue } from "@/data/catalogue";
import { findProblems } from "@/lib/catalogue/validate";
import { catalogueSchema, toolSchema } from "@/lib/schemas/catalogue";
import {
  DRAFT_MARKER,
  buildDraft,
  parseDraftComment,
  renderDraftComment,
} from "./draft";
import type { CandidateState } from "./types";

const providers = catalogue.providers;
const toolIds = new Set(catalogue.tools.map((tool) => tool.id));

function state(overrides: Partial<CandidateState> = {}): CandidateState {
  return {
    version: 1,
    id: "notefox",
    name: "Notefox",
    description: "Turns meeting notes into slides",
    homepage: "https://notefox.app/",
    repository: "https://github.com/notefox-app/notefox",
    announcement: null,
    maintainer: "notefox-app",
    kind: "ai-tool",
    keys: ["name:notefox"],
    sources: [
      { source: "github", url: "https://github.com/notefox-app/notefox" },
    ],
    topics: [],
    jobs: ["presentation-maker"],
    firstSeen: "2026-08-01",
    lastSeen: "2026-10-08",
    history: [{ date: "2026-10-08", signals: { githubStars: 1200 } }],
    homepageCheck: null,
    ...overrides,
  };
}

const jobId = catalogue.jobs[0]!.id;

describe("buildDraft", () => {
  it("makes an unverified record in the catalogue's own schema", () => {
    const draft = buildDraft(state({ jobs: [jobId] }), { providers, toolIds });
    const parsed = toolSchema.parse(draft.tool);
    expect(parsed.verified).toBe(false);
    expect(parsed.lastVerified).toBeNull();
    expect(parsed.pricing).toBe("[verify]");
    expect(parsed.hasFreeOption).toBe("verify");
    expect(parsed.scoreSource).toBe("editorial-estimate");
    expect(parsed.getIt).toEqual({});
    expect(parsed.fitScores).toEqual({ [jobId]: 3 });
  });

  it("fills the fields the review asked for", () => {
    const draft = buildDraft(state({ jobs: [jobId] }), { providers, toolIds });
    expect(draft.tool).toMatchObject({
      name: "Notefox",
      summary: "Turns meeting notes into slides",
      kind: "ai-tool",
      officialUrl: "https://notefox.app/",
    });
    expect(draft.tool.officialDomains).toEqual([
      "notefox.app",
      "github.com/notefox-app",
    ]);
    expect(draft.provider).toEqual({
      id: "notefox-app",
      name: "notefox-app",
      homepage: "https://notefox.app",
    });
  });

  it("reuses a provider the catalogue already has", () => {
    const existing = providers[0]!;
    const draft = buildDraft(
      state({ maintainer: existing.name, jobs: [jobId] }),
      {
        providers,
        toolIds,
      },
    );
    expect(draft.provider.id).toBe(existing.id);
  });

  it("never reuses a tool id", () => {
    const taken = catalogue.tools[0]!.id;
    const draft = buildDraft(state({ id: taken, jobs: [jobId] }), {
      providers,
      toolIds,
    });
    expect(draft.tool.id).not.toBe(taken);
    expect(toolIds.has(String(draft.tool.id))).toBe(false);
  });

  it("falls back to a placeholder summary and a job to choose", () => {
    const draft = buildDraft(state({ description: "", jobs: [] }), {
      providers,
      toolIds,
    });
    expect(draft.tool.summary).toContain("to be written during review");
    expect(draft.tool.jobs).toEqual(["ai-assistant"]);
  });

  it("does not carry a price into the summary", () => {
    const draft = buildDraft(
      state({ description: "Just $20/month for everything", jobs: [jobId] }),
      { providers, toolIds },
    );
    expect(String(draft.tool.summary)).not.toContain("$20");
  });

  it("works for a repository-only project and an announcement-only product", () => {
    const repoOnly = buildDraft(
      state({ homepage: null, jobs: [jobId], kind: "cli" }),
      { providers, toolIds },
    );
    expect(repoOnly.tool.officialUrl).toBe(
      "https://github.com/notefox-app/notefox",
    );
    expect(repoOnly.tool.platforms).toEqual(["command-line"]);

    const announced = buildDraft(
      state({
        homepage: null,
        repository: null,
        announcement: "https://openai.com/index/foo",
        maintainer: "OpenAI",
        jobs: [jobId],
      }),
      { providers, toolIds },
    );
    expect(announced.tool.officialUrl).toBe("https://openai.com");
    expect(announced.tool.officialDomains).toEqual(["openai.com"]);
  });

  it("passes every catalogue check once added, with a new provider", () => {
    for (const candidate of [
      state({ jobs: [jobId] }),
      state({ homepage: null, jobs: [jobId] }),
      state({
        homepage: null,
        repository: "https://huggingface.co/acme/model-x",
        maintainer: "acme",
        kind: "model",
        jobs: [jobId],
      }),
    ]) {
      const draft = buildDraft(candidate, { providers, toolIds });
      const parsed = draftTool(draft);
      const merged = catalogueSchema.parse({
        providers: providers.some((p) => p.id === draft.provider.id)
          ? providers
          : [...providers, draft.provider],
        jobs: catalogue.jobs,
        tools: [...catalogue.tools, parsed],
        modelClasses: catalogue.modelClasses,
        goals: catalogue.goals,
      });
      expect(findProblems(merged)).toEqual([]);
    }
  });
});

function draftTool(draft: ReturnType<typeof buildDraft>) {
  return toolSchema.parse(draft.tool);
}

describe("the draft comment", () => {
  it("round-trips", () => {
    const draft = buildDraft(state({ jobs: [jobId] }), { providers, toolIds });
    const comment = renderDraftComment(draft, 12);
    expect(comment.startsWith(DRAFT_MARKER)).toBe(true);
    expect(comment).toContain("npm run discover:import -- 12");
    expect(parseDraftComment(comment)).toEqual(draft);
  });

  it("is not read from a comment that does not start with the marker", () => {
    const draft = buildDraft(state({ jobs: [jobId] }), { providers, toolIds });
    const comment = renderDraftComment(draft, 12);
    expect(parseDraftComment(`hello\n${comment}`)).toBeNull();
    expect(parseDraftComment("plain comment")).toBeNull();
  });

  it("returns null for a draft with broken JSON", () => {
    expect(
      parseDraftComment(`${DRAFT_MARKER}\n\`\`\`json\n{oops\n\`\`\``),
    ).toBeNull();
  });
});
