import { describe, expect, it } from "vitest";
import { catalogue } from "@/data/catalogue";
import { buildDraft } from "./draft";
import { checkDraft, type CatalogueParts } from "./import";
import type { CandidateState } from "./types";

const parts: CatalogueParts = {
  providers: catalogue.providers,
  jobs: catalogue.jobs,
  tools: catalogue.tools,
  modelClasses: catalogue.modelClasses,
  goals: catalogue.goals,
};

const jobId = catalogue.jobs[0]!;

const candidate: CandidateState = {
  version: 1,
  id: "notefox",
  name: "Notefox",
  description: "Turns meeting notes into slides",
  homepage: "https://notefox.app/",
  repository: "https://github.com/notefox-app/notefox",
  announcement: null,
  maintainer: "notefox-app",
  kind: "ai-tool",
  keys: [],
  sources: [],
  topics: [],
  jobs: [jobId.id],
  firstSeen: "2026-08-01",
  lastSeen: "2026-10-08",
  history: [],
  homepageCheck: null,
};

function draft() {
  return buildDraft(candidate, {
    providers: catalogue.providers,
    toolIds: new Set(catalogue.tools.map((tool) => tool.id)),
  });
}

describe("checkDraft", () => {
  it("accepts a draft the workflow would post", () => {
    const result = checkDraft(draft(), parts);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.providerIsNew).toBe(true);
      expect(result.category).toBe(jobId.category);
      expect(result.tool.verified).toBe(false);
    }
  });

  it("rejects something that is not a draft", () => {
    expect(checkDraft(null, parts).ok).toBe(false);
    expect(checkDraft({ tool: {} }, parts).ok).toBe(false);
  });

  it("rejects a record that breaks the schema", () => {
    const broken = draft();
    broken.tool.officialUrl = "http://notefox.app/";
    const result = checkDraft(broken, parts);
    expect(result.ok).toBe(false);
  });

  it("rejects a verified record without a date and an unverified one with a price", () => {
    const verified = draft();
    verified.tool.verified = true;
    expect(checkDraft(verified, parts).ok).toBe(false);

    const priced = draft();
    priced.tool.pricing = "$10 per month";
    expect(checkDraft(priced, parts).ok).toBe(false);
  });

  it("rejects an id that already exists", () => {
    const duplicate = draft();
    duplicate.tool.id = catalogue.tools[0]!.id;
    const result = checkDraft(duplicate, parts);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join()).toContain("duplicate id");
  });

  it("rejects an unknown job and a link off the tool's domains", () => {
    const unknownJob = draft();
    unknownJob.tool.jobs = ["no-such-job"];
    unknownJob.tool.fitScores = { "no-such-job": 3 };
    expect(checkDraft(unknownJob, parts).ok).toBe(false);

    const offDomain = draft();
    offDomain.tool.getIt = {
      windows: {
        url: "https://download.example.net/app.exe",
        linkCheckedOn: null,
      },
    };
    offDomain.tool.platforms = ["web", "windows"];
    expect(checkDraft(offDomain, parts).ok).toBe(false);
  });

  it("reuses an existing provider", () => {
    const existing = catalogue.providers[0]!;
    const reuse = buildDraft(
      { ...candidate, maintainer: existing.name },
      {
        providers: catalogue.providers,
        toolIds: new Set(catalogue.tools.map((tool) => tool.id)),
      },
    );
    const result = checkDraft(reuse, parts);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.providerIsNew).toBe(false);
  });
});
