import { describe, expect, it } from "vitest";
import type { PlanRequest } from "@/lib/schemas/plan-request";
import {
  createLocalStorageBackend,
  createMemoryBackend,
  type KvBackend,
} from "./backend";
import { CATALOGUE_VERSION, hashCatalogue } from "./catalogue-version";
import { readEnvelope, serialize } from "./envelope";
import { MAX_HISTORY_ENTRIES, MAX_SAVED_PLANS, MAX_TOTAL_SIZE } from "./limits";
import {
  addHistoryEntry,
  addPlan,
  createSavedPlan,
  duplicatePlan,
  isStale,
  removePlan,
  renamePlan,
  restorePlan,
} from "./operations";
import { DEFAULT_SETTINGS, type SavedPlan } from "./schemas";
import { createStore } from "./store";

const REQUEST: PlanRequest = {
  goal: {
    goalType: "portfolio-website",
    title: "Portfolio website",
    chips: [{ id: "goal:portfolio-website", label: "Portfolio", kind: "goal" }],
    inferredLevel: "simple",
  },
  level: "simple",
  budget: null,
  toolsUsed: [],
};

function samplePlan(title = "My portfolio"): SavedPlan {
  return createSavedPlan(REQUEST, title);
}

function failingBackend(error: Error): KvBackend {
  return {
    kind: "indexeddb",
    get: async () => {
      throw error;
    },
    set: async () => {
      throw error;
    },
    remove: async () => {
      throw error;
    },
  };
}

describe("storage envelope", () => {
  it("round-trips data at the current version", () => {
    expect(readEnvelope(serialize([1, 2]))).toEqual([1, 2]);
  });

  it("returns null for text that is not an envelope", () => {
    expect(readEnvelope(null)).toBeNull();
    expect(readEnvelope("{not json")).toBeNull();
    expect(readEnvelope('"text"')).toBeNull();
    expect(readEnvelope('{"data":[]}')).toBeNull();
  });

  it("refuses data written by a newer version", () => {
    expect(readEnvelope('{"schemaVersion":99,"data":[]}')).toBeNull();
  });

  it("runs migrations in order up to the current version", () => {
    const migrations = {
      1: (data: unknown) => (data as number[]).map((n) => n + 1),
      2: (data: unknown) => ({ items: data }),
    };
    expect(
      readEnvelope('{"schemaVersion":1,"data":[1,2]}', 3, migrations),
    ).toEqual({ items: [2, 3] });
  });

  it("returns null when a migration is missing or throws", () => {
    expect(readEnvelope('{"schemaVersion":1,"data":[]}', 2, {})).toBeNull();
    expect(
      readEnvelope('{"schemaVersion":1,"data":[]}', 2, {
        1: () => {
          throw new Error("bad");
        },
      }),
    ).toBeNull();
  });
});

describe("store", () => {
  it("loads defaults from an empty backend", async () => {
    const data = await createStore(createMemoryBackend()).load();
    expect(data).toEqual({
      plans: [],
      history: [],
      settings: DEFAULT_SETTINGS,
    });
  });

  it("saves and reloads plans, history and settings", async () => {
    const backend = createMemoryBackend();
    const store = createStore(backend);
    const plan = samplePlan();
    const settings = { ...DEFAULT_SETTINGS, theme: "dark" as const };
    const history = addHistoryEntry(
      [],
      "build a portfolio",
      "portfolio-website",
    );

    expect(await store.savePlans([plan])).toEqual({ ok: true });
    expect(await store.saveHistory(history)).toEqual({ ok: true });
    expect(await store.saveSettings(settings)).toEqual({ ok: true });

    const reloaded = await createStore(backend).load();
    expect(reloaded.plans).toEqual([plan]);
    expect(reloaded.history).toEqual(history);
    expect(reloaded.settings.theme).toBe("dark");
  });

  it("drops invalid records and keeps the valid ones", async () => {
    const backend = createMemoryBackend();
    const good = samplePlan("Good");
    const wrongType = {
      ...samplePlan("Bad type"),
      planRequest: { level: "x" },
    };
    const wrongGoal = samplePlan("Bad goal");
    wrongGoal.planRequest = {
      ...REQUEST,
      goal: { ...REQUEST.goal, goalType: "not-a-goal" as never },
    };
    await backend.set(
      "plans",
      serialize([good, wrongType, wrongGoal, "text", null, { id: 5 }]),
    );

    const { plans } = await createStore(backend).load();

    expect(plans.map((plan) => plan.title)).toEqual(["Good"]);
  });

  it("drops duplicate ids and caps the number of records", async () => {
    const backend = createMemoryBackend();
    const plan = samplePlan();
    const many = Array.from({ length: MAX_SAVED_PLANS + 5 }, () =>
      samplePlan(),
    );
    await backend.set("plans", serialize([plan, plan, ...many]));

    const { plans } = await createStore(backend).load();

    expect(plans).toHaveLength(MAX_SAVED_PLANS);
    expect(new Set(plans.map((p) => p.id)).size).toBe(MAX_SAVED_PLANS);
  });

  it("treats corrupted storage as empty", async () => {
    const backend = createMemoryBackend();
    await backend.set("plans", "{{{");
    await backend.set("history", '{"schemaVersion":1,"data":"nope"}');
    await backend.set("settings", '{"schemaVersion":1,"data":7}');

    const data = await createStore(backend).load();

    expect(data).toEqual({
      plans: [],
      history: [],
      settings: DEFAULT_SETTINGS,
    });
  });

  it("falls back to a default for a single bad setting", async () => {
    const backend = createMemoryBackend();
    await backend.set(
      "settings",
      serialize({ ...DEFAULT_SETTINGS, theme: "purple", language: "hi" }),
    );

    const { settings } = await createStore(backend).load();

    expect(settings.theme).toBe("system");
    expect(settings.language).toBe("hi");
  });

  it("does not throw when the backend is unavailable", async () => {
    const store = createStore(failingBackend(new Error("blocked")));

    expect((await store.load()).plans).toEqual([]);
    expect(await store.savePlans([samplePlan()])).toEqual({
      ok: false,
      error: "unavailable",
    });
    expect(await store.clear()).toEqual({ ok: false, error: "unavailable" });
  });

  it("reports a full browser quota as full", async () => {
    const quota = new Error("quota");
    quota.name = "QuotaExceededError";
    const store = createStore(failingBackend(quota));

    expect(await store.saveSettings(DEFAULT_SETTINGS)).toEqual({
      ok: false,
      error: "full",
    });
  });

  it("refuses to write past the total size limit", async () => {
    const backend = createMemoryBackend();
    const store = createStore(backend);
    const huge = {
      ...samplePlan(),
      planRequest: {
        ...REQUEST,
        toolsUsed: Array.from({ length: 40 }, () => "x".repeat(60)),
      },
    };
    const plans = Array.from(
      { length: Math.ceil(MAX_TOTAL_SIZE / JSON.stringify(huge).length) + 1 },
      () => huge,
    );

    expect(await store.savePlans(plans)).toEqual({ ok: false, error: "full" });
    expect(await backend.get("plans")).toBeNull();
  });

  it("reports memory-only storage as not persistent", () => {
    expect(createStore(createMemoryBackend()).persistent).toBe(false);
    expect(
      createStore(createLocalStorageBackend(window.localStorage)).persistent,
    ).toBe(true);
  });

  it("clears every collection", async () => {
    const backend = createLocalStorageBackend(window.localStorage);
    const store = createStore(backend);
    await store.savePlans([samplePlan()]);

    expect(await store.clear()).toEqual({ ok: true });
    expect((await store.load()).plans).toEqual([]);
    window.localStorage.clear();
  });
});

