import { interpretGoal } from "@/lib/plan/interpret-goal";
import type { PlanRequest } from "@/lib/schemas/plan-request";
import type { KvBackend } from "@/lib/storage/backend";
import { createSavedPlan, newId } from "@/lib/storage/operations";
import type { HistoryEntry, SavedPlan, Settings } from "@/lib/storage/schemas";
import { createStore } from "@/lib/storage/store";

export function requestFor(
  goalText: string,
  overrides: Partial<PlanRequest> = {},
): PlanRequest {
  const goal = interpretGoal(goalText);
  if (!goal) throw new Error(`Test goal not understood: ${goalText}`);
  return {
    goal,
    level: goal.inferredLevel,
    budget: null,
    toolsUsed: [],
    ...overrides,
  };
}

export function planNamed(
  title: string,
  goalText = "portfolio website with animations",
  at = new Date(),
): SavedPlan {
  return createSavedPlan(requestFor(goalText), title, at);
}

export function historyEntry(goal: string, createdAt: Date): HistoryEntry {
  return {
    id: newId(),
    goal,
    goalType: interpretGoal(goal)?.goalType ?? null,
    createdAt: createdAt.toISOString(),
  };
}

export async function seed(
  backend: KvBackend,
  data: {
    plans?: SavedPlan[];
    history?: HistoryEntry[];
    settings?: Settings;
  },
) {
  const store = createStore(backend);
  if (data.plans) await store.savePlans(data.plans);
  if (data.history) await store.saveHistory(data.history);
  if (data.settings) await store.saveSettings(data.settings);
}
