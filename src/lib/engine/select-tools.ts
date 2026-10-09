import type { Tool } from "@/lib/schemas/catalogue";
import type { Budget, JobTag, Level } from "@/lib/schemas/plan";

const SKILL_RANK = { beginner: 0, intermediate: 1, advanced: 2 } as const;
const LEVEL_RANK: Record<Level, number> = {
  simple: 0,
  polished: 1,
  advanced: 2,
};

/** A tool the person already uses stays if it scores this close to the best. */
export const KEEP_MARGIN = 1;
export const MAX_ALTERNATIVES = 2;

export function fitsLevel(tool: Tool, level: Level): boolean {
  return SKILL_RANK[tool.skillLevel] <= LEVEL_RANK[level];
}

/**
 * At a zero budget a tool must have a free option, or one that is not
 * confirmed yet. Other budgets cannot filter because prices are not known.
 */
export function fitsBudget(tool: Tool, budget: Budget | null): boolean {
  return budget !== "zero" || tool.hasFreeOption !== false;
}

export function fitFor(tool: Tool, jobId: string): number {
  return tool.fitScores[jobId] ?? 0;
}

export function isCompatible(a: Tool, b: Tool): boolean {
  return a.worksWith.includes(b.id) || b.worksWith.includes(a.id);
}

/** FNV-1a. Gives equal-scoring tools a stable but varied order per goal. */
export function hashText(text: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

/**
 * Best first: higher fit score, then a provider not yet used in this plan,
 * then more known compatibility with the tools already chosen, then a stable
 * hash of the seed so equal tools rotate between goals instead of one always
 * winning. The id is the last resort so the order is total.
 */
export function rankTools(
  candidates: readonly Tool[],
  jobId: string,
  chosen: readonly Tool[],
  seed: string,
): Tool[] {
  const usedProviders = new Set(chosen.map((tool) => tool.providerId));
  const compatibility = (tool: Tool) =>
    chosen.filter((other) => isCompatible(tool, other)).length;

  return [...candidates].sort(
    (a, b) =>
      fitFor(b, jobId) - fitFor(a, jobId) ||
      Number(usedProviders.has(a.providerId)) -
        Number(usedProviders.has(b.providerId)) ||
      compatibility(b) - compatibility(a) ||
      hashText(`${seed}:${a.id}`) - hashText(`${seed}:${b.id}`) ||
      a.id.localeCompare(b.id),
  );
}

export interface SelectionContext {
  level: Level;
  budget: Budget | null;
  toolsUsed: ReadonlySet<string>;
  chosen: readonly Tool[];
  seed: string;
}

export interface Selection {
  pick: Tool;
  tag: JobTag;
  /** The tool the person uses today when the pick scores clearly higher. */
  outscored: Tool | null;
  alternatives: Tool[];
  /** The pick is more technical than the plan level allows. */
  levelStretched: boolean;
}

function candidatePool(
  forJob: readonly Tool[],
  context: SelectionContext,
): Tool[] {
  const affordable = forJob.filter((tool) => fitsBudget(tool, context.budget));
  const atLevel = affordable.filter((tool) => fitsLevel(tool, context.level));
  return atLevel.length > 0 ? atLevel : affordable;
}

export function selectForJob(
  jobId: string,
  tools: readonly Tool[],
  context: SelectionContext,
): Selection | null {
  const forJob = tools.filter((tool) => tool.jobs.includes(jobId));
  const pool = candidatePool(forJob, context);
  const best = rankTools(pool, jobId, context.chosen, context.seed)[0];
  if (!best) return null;

  const used = forJob
    .filter((tool) => context.toolsUsed.has(tool.id))
    .sort(
      (a, b) => fitFor(b, jobId) - fitFor(a, jobId) || a.id.localeCompare(b.id),
    );
  const topUsed = used[0];

  let pick = best;
  let tag: JobTag = "new";
  let outscored: Tool | null = null;
  if (topUsed) {
    if (fitFor(topUsed, jobId) >= fitFor(best, jobId) - KEEP_MARGIN) {
      pick = topUsed;
      tag = "keep";
    } else {
      tag = "better";
      outscored = topUsed;
    }
  }

  const alternatives: Tool[] = [];
  let chosen = [...context.chosen, pick];
  let remaining = pool.filter((tool) => tool.id !== pick.id);
  while (alternatives.length < MAX_ALTERNATIVES) {
    const next = rankTools(remaining, jobId, chosen, context.seed)[0];
    if (!next) break;
    alternatives.push(next);
    chosen = [...chosen, next];
    remaining = remaining.filter((tool) => tool.id !== next.id);
  }

  return {
    pick,
    tag,
    outscored,
    alternatives,
    levelStretched: !fitsLevel(pick, context.level),
  };
}
