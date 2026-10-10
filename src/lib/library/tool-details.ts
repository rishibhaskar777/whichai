import type {
  Catalogue,
  GoalTemplate,
  Job,
  Provider,
  Tool,
} from "@/lib/schemas/catalogue";

const ALTERNATIVES_PER_JOB = 4;

export interface ToolDetails {
  tool: Tool;
  provider: Provider | null;
  jobs: Job[];
  worksWith: Tool[];
  /** For each of the tool's jobs, the strongest other tools by fit score. */
  alternatives: { job: Job; tools: Tool[] }[];
  /** Goals whose plans use at least one of this tool's jobs. */
  goals: Pick<GoalTemplate, "id" | "title">[];
}

function goalJobIds(goal: GoalTemplate): Set<string> {
  return new Set([
    ...goal.features.flatMap((feature) => feature.jobs),
    ...Object.values(goal.levels).flatMap((level) => level.jobs),
  ]);
}

export function toolDetails(id: string, data: Catalogue): ToolDetails | null {
  const tool = data.tools.find((candidate) => candidate.id === id);
  if (!tool) return null;

  const jobs = tool.jobs.flatMap((jobId) => {
    const job = data.jobs.find((candidate) => candidate.id === jobId);
    return job ? [job] : [];
  });

  return {
    tool,
    provider:
      data.providers.find((provider) => provider.id === tool.providerId) ??
      null,
    jobs,
    worksWith: tool.worksWith.flatMap((otherId) => {
      const other = data.tools.find((candidate) => candidate.id === otherId);
      return other ? [other] : [];
    }),
    alternatives: jobs.map((job) => ({
      job,
      tools: data.tools
        .filter((other) => other.id !== tool.id && other.jobs.includes(job.id))
        .sort(
          (a, b) =>
            (b.fitScores[job.id] ?? 0) - (a.fitScores[job.id] ?? 0) ||
            a.name.localeCompare(b.name, "en"),
        )
        .slice(0, ALTERNATIVES_PER_JOB),
    })),
    goals: data.goals
      .filter((goal) => {
        const used = goalJobIds(goal);
        return tool.jobs.some((jobId) => used.has(jobId));
      })
      .map(({ id: goalId, title }) => ({ id: goalId, title })),
  };
}
