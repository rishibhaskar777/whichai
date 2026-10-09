import type { Catalogue } from "../schemas/catalogue";

/*
 * Pure report on the state of the data, used by `npm run data:report`.
 * It only imports types, so Node can run it without a build step.
 */

export const MIN_TOOLS_PER_JOB = 3;
const OLDEST_SHOWN = 5;

export interface DataReport {
  total: number;
  verified: number;
  neverVerified: number;
  freeOptionUnconfirmed: number;
  oldest: { id: string; name: string; lastVerified: string }[];
  thinJobs: { id: string; name: string; tools: number }[];
}

export function buildReport(
  catalogue: Pick<Catalogue, "tools" | "jobs">,
): DataReport {
  const { tools, jobs } = catalogue;
  const dated = tools.flatMap((tool) =>
    tool.verified && tool.lastVerified
      ? [{ id: tool.id, name: tool.name, lastVerified: tool.lastVerified }]
      : [],
  );

  return {
    total: tools.length,
    verified: dated.length,
    neverVerified: tools.filter((tool) => !tool.verified).length,
    freeOptionUnconfirmed: tools.filter(
      (tool) => tool.hasFreeOption === "verify",
    ).length,
    oldest: dated
      .sort((a, b) => a.lastVerified.localeCompare(b.lastVerified))
      .slice(0, OLDEST_SHOWN),
    thinJobs: jobs
      .map((job) => ({
        id: job.id,
        name: job.name,
        tools: tools.filter((tool) => tool.jobs.includes(job.id)).length,
      }))
      .filter((job) => job.tools < MIN_TOOLS_PER_JOB),
  };
}

function percent(part: number, whole: number): string {
  return whole === 0 ? "0%" : `${Math.round((part / whole) * 100)}%`;
}

export function formatReport(report: DataReport): string {
  const lines = [
    "Tool catalogue report",
    "",
    `Verified: ${report.verified} of ${report.total} tools (${percent(report.verified, report.total)})`,
    `Never verified: ${report.neverVerified}`,
    `Free option still unconfirmed: ${report.freeOptionUnconfirmed}`,
    "",
  ];

  if (report.oldest.length === 0) {
    lines.push("Oldest verified records: none, nothing has been verified yet.");
  } else {
    lines.push("Oldest verified records:");
    for (const tool of report.oldest) {
      lines.push(`  ${tool.lastVerified}  ${tool.name} (${tool.id})`);
    }
  }
  lines.push("");

  if (report.thinJobs.length === 0) {
    lines.push(`Every job has at least ${MIN_TOOLS_PER_JOB} tools.`);
  } else {
    lines.push(`Jobs with fewer than ${MIN_TOOLS_PER_JOB} tools:`);
    for (const job of report.thinJobs) {
      lines.push(`  ${job.tools}  ${job.name} (${job.id})`);
    }
  }
  return `${lines.join("\n")}\n`;
}
