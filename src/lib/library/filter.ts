import type { Job, Tool } from "@/lib/schemas/catalogue";
import { PAGE_SIZE, type LibraryQuery } from "./query";

export interface LibraryResult {
  /** Every tool that matches, in order. */
  matches: Tool[];
  /** The tools on the requested page. */
  pageTools: Tool[];
  page: number;
  pageCount: number;
}

function searchText(tool: Tool, jobsById: ReadonlyMap<string, Job>): string {
  const jobNames = tool.jobs.map((id) => jobsById.get(id)?.name ?? id);
  return [tool.name, tool.id, tool.summary, tool.kind, ...jobNames]
    .join(" ")
    .toLowerCase();
}

function bestFit(tool: Tool, job: string | null): number {
  if (job) return tool.fitScores[job] ?? 0;
  return Math.max(0, ...Object.values(tool.fitScores));
}

function compareByName(a: Tool, b: Tool): number {
  return a.name.localeCompare(b.name, "en", { sensitivity: "base" });
}

export function matchesQuery(
  tool: Tool,
  query: LibraryQuery,
  jobsById: ReadonlyMap<string, Job>,
): boolean {
  if (query.category) {
    const inCategory = tool.jobs.some(
      (id) => jobsById.get(id)?.category === query.category,
    );
    if (!inCategory) return false;
  }
  if (query.job && !tool.jobs.includes(query.job)) return false;
  if (query.kind && tool.kind !== query.kind) return false;
  if (query.platform && !tool.platforms.includes(query.platform)) return false;
  if (query.free && tool.hasFreeOption !== true) return false;
  if (query.verifiedOnly && !tool.verified) return false;

  if (query.q) {
    const haystack = searchText(tool, jobsById);
    const words = query.q.toLowerCase().split(" ");
    if (!words.every((word) => haystack.includes(word))) return false;
  }
  return true;
}

export function sortTools(tools: Tool[], query: LibraryQuery): Tool[] {
  const sorted = [...tools];
  if (query.sort === "fit") {
    sorted.sort(
      (a, b) =>
        bestFit(b, query.job) - bestFit(a, query.job) || compareByName(a, b),
    );
  } else if (query.sort === "verified") {
    sorted.sort((a, b) => {
      if (a.lastVerified && b.lastVerified) {
        const byDate = b.lastVerified.localeCompare(a.lastVerified);
        if (byDate !== 0) return byDate;
      }
      if (a.lastVerified !== b.lastVerified) return a.lastVerified ? -1 : 1;
      return compareByName(a, b);
    });
  } else {
    sorted.sort(compareByName);
  }
  return sorted;
}

export function queryLibrary(
  tools: readonly Tool[],
  jobs: readonly Job[],
  query: LibraryQuery,
): LibraryResult {
  const jobsById = new Map(jobs.map((job) => [job.id, job]));
  const matches = sortTools(
    tools.filter((tool) => matchesQuery(tool, query, jobsById)),
    query,
  );
  const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const page = Math.min(query.page, pageCount);
  return {
    matches,
    pageTools: matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    page,
    pageCount,
  };
}
