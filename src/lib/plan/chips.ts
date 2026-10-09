import type { Chip } from "@/lib/schemas/plan";

const GOAL_PREFIX = "goal:";
const FEATURE_PREFIX = "feature:";
const TASK_PREFIX = "job:";

export function goalChip(id: string, label: string): Chip {
  return { id: `${GOAL_PREFIX}${id}`, label, kind: "goal" };
}

export function featureChip(id: string, label: string): Chip {
  return { id: `${FEATURE_PREFIX}${id}`, label, kind: "feature" };
}

/** A task chip names a job directly, for goals that are just "pick a tool". */
export function taskChip(jobId: string, label: string): Chip {
  return { id: `${TASK_PREFIX}${jobId}`, label, kind: "feature" };
}

export function featureIdOf(chip: Chip): string | null {
  return chip.id.startsWith(FEATURE_PREFIX)
    ? chip.id.slice(FEATURE_PREFIX.length)
    : null;
}

export function taskJobIdOf(chip: Chip): string | null {
  return chip.id.startsWith(TASK_PREFIX)
    ? chip.id.slice(TASK_PREFIX.length)
    : null;
}
