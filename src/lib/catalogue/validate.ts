import {
  GOAL_IDS,
  MODEL_CLASS_IDS,
  type Catalogue,
} from "@/lib/schemas/catalogue";

const CONCRETE_PRICE =
  /(?:₹|\$|€|£|\brs\.?|\binr|\busd)\s*\d|\b\d[\d,.]*\s*(?:rupees|dollars|usd|inr|\/\s*(?:mo|month|year|yr))\b/i;

const TOOL_PLACEHOLDER = /\{job:([a-z0-9-]+)\}/g;

export function collectStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(collectStrings);
  }
  return [];
}

export function hasConcretePrice(text: string): boolean {
  return CONCRETE_PRICE.test(text);
}

/**
 * A price may appear only in the pricing text of a verified record, where a
 * reviewer wrote it from the official page. Everything else stays free of it.
 */
export function withoutVerifiedPricing(catalogue: Catalogue): Catalogue {
  return {
    ...catalogue,
    tools: catalogue.tools.map((tool) =>
      tool.verified ? { ...tool, pricing: "" } : tool,
    ),
  };
}

function duplicates(ids: readonly string[]): string[] {
  return ids.filter((id, index) => ids.indexOf(id) !== index);
}

/**
 * Checks the rules that a schema cannot express because they span files:
 * every referenced id exists, ids are unique, links are root pages and no
 * record carries a concrete price.
 */
export function findProblems(catalogue: Catalogue): string[] {
  const problems: string[] = [];
  const providerIds = new Set(catalogue.providers.map((p) => p.id));
  const jobIds = new Set(catalogue.jobs.map((j) => j.id));
  const toolIds = new Set(catalogue.tools.map((t) => t.id));

  const collections = {
    providers: catalogue.providers.map((p) => p.id),
    jobs: catalogue.jobs.map((j) => j.id),
    tools: catalogue.tools.map((t) => t.id),
    goals: catalogue.goals.map((g) => g.id),
    modelClasses: catalogue.modelClasses.map((m) => m.id),
  };
  for (const [name, ids] of Object.entries(collections)) {
    for (const id of duplicates(ids)) {
      problems.push(`${name}: duplicate id ${id}`);
    }
  }

  for (const id of GOAL_IDS) {
    if (!collections.goals.includes(id)) problems.push(`goals: missing ${id}`);
  }
  for (const id of MODEL_CLASS_IDS) {
    if (!collections.modelClasses.includes(id)) {
      problems.push(`modelClasses: missing ${id}`);
    }
  }

  const usedProviders = new Set<string>();
  const jobsWithTools = new Set<string>();
  for (const tool of catalogue.tools) {
    usedProviders.add(tool.providerId);
    if (!providerIds.has(tool.providerId)) {
      problems.push(`tool ${tool.id}: unknown provider ${tool.providerId}`);
    }
    for (const jobId of tool.jobs) {
      jobsWithTools.add(jobId);
      if (!jobIds.has(jobId)) {
        problems.push(`tool ${tool.id}: unknown job ${jobId}`);
      }
    }
    for (const otherId of tool.worksWith) {
      if (!toolIds.has(otherId)) {
        problems.push(`tool ${tool.id}: worksWith unknown tool ${otherId}`);
      }
      if (otherId === tool.id) {
        problems.push(`tool ${tool.id}: works with itself`);
      }
    }
    if (new URL(tool.officialUrl).pathname !== "/") {
      problems.push(`tool ${tool.id}: officialUrl must be a root page`);
    }
  }
  for (const provider of catalogue.providers) {
    if (!usedProviders.has(provider.id)) {
      problems.push(`provider ${provider.id}: no tool uses it`);
    }
    if (new URL(provider.homepage).pathname !== "/") {
      problems.push(`provider ${provider.id}: homepage must be a root page`);
    }
  }
  for (const job of catalogue.jobs) {
    if (!jobsWithTools.has(job.id)) problems.push(`job ${job.id}: no tools`);
  }

  for (const goal of catalogue.goals) {
    const referenced = [
      ...goal.features.flatMap((feature) => feature.jobs),
      ...Object.values(goal.levels).flatMap((level) => [
        ...level.jobs,
        ...level.modelGuidance.map((guidance) => guidance.jobId),
      ]),
    ];
    for (const jobId of referenced) {
      if (!jobIds.has(jobId)) {
        problems.push(`goal ${goal.id}: unknown job ${jobId}`);
      }
    }
    for (const text of collectStrings(goal.levels)) {
      for (const match of text.matchAll(TOOL_PLACEHOLDER)) {
        if (!jobIds.has(match[1] ?? "")) {
          problems.push(`goal ${goal.id}: unknown placeholder ${match[0]}`);
        }
      }
    }
  }

  for (const text of collectStrings(withoutVerifiedPricing(catalogue))) {
    if (hasConcretePrice(text)) problems.push(`concrete price in "${text}"`);
  }

  return problems;
}