describe("plan operations", () => {
  it("adds, renames and removes a plan", () => {
    const added = addPlan([], samplePlan());
    if (!added.ok) throw new Error("expected ok");

    const renamed = renamePlan(added.plans, added.plan.id, "  New   name ");
    if (!renamed.ok) throw new Error("expected ok");
    expect(renamed.plan.title).toBe("New name");

    expect(removePlan(renamed.plans, added.plan.id)).toEqual([]);
  });

  it("rejects an empty title and an unknown id", () => {
    const added = addPlan([], samplePlan());
    if (!added.ok) throw new Error("expected ok");
    expect(renamePlan(added.plans, added.plan.id, "   ")).toEqual({
      ok: false,
      error: "invalid",
    });
    expect(renamePlan(added.plans, "missing-id-1", "x")).toEqual({
      ok: false,
      error: "missing",
    });
  });

  it("duplicates with a new id and its own title", () => {
    const added = addPlan([], samplePlan("Original"));
    if (!added.ok) throw new Error("expected ok");

    const copy = duplicatePlan(added.plans, added.plan.id, "Original (copy)");
    if (!copy.ok) throw new Error("expected ok");

    expect(copy.plans).toHaveLength(2);
    expect(copy.plan.id).not.toBe(added.plan.id);
    expect(copy.plan.title).toBe("Original (copy)");
    expect(copy.plan.planRequest).toEqual(added.plan.planRequest);
  });

  it("stops at the plan limit", () => {
    const full = Array.from({ length: MAX_SAVED_PLANS }, () => samplePlan());
    expect(addPlan(full, samplePlan())).toEqual({ ok: false, error: "limit" });
  });

  it("restores a deleted plan for Undo, once", () => {
    const plan = samplePlan();
    const restored = restorePlan([], plan);
    if (!restored.ok) throw new Error("expected ok");
    expect(restored.plans).toEqual([plan]);
    const again = restorePlan(restored.plans, plan);
    if (!again.ok) throw new Error("expected ok");
    expect(again.plans).toHaveLength(1);
  });

  it("flags plans saved against another catalogue version", () => {
    const plan = samplePlan();
    expect(isStale(plan)).toBe(false);
    expect(isStale({ ...plan, catalogueVersion: "old" })).toBe(true);
  });
});

describe("catalogue version", () => {
  it("changes when the data changes", () => {
    expect(CATALOGUE_VERSION).toMatch(/^[0-9a-z]+$/);
    expect(hashCatalogue({ a: 1 })).not.toBe(hashCatalogue({ a: 2 }));
    expect(hashCatalogue({ a: 1 })).toBe(hashCatalogue({ a: 1 }));
  });
});

describe("history limit", () => {
  it("removes the oldest entries first", () => {
    let history: ReturnType<typeof addHistoryEntry> = [];
    for (let index = 0; index < MAX_HISTORY_ENTRIES + 10; index += 1) {
      history = addHistoryEntry(
        history,
        `goal number ${index}`,
        null,
        new Date(2026, 0, 1, 0, 0, index),
      );
    }
    expect(history).toHaveLength(MAX_HISTORY_ENTRIES);
    expect(history[0]?.goal).toBe(`goal number ${MAX_HISTORY_ENTRIES + 9}`);
    expect(history.some((entry) => entry.goal === "goal number 0")).toBe(false);
  });
});
