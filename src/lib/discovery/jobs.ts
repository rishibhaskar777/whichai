import { scorePhrases, tokenize } from "../plan/text-match.ts";

export interface JobInfo {
  id: string;
  name: string;
  keywords: readonly string[];
}

export interface ToolInfo {
  id: string;
  name: string;
  jobs: readonly string[];
  fitScores: Readonly<Record<string, number>>;
}

/**
 * The jobs a candidate's own words point at, strongest first. Empty when
 * nothing matches; the reviewer then picks the job by hand.
 */
export function suggestJobs(
  text: string,
  jobs: readonly JobInfo[],
  max = 3,
): string[] {
  const tokens = tokenize(text);
  return jobs
    .map((job) => ({
      id: job.id,
      score: scorePhrases(tokens, [job.name, ...job.keywords]).score,
    }))
    .filter((job) => job.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, max)
    .map((job) => job.id);
}

export interface ClosestTool {
  id: string;
  name: string;
  sharedJobs: string[];
  /** The candidate's name starts with this tool's name, but it is not the same tool. */
  similarName?: boolean;
}

/**
 * Existing tools that do the same jobs, best first. This is a list for the
 * reviewer to compare against. It says nothing about which tool is better.
 */
export function closestTools(
  jobIds: readonly string[],
  tools: readonly ToolInfo[],
  max = 5,
): ClosestTool[] {
  const wanted = new Set(jobIds);
  return tools
    .map((tool) => {
      const sharedJobs = tool.jobs.filter((job) => wanted.has(job));
      const best = Math.max(
        0,
        ...sharedJobs.map((j) => tool.fitScores[j] ?? 0),
      );
      return { tool, sharedJobs, rank: sharedJobs.length * 10 + best };
    })
    .filter((entry) => entry.sharedJobs.length > 0)
    .sort((a, b) => b.rank - a.rank || a.tool.name.localeCompare(b.tool.name))
    .slice(0, max)
    .map(({ tool, sharedJobs }) => ({
      id: tool.id,
      name: tool.name,
      sharedJobs,
    }));
}
