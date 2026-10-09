import { describe, expect, it } from "vitest";
import { catalogue } from "@/data/catalogue";
import type { Job, Tool } from "@/lib/schemas/catalogue";
import { buildReport, formatReport } from "./report";

const base = catalogue.tools[0]!;

function tool(id: string, patch: Partial<Tool>): Tool {
  return { ...base, id, name: id, jobs: ["a"], fitScores: { a: 3 }, ...patch };
}

function job(id: string): Job {
  return {
    id,
    name: `Job ${id}`,
    description: "x",
    category: "ai",
    keywords: [],
  };
}

function verified(id: string, lastVerified: string): Tool {
  return tool(id, { verified: true, lastVerified, pricing: "checked" });
}

describe("buildReport", () => {
  it("counts verified tools and lists the oldest first", () => {
    const report = buildReport({
      jobs: [job("a")],
      tools: [
        verified("new", "2026-10-01"),
        verified("old", "2026-01-15"),
        tool("never", {}),
      ],
    });

    expect(report.total).toBe(3);
    expect(report.verified).toBe(2);
    expect(report.neverVerified).toBe(1);
    expect(report.oldest.map((entry) => entry.id)).toEqual(["old", "new"]);
  });

  it("shows only the five oldest records", () => {
    const tools = Array.from({ length: 8 }, (_, index) =>
      verified(`t${index}`, `2026-0${index + 1}-01`),
    );
    expect(buildReport({ jobs: [job("a")], tools }).oldest).toHaveLength(5);
  });

  it("lists jobs with fewer than three tools", () => {
    const report = buildReport({
      jobs: [job("a"), job("b"), job("c")],
      tools: [
        tool("1", { jobs: ["a", "b"], fitScores: { a: 3, b: 3 } }),
        tool("2", { jobs: ["a"] }),
        tool("3", { jobs: ["a"] }),
      ],
    });

    expect(report.thinJobs).toEqual([
      { id: "b", name: "Job b", tools: 1 },
      { id: "c", name: "Job c", tools: 0 },
    ]);
  });

  it("counts free options that are still unconfirmed", () => {
    const report = buildReport({
      jobs: [job("a")],
      tools: [
        tool("x", { hasFreeOption: "verify" }),
        tool("y", { hasFreeOption: true }),
      ],
    });
    expect(report.freeOptionUnconfirmed).toBe(1);
  });

  it("reports on the real catalogue", () => {
    const report = buildReport(catalogue);
    expect(report.total).toBe(catalogue.tools.length);
    expect(report.thinJobs).toEqual([]);
  });
});

describe("formatReport", () => {
  it("says plainly that nothing has been verified yet", () => {
    const text = formatReport(
      buildReport({
        jobs: [job("a")],
        tools: [tool("x", {}), tool("y", {}), tool("z", {})],
      }),
    );
    expect(text).toContain("Verified: 0 of 3 tools (0%)");
    expect(text).toContain("nothing has been verified yet");
    expect(text).toContain("Every job has at least 3 tools.");
  });

  it("prints the oldest records and the thin jobs", () => {
    const text = formatReport(
      buildReport({
        jobs: [job("a"), job("b")],
        tools: [verified("old", "2026-01-15")],
      }),
    );
    expect(text).toContain("2026-01-15  old (old)");
    expect(text).toContain("Jobs with fewer than 3 tools:");
    expect(text).toContain("Job b (b)");
  });
});
