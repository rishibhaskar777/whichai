import { describe, expect, it } from "vitest";
import { catalogue } from "@/data/catalogue";
import {
  compareHref,
  parseCompareSelection,
  resolveTool,
  toggleSelection,
} from "./compare";
import { queryLibrary } from "./filter";
import {
  DEFAULT_QUERY,
  MAX_COMPARE,
  PAGE_SIZE,
  libraryHref,
  parseLibraryQuery,
  toSearchParams,
  type LibraryQuery,
} from "./query";
import { toolDetails } from "./tool-details";

const { tools, jobs } = catalogue;

function run(patch: Partial<LibraryQuery>) {
  return queryLibrary(tools, jobs, { ...DEFAULT_QUERY, ...patch });
}

describe("parseLibraryQuery", () => {
  it("reads every filter from the URL", () => {
    const query = parseLibraryQuery({
      q: "  note   taking ",
      category: "media",
      job: "video-editing",
      kind: "app",
      platform: "linux",
      free: "1",
      verified: "1",
      sort: "fit",
      page: "3",
      compare: "ollama,git,claude,extra",
    });
    expect(query).toEqual({
      q: "note taking",
      category: "media",
      job: "video-editing",
      kind: "app",
      platform: "linux",
      free: true,
      verifiedOnly: true,
      sort: "fit",
      page: 3,
      compare: ["ollama", "git", "claude"],
    });
  });

  it("falls back to defaults for unknown or malformed values", () => {
    const query = parseLibraryQuery({
      category: "nope",
      kind: "<script>",
      platform: "beos",
      sort: "price",
      page: "-4",
      job: "Not A Slug",
      free: "yes",
      compare: "../etc,ok-id",
    });
    expect(query).toEqual({ ...DEFAULT_QUERY, compare: ["ok-id"] });
  });

  it("uses the first value when a parameter repeats", () => {
    expect(parseLibraryQuery({ kind: ["cli", "app"] }).kind).toBe("cli");
  });

  it("caps the search text", () => {
    expect(parseLibraryQuery({ q: "x".repeat(500) }).q).toHaveLength(80);
  });

  it("round-trips through the URL and leaves defaults out", () => {
    expect(toSearchParams(DEFAULT_QUERY).toString()).toBe("");
    const query = parseLibraryQuery({ q: "git", kind: "cli", free: "1" });
    const params = Object.fromEntries(toSearchParams(query));
    expect(parseLibraryQuery(params)).toEqual(query);
    expect(libraryHref(DEFAULT_QUERY)).toBe("/tools");
    expect(libraryHref(query)).toBe("/tools?q=git&kind=cli&free=1");
  });
});

