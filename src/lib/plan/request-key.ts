import type { PlanRequest } from "@/lib/schemas/plan-request";

const sorted = (values: readonly string[]) => [...values].sort();

/**
 * A string that is the same for two requests that describe the same plan, so
 * a plan opened from a link can be compared with the copy that was saved.
 */
export function requestKeyOf(request: PlanRequest): string {
  const { goal } = request;
  return JSON.stringify({
    goal: {
      goalType: goal.goalType,
      title: goal.title,
      chips: goal.chips.map(({ id, label, kind }) => ({ id, label, kind })),
      inferredLevel: goal.inferredLevel,
    },
    level: request.level,
    budget: request.budget,
    toolsUsed: sorted(request.toolsUsed),
    chosenTools: Object.entries(request.chosenTools).sort(([a], [b]) =>
      a.localeCompare(b),
    ),
    addedJobs: sorted(request.addedJobs),
    removedJobs: sorted(request.removedJobs),
  });
}
