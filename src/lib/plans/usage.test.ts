import { describe, expect, it } from "vitest";
import { createMemoryBackend } from "@/lib/storage/backend";
import { createUsageStore, dayKey, msUntilMidnight } from "./usage";

function clock(start: string) {
  let current = new Date(start);
  return {
    now: () => current,
    set: (value: string) => {
      current = new Date(value);
    },
  };
}

describe("usage store", () => {
  it("counts per profile", async () => {
    const store = createUsageStore(createMemoryBackend());
    expect(await store.increment("guest:a")).toBe(1);
    expect(await store.increment("guest:a")).toBe(2);
    expect(await store.increment("user:b")).toBe(1);
    expect(await store.count("guest:a")).toBe(2);
  });

  it("starts again at local midnight", async () => {
    const time = clock("2026-03-10T23:59:00");
    const store = createUsageStore(createMemoryBackend(), time.now);
    await store.increment("p");
    await store.increment("p");
    expect(await store.count("p")).toBe(2);

    time.set("2026-03-11T00:00:01");
    expect(await store.count("p")).toBe(0);
    expect(await store.increment("p")).toBe(1);
  });

  it("moves a count to another profile and adds to what is there", async () => {
    const store = createUsageStore(createMemoryBackend());
    await store.increment("guest:a");
    await store.increment("guest:a");
    await store.increment("guest:a");
    await store.increment("user:b");

    await store.transfer("guest:a", "user:b");

    expect(await store.count("guest:a")).toBe(0);
    expect(await store.count("user:b")).toBe(4);
  });

  it("resets one profile and clears all", async () => {
    const store = createUsageStore(createMemoryBackend());
    await store.increment("a");
    await store.increment("b");
    await store.reset("a");
    expect(await store.count("a")).toBe(0);
    expect(await store.count("b")).toBe(1);
    await store.clear();
    expect(await store.count("b")).toBe(0);
  });

  it("ignores damaged stored data", async () => {
    const kv = createMemoryBackend();
    await kv.set("plan-usage", "{not json");
    const store = createUsageStore(kv);
    expect(await store.count("a")).toBe(0);
    expect(await store.increment("a")).toBe(1);
  });

  it("names the day and the time to midnight", () => {
    expect(dayKey(new Date("2026-03-09T08:00:00"))).toBe("2026-03-09");
    expect(msUntilMidnight(new Date("2026-03-09T23:00:00"))).toBe(3_600_000);
  });
});