describe("queryLibrary", () => {
  it("returns every tool, sorted by name, with no filters", () => {
    const result = run({});
    expect(result.matches).toHaveLength(tools.length);
    const names = result.matches.map((tool) => tool.name);
    const sorted = [...names].sort((a, b) =>
      a.localeCompare(b, "en", { sensitivity: "base" }),
    );
    expect(names).toEqual(sorted);
  });

  it("searches the name, summary and job names", () => {
    expect(run({ q: "ollama" }).matches.map((t) => t.id)).toContain("ollama");
    const byJob = run({ q: "transcription" }).matches.map((t) => t.id);
    expect(byJob).toContain("otter");
    expect(run({ q: "zzzz-nothing" }).matches).toHaveLength(0);
  });

  it("requires every word of the search to match", () => {
    const both = run({ q: "local models" }).matches.length;
    const one = run({ q: "local" }).matches.length;
    expect(both).toBeLessThanOrEqual(one);
  });

  it("filters by category, job, kind and platform", () => {
    const learning = run({ category: "learning" }).matches;
    expect(learning.length).toBeGreaterThan(0);
    for (const tool of learning) {
      const categories = tool.jobs.map(
        (id) => jobs.find((job) => job.id === id)?.category,
      );
      expect(categories).toContain("learning");
    }
    for (const tool of run({ job: "run-ai-locally" }).matches) {
      expect(tool.jobs).toContain("run-ai-locally");
    }
    for (const tool of run({ kind: "model" }).matches) {
      expect(tool.kind).toBe("model");
    }
    for (const tool of run({ platform: "linux" }).matches) {
      expect(tool.platforms).toContain("linux");
    }
    expect(run({ kind: "extension" }).matches.length).toBeGreaterThan(0);
    expect(run({ kind: "cli" }).matches.length).toBeGreaterThan(0);
  });

  it("filters by free option, counting only tools known to be free", () => {
    const free = run({ free: true }).matches;
    expect(free.length).toBeGreaterThan(0);
    expect(free.every((tool) => tool.hasFreeOption === true)).toBe(true);
  });

  it("shows nothing when only verified tools are wanted and none are", () => {
    expect(run({ verifiedOnly: true }).matches).toHaveLength(0);
  });

  it("sorts by fit for the chosen job, best first", () => {
    const result = run({ job: "ai-assistant", sort: "fit" }).matches;
    const scores = result.map((tool) => tool.fitScores["ai-assistant"] ?? 0);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it("sorts recently verified first, with unverified tools last", () => {
    const dated = {
      ...tools[0]!,
      id: "dated",
      name: "Dated",
      verified: true,
      lastVerified: "2026-10-01",
      pricing: "Checked.",
    };
    const older = {
      ...dated,
      id: "older",
      name: "Older",
      lastVerified: "2026-09-01",
    };
    const result = queryLibrary([tools[1]!, older, dated], jobs, {
      ...DEFAULT_QUERY,
      sort: "verified",
    });
    expect(result.matches.map((tool) => tool.id)).toEqual([
      "dated",
      "older",
      tools[1]!.id,
    ]);
  });

  it("pages the results and clamps a page that is too high", () => {
    const first = run({});
    expect(first.pageTools).toHaveLength(PAGE_SIZE);
    expect(first.pageCount).toBe(Math.ceil(tools.length / PAGE_SIZE));
    const clamped = run({ page: 999 });
    expect(clamped.page).toBe(first.pageCount);
    expect(clamped.pageTools.length).toBeGreaterThan(0);
  });
});

describe("compare selection", () => {
  it("keeps only known ids, in order, at most three", () => {
    const ids = parseCompareSelection("ollama,nope,git,claude,chatgpt", tools);
    expect(ids).toEqual(["ollama", "git", "claude"]);
    expect(ids).toHaveLength(MAX_COMPARE);
  });

  it("builds a shareable address", () => {
    expect(compareHref([])).toBe("/compare");
    expect(compareHref(["a", "b"])).toBe("/compare?tools=a,b");
  });

  it("toggles a tool and stops at three", () => {
    expect(toggleSelection(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleSelection(["a", "b"], "a")).toEqual(["b"]);
    expect(toggleSelection(["a", "b", "c"], "d")).toEqual(["a", "b", "c"]);
  });

  it("resolves a typed name, an id, or a unique partial name", () => {
    expect(resolveTool("Ollama", tools)?.id).toBe("ollama");
    expect(resolveTool("  visual studio code ", tools)?.id).toBe(
      "visual-studio-code",
    );
    expect(resolveTool("visual studio", tools)?.id).toBe("visual-studio-code");
    expect(resolveTool("a", tools)).toBeNull();
    expect(resolveTool("", tools)).toBeNull();
  });
});

describe("toolDetails", () => {
  it("gathers the provider, jobs, alternatives and goals", () => {
    const details = toolDetails("chatgpt", catalogue)!;
    expect(details.provider?.name).toBe("OpenAI");
    expect(details.jobs.map((job) => job.id)).toContain("ai-assistant");
    expect(details.goals.length).toBeGreaterThan(0);
    for (const group of details.alternatives) {
      expect(group.tools.length).toBeLessThanOrEqual(4);
      expect(group.tools.map((tool) => tool.id)).not.toContain("chatgpt");
    }
  });

  it("returns null for an unknown tool", () => {
    expect(toolDetails("no-such-tool", catalogue)).toBeNull();
  });
});
