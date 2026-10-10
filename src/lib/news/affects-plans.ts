import type { Plan } from "../schemas/plan";

/** What the news badge needs to know about one saved plan. */
export interface PlanTools {
  id: string;
  title: string;
  toolIds: ReadonlySet<string>;
}

/**
 * Every tool a plan puts forward at any level, plus the tools the person
 * said they already use. Alternatives are not counted: a change to a tool
 * that is only a possible swap does not change the plan.
 */
export function toolIdsOfPlan(
  plan: Plan,
  toolsUsed: readonly string[],
): Set<string> {
  const ids = new Set(toolsUsed);
  for (const level of Object.values(plan.levels)) {
    for (const job of level.jobs) ids.add(job.toolId);
  }
  return ids;
}

/** The saved plans that use at least one of the item's tools. */
export function plansAffectedBy(
  itemToolIds: readonly string[],
  plans: readonly PlanTools[],
): PlanTools[] {
  if (itemToolIds.length === 0) return [];
  return plans.filter((plan) =>
    itemToolIds.some((toolId) => plan.toolIds.has(toolId)),
  );
}
