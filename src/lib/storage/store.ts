import type { KvBackend } from "./backend";
import { readEnvelope, serialize } from "./envelope";
import { MAX_HISTORY_ENTRIES, MAX_SAVED_PLANS, MAX_TOTAL_SIZE } from "./limits";
import {
  DEFAULT_SETTINGS,
  historyEntrySchema,
  parseItems,
  savedPlanSchema,
  settingsSchema,
  type HistoryEntry,
  type LocalData,
  type SavedPlan,
  type Settings,
} from "./schemas";

export type StoreError = "unavailable" | "full";

export type WriteResult = { ok: true } | { ok: false; error: StoreError };

type Collection = "plans" | "history" | "settings";

const COLLECTIONS: readonly Collection[] = ["plans", "history", "settings"];

export interface LoadedData extends LocalData {
  /** False on a first visit, so callers can keep cookie-based defaults. */
  settingsStored: boolean;
}

export interface Store {
  /** False when the backend is the in-page fallback that nothing survives. */
  readonly persistent: boolean;
  load(): Promise<LoadedData>;
  savePlans(plans: readonly SavedPlan[]): Promise<WriteResult>;
  saveHistory(entries: readonly HistoryEntry[]): Promise<WriteResult>;
  saveSettings(settings: Settings): Promise<WriteResult>;
  clear(): Promise<WriteResult>;
}

function isQuotaError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED")
  );
}

function fail(error: StoreError): WriteResult {
  return { ok: false, error };
}

export function createStore(backend: KvBackend): Store {
  const sizes: Record<Collection, number> = {
    plans: 0,
    history: 0,
    settings: 0,
  };

  async function read(collection: Collection): Promise<unknown> {
    try {
      return readEnvelope(await backend.get(collection));
    } catch {
      return null;
    }
  }

  async function write(
    collection: Collection,
    data: unknown,
  ): Promise<WriteResult> {
    const text = serialize(data);
    const total = COLLECTIONS.reduce(
      (sum, name) => sum + (name === collection ? text.length : sizes[name]),
      0,
    );
    if (total > MAX_TOTAL_SIZE) return fail("full");
    try {
      await backend.set(collection, text);
    } catch (error) {
      return fail(isQuotaError(error) ? "full" : "unavailable");
    }
    sizes[collection] = text.length;
    return { ok: true };
  }

  return {
    persistent: backend.kind !== "memory",

    async load() {
      const [plans, history, settings] = await Promise.all(
        COLLECTIONS.map(read),
      );
      const data: LoadedData = {
        settingsStored: settings !== null,
        plans: parseItems(savedPlanSchema, plans, MAX_SAVED_PLANS),
        history: parseItems(historyEntrySchema, history, MAX_HISTORY_ENTRIES),
        settings: settingsSchema
          .catch(DEFAULT_SETTINGS)
          .parse(settings ?? DEFAULT_SETTINGS),
      };
      sizes.plans = serialize(data.plans).length;
      sizes.history = serialize(data.history).length;
      sizes.settings = serialize(data.settings).length;
      return data;
    },

    savePlans: (plans) => write("plans", plans),
    saveHistory: (entries) => write("history", entries),
    saveSettings: (settings) => write("settings", settings),

    async clear() {
      try {
        await Promise.all(COLLECTIONS.map((name) => backend.remove(name)));
      } catch {
        return fail("unavailable");
      }
      COLLECTIONS.forEach((name) => {
        sizes[name] = 0;
      });
      return { ok: true };
    },
  };
}
