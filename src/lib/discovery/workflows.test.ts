import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import configJson from "@/data/discovery/config.json";
import rejectedJson from "@/data/discovery/rejected.json";
import { parseConfig, parseRejected } from "./config";

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8");

const workflows = {
  discovery: read(".github/workflows/tool-discovery.yml"),
  approved: read(".github/workflows/tool-approved.yml"),
};

describe.each(Object.entries(workflows))("workflow %s", (_name, text) => {
  it("has contents: read and issues: write permissions only", () => {
    const block = /^permissions:\n((?:  .+\n)+)/m.exec(text)?.[1] ?? "";
    expect(
      block
        .trim()
        .split("\n")
        .map((line) => line.trim())
        .sort(),
    ).toEqual(["contents: read", "issues: write"]);
  });

  it("pins every action to a full commit SHA", () => {
    const uses = [...text.matchAll(/uses:\s*(\S+)/g)].map((match) => match[1]!);
    expect(uses.length).toBeGreaterThan(0);
    for (const reference of uses) {
      expect(reference).toMatch(/@[0-9a-f]{40}$/);
    }
  });

  it("installs without running package scripts", () => {
    expect(text).toContain("npm ci --ignore-scripts");
  });

  it("cannot change the catalogue or the repository", () => {
    for (const forbidden of [
      "git push",
      "git commit",
      "git add",
      "gh pr",
      "pull_request",
      "contents: write",
      "pull-requests",
    ]) {
      expect(text).not.toContain(forbidden);
    }
  });

  it("does not interpolate issue text into a script", () => {
    expect(text).not.toMatch(/\$\{\{\s*github\.event\.issue\.(title|body)/);
    expect(text).not.toMatch(/\$\{\{\s*github\.event\.(comment|label)\.body/);
  });
});

describe("the weekly workflow", () => {
  it("runs weekly and by hand, and never overlaps itself", () => {
    expect(workflows.discovery).toMatch(/schedule:\n\s+- cron: "[^"]+"/);
    expect(workflows.discovery).toContain("workflow_dispatch:");
    expect(workflows.discovery).toMatch(
      /concurrency:\n\s+group: tool-discovery/,
    );
    expect(workflows.discovery).toContain("cancel-in-progress: false");
  });
});

describe("the approval workflow", () => {
  it("runs only when the approved label is added", () => {
    expect(workflows.approved).toContain("types: [labeled]");
    expect(workflows.approved).toContain(
      "github.event.label.name == 'approved'",
    );
  });
});

describe("the scripts", () => {
  it("never write files, and never start other programs, in the job that runs on GitHub", () => {
    for (const path of ["scripts/discover.ts", "scripts/discover-draft.ts"]) {
      const text = read(path);
      expect(text).not.toContain("writeFileSync");
      expect(text).not.toContain("child_process");
    }
  });

  it("only the local import script writes catalogue files", () => {
    expect(read("scripts/discover-import.ts")).toContain("writeFileSync");
  });
});

describe("the data files", () => {
  it("has a valid configuration with the documented defaults", () => {
    const config = parseConfig(configJson);
    expect(config.minAgeDays).toBe(30);
    expect(config.maxNewIssuesPerRun).toBe(5);
    expect(config.required).toEqual({ strongSignals: 1, moderateSignals: 2 });
    expect(config.watchlist.expireAfterDays).toBe(90);
    expect(config.watchlist.reAddAfterDays).toBe(180);
    expect(config.watchlist.summaryRows).toBe(20);
  });

  it("keeps the watchlist body under GitHub's issue body limit", () => {
    const config = parseConfig(configJson);
    expect(config.watchlist.maxBodyChars).toBeLessThan(65536);
  });

  it("has a valid rejected list", () => {
    expect(() => parseRejected(rejectedJson)).not.toThrow();
  });

  it("ranks strong thresholds above moderate ones", () => {
    const { strong, moderate } = parseConfig(configJson);
    expect(strong.githubStars).toBeGreaterThan(moderate.githubStars);
    expect(strong.hfLikes).toBeGreaterThan(moderate.hfLikes);
    expect(strong.hnPoints).toBeGreaterThan(moderate.hnPoints);
  });

  it("asks more of a source than it asks of a signal", () => {
    const { github, huggingface, hackernews, moderate } =
      parseConfig(configJson);
    expect(github.minStars).toBeGreaterThanOrEqual(moderate.githubStars);
    expect(huggingface.minLikes).toBeGreaterThanOrEqual(0);
    expect(hackernews.minPoints).toBeGreaterThanOrEqual(moderate.hnPoints);
    expect(hackernews.minComments).toBeGreaterThan(0);
  });
});
