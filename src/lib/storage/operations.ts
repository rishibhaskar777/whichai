import type { PlanRequest } from "@/lib/schemas/plan-request";
import { CATALOGUE_VERSION } from "./catalogue-version";
import {
  MAX_HISTORY_ENTRIES,
  MAX_IMPORT_BYTES,
  MAX_SAVED_PLANS,
  MAX_TITLE_LENGTH,
  SCHEMA_VERSION,
} from "./limits";
import {
  BACKUP_APP,
  backupFileSchema,
  historyEntrySchema,
  parseItems,
  savedPlanSchema,
  settingsSchema,
  type HistoryEntry,
  type LocalData,
  type SavedPlan,
  type Settings,
} from "./schemas";

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function clampTitle(title: string): string {
  const trimmed = title.trim().replace(/\s+/g, " ");
  return trimmed.length > MAX_TITLE_LENGTH
    ? trimmed.slice(0, MAX_TITLE_LENGTH).trimEnd()
    : trimmed;
}

export type PlanResult =
  | { ok: true; plans: SavedPlan[]; plan: SavedPlan }
  | { ok: false; error: "limit" | "invalid" | "missing" };

export function createSavedPlan(
  request: PlanRequest,
  title: string,
  now: Date = new Date(),
): SavedPlan {
  const stamp = now.toISOString();
  return {
    id: newId(),
    title: clampTitle(title),
    planRequest: request,
    catalogueVersion: CATALOGUE_VERSION,
    createdAt: stamp,
    updatedAt: stamp,
  };
}

export function addPlan(
  plans: readonly SavedPlan[],
  plan: SavedPlan,
): PlanResult {
  if (!savedPlanSchema.safeParse(plan).success) {
    return { ok: false, error: "invalid" };
  }
  if (plans.length >= MAX_SAVED_PLANS) return { ok: false, error: "limit" };
  return { ok: true, plans: [...plans, plan], plan };
}

/** Replaces the request and refreshes the catalogue version. */
export function updatePlanRequest(
  plans: readonly SavedPlan[],
  id: string,
  request: PlanRequest,
  now: Date = new Date(),
): PlanResult {
  return changePlan(plans, id, (plan) => ({
    ...plan,
    planRequest: request,
    catalogueVersion: CATALOGUE_VERSION,
    updatedAt: now.toISOString(),
  }));
}

export function renamePlan(
  plans: readonly SavedPlan[],
  id: string,
  title: string,
  now: Date = new Date(),
): PlanResult {
  const clean = clampTitle(title);
  if (clean === "") return { ok: false, error: "invalid" };
  return changePlan(plans, id, (plan) => ({
    ...plan,
    title: clean,
    updatedAt: now.toISOString(),
  }));
}

function changePlan(
  plans: readonly SavedPlan[],
  id: string,
  change: (plan: SavedPlan) => SavedPlan,
): PlanResult {
  const current = plans.find((plan) => plan.id === id);
  if (!current) return { ok: false, error: "missing" };
  const next = change(current);
  return {
    ok: true,
    plan: next,
    plans: plans.map((plan) => (plan.id === id ? next : plan)),
  };
}

export function duplicatePlan(
  plans: readonly SavedPlan[],
  id: string,
  title: string,
  now: Date = new Date(),
): PlanResult {
  const source = plans.find((plan) => plan.id === id);
  if (!source) return { ok: false, error: "missing" };
  const stamp = now.toISOString();
  return addPlan(plans, {
    ...source,
    id: newId(),
    title: clampTitle(title),
    createdAt: stamp,
    updatedAt: stamp,
  });
}

export function removePlan(
  plans: readonly SavedPlan[],
  id: string,
): SavedPlan[] {
  return plans.filter((plan) => plan.id !== id);
}

/** Puts a deleted plan back where an Undo expects it. */
export function restorePlan(
  plans: readonly SavedPlan[],
  plan: SavedPlan,
): PlanResult {
  if (plans.some((existing) => existing.id === plan.id)) {
    return { ok: true, plans: [...plans], plan };
  }
  return addPlan(plans, plan);
}

export function sortPlans(
  plans: readonly SavedPlan[],
  order: "recent" | "name",
): SavedPlan[] {
  const sorted = [...plans];
  if (order === "name") {
    return sorted.sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
    );
  }
  return sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function isStale(plan: SavedPlan): boolean {
  return plan.catalogueVersion !== CATALOGUE_VERSION;
}

/**
 * Adds a goal to the front of the history. The same goal typed again moves to
 * the front instead of repeating, and the oldest entries go past the limit.
 */
