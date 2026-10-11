import { describe, expect, it } from "vitest";
import { createMemoryBackend } from "./backend";
import { MAX_MISSED_GOALS } from "./limits";
import { addMissedGoal, buildBackup } from "./operations";
import { createStore } from "./store";

const NOW = new Date("2026-10-11T10:00:00Z");

describe("addMissedGoal", () => {
  it("puts the newest first and keeps the reason", () => {
    const first = addMissedGoal([], "weather in delhi", "no-match", NOW);
    const second = addMissedGoal(first, "app with parts", "parts-only", NOW);

    expect(second.map((entry) => entry.goal)).toEqual([
      "app with parts",
      "weather in delhi",
    ]);
    expect(second[0]?.reason).toBe("parts-only");
  });

  it("keeps the same text once, ignoring case", () => {
    const first = addMissedGoal([], "Weather In Delhi", "no-match", NOW);
    const again = addMissedGoal(first, "weather in delhi", "unsure", NOW);

    expect(again).toHaveLength(1);
    expect(again[0]?.reason).toBe("unsure");
  });

  it("holds a limited number of goals", () => {
    let list = addMissedGoal([], "goal 0", "no-match", NOW);
    for (let index = 1; index <= MAX_MISSED_GOALS + 10; index += 1) {
      list = addMissedGoal(list, `goal ${index}`, "no-match", NOW);
    }

    expect(list).toHaveLength(MAX_MISSED_GOALS);
    expect(list[0]?.goal).toBe(`goal ${MAX_MISSED_GOALS + 10}`);
  });

  it("ignores text that is empty or too long", () => {
    expect(addMissedGoal([], "   ", "no-match", NOW)).toEqual([]);
    expect(addMissedGoal([], "x".repeat(501), "no-match", NOW)).toEqual([]);
  });
});

describe("missed goals in the store", () => {
  it("saves and reloads them", async () => {
    const backend = createMemoryBackend();
    const store = createStore(backend);
    const misses = addMissedGoal([], "weather in delhi", "no-match", NOW);

    expect(await store.saveMisses(misses)).toEqual({ ok: true });

    const reloaded = await createStore(backend).loadMisses();
    expect(reloaded).toEqual(misses);
  });

  it("drops entries that are not valid", async () => {
    const backend = createMemoryBackend();
    await backend.set(
      "misses",
      JSON.stringify({
        schemaVersion: 1,
        data: [{ id: "x", goal: "", reason: "nope" }, "text", 4],
      }),
    );

    expect(await createStore(backend).loadMisses()).toEqual([]);
  });

  it("is cleared with everything else", async () => {
    const backend = createMemoryBackend();
    const store = createStore(backend);
    await store.saveMisses(addMissedGoal([], "weather", "no-match", NOW));

    await store.clear();

    expect(await backend.get("misses")).toBeNull();
  });

  it("is not part of a backup file", async () => {
    const { settings } = await createStore(createMemoryBackend()).load();

    const backup = buildBackup({ plans: [], history: [], settings });

    expect(JSON.stringify(backup)).not.toContain("misses");
  });
});