export function addHistoryEntry(
  history: readonly HistoryEntry[],
  goal: string,
  goalType: HistoryEntry["goalType"],
  now: Date = new Date(),
): HistoryEntry[] {
  const text = goal.trim();
  const key = text.toLowerCase();
  const entry: HistoryEntry = {
    id: newId(),
    goal: text,
    goalType,
    createdAt: now.toISOString(),
  };
  if (!historyEntrySchema.safeParse(entry).success) return [...history];
  const kept = history.filter(
    (existing) => existing.goal.toLowerCase() !== key,
  );
  return [entry, ...kept].slice(0, MAX_HISTORY_ENTRIES);
}

export type HistoryGroupId = "today" | "yesterday" | "week" | "older";

export interface HistoryGroup {
  id: HistoryGroupId;
  entries: HistoryEntry[];
}

function startOfDay(date: Date): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function historyGroupOf(createdAt: string, now: Date): HistoryGroupId {
  const days = Math.round(
    (startOfDay(now) - startOfDay(new Date(createdAt))) / DAY_MS,
  );
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days <= 7) return "week";
  return "older";
}

/** Newest first inside each group; empty groups are left out. */
export function groupHistory(
  entries: readonly HistoryEntry[],
  now: Date = new Date(),
): HistoryGroup[] {
  const order: HistoryGroupId[] = ["today", "yesterday", "week", "older"];
  const sorted = [...entries].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  return order
    .map((id) => ({
      id,
      entries: sorted.filter(
        (entry) => historyGroupOf(entry.createdAt, now) === id,
      ),
    }))
    .filter((group) => group.entries.length > 0);
}

export function buildBackup(
  data: LocalData,
  now: Date = new Date(),
): Record<string, unknown> {
  return {
    app: BACKUP_APP,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    plans: data.plans,
    history: data.history,
    settings: data.settings,
  };
}

export function backupFileName(now: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `whichai-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}

export type ImportError = "too-large" | "not-json" | "wrong-shape" | "empty";

export interface ParsedBackup {
  plans: SavedPlan[];
  history: HistoryEntry[];
  settings: Settings | null;
  /** Records in the file that failed validation and were left out. */
  skipped: number;
}

export type ParseBackupResult =
  { ok: true; backup: ParsedBackup } | { ok: false; error: ImportError };

/** The file is untrusted: size, JSON, outer shape and every record are checked. */
export function parseBackup(text: string): ParseBackupResult {
  if (text.length > MAX_IMPORT_BYTES) return { ok: false, error: "too-large" };
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: "not-json" };
  }
  const outer = backupFileSchema.safeParse(json);
  if (!outer.success) return { ok: false, error: "wrong-shape" };

  const { plans, history, settings } = outer.data;
  const validPlans = parseItems(savedPlanSchema, plans, MAX_SAVED_PLANS);
  const validHistory = parseItems(
    historyEntrySchema,
    history,
    MAX_HISTORY_ENTRIES,
  );
  const parsedSettings = settingsSchema.safeParse(settings);
  const skipped =
    plans.length - validPlans.length + (history.length - validHistory.length);
  if (
    validPlans.length === 0 &&
    validHistory.length === 0 &&
    !parsedSettings.success
  ) {
    return { ok: false, error: "empty" };
  }
  return {
    ok: true,
    backup: {
      plans: validPlans,
      history: validHistory,
      settings: parsedSettings.success ? parsedSettings.data : null,
      skipped,
    },
  };
}

export interface ImportOutcome {
  data: LocalData;
  /** Plans or history entries left out because a limit was reached. */
  dropped: number;
}

/**
 * Replace swaps everything for the file. Merge keeps what is stored, adds what
 * is new, lets the newer copy of a plan win, and keeps current settings.
 */
export function applyImport(
  current: LocalData,
  backup: ParsedBackup,
  mode: "merge" | "replace",
): ImportOutcome {
  if (mode === "replace") {
    return {
      data: {
        plans: backup.plans,
        history: backup.history,
        settings: backup.settings ?? current.settings,
      },
      dropped: 0,
    };
  }

  const plans = new Map(current.plans.map((plan) => [plan.id, plan]));
  for (const incoming of backup.plans) {
    const existing = plans.get(incoming.id);
    if (!existing || incoming.updatedAt > existing.updatedAt) {
      plans.set(incoming.id, incoming);
    }
  }
  const mergedPlans = sortPlans([...plans.values()], "recent");
  const keptPlans = mergedPlans.slice(0, MAX_SAVED_PLANS);

  const history = new Map(current.history.map((entry) => [entry.id, entry]));
  for (const incoming of backup.history) history.set(incoming.id, incoming);
  const mergedHistory = [...history.values()].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const keptHistory = mergedHistory.slice(0, MAX_HISTORY_ENTRIES);

  return {
    data: {
      plans: keptPlans,
      history: keptHistory,
      settings: current.settings,
    },
    dropped:
      mergedPlans.length -
      keptPlans.length +
      (mergedHistory.length - keptHistory.length),
  };
}
