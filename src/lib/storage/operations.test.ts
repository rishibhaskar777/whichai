import { describe, expect, it } from "vitest";
import { historyEntry, planNamed } from "@/test/seed";
import { MAX_IMPORT_BYTES, MAX_SAVED_PLANS } from "./limits";
import {
  addHistoryEntry,
  applyImport,
  backupFileName,
  buildBackup,
  groupHistory,
  historyGroupOf,
  parseBackup,
  sortPlans,
} from "./operations";
import { DEFAULT_SETTINGS, type LocalData } from "./schemas";

const NOW = new Date(2026, 9, 10, 15, 30);

function daysAgo(days: number, hour = 9): Date {
  return new Date(2026, 9, 10 - days, hour);
}

function data(overrides: Partial<LocalData> = {}): LocalData {
  return {
    plans: [],
    history: [],
    settings: DEFAULT_SETTINGS,
    ...overrides,
  };
}

describe("history groups", () => {
  it("sorts entries into Today, Yesterday, Previous 7 days and Older", () => {
    expect(historyGroupOf(daysAgo(0, 1).toISOString(), NOW)).toBe("today");
    expect(historyGroupOf(daysAgo(1, 23).toISOString(), NOW)).toBe("yesterday");
    expect(historyGroupOf(daysAgo(2).toISOString(), NOW)).toBe("week");
    expect(historyGroupOf(daysAgo(7).toISOString(), NOW)).toBe("week");
    expect(historyGroupOf(daysAgo(8).toISOString(), NOW)).toBe("older");
  });

  it("returns only the groups that have entries, newest first", () => {
    const entries = [
      historyEntry("study plan for exams", daysAgo(20)),
      historyEntry("make a video from footage", daysAgo(0, 8)),
      historyEntry("portfolio website", daysAgo(0, 12)),
      historyEntry("resume for a job", daysAgo(4)),
    ];

    const groups = groupHistory(entries, NOW);

    expect(groups.map((group) => group.id)).toEqual(["today", "week", "older"]);
    expect(groups[0]?.entries.map((entry) => entry.goal)).toEqual([
      "portfolio website",
      "make a video from footage",
    ]);
  });

  it("returns nothing for an empty history", () => {
    expect(groupHistory([], NOW)).toEqual([]);
  });

  it("moves a repeated goal to the front instead of duplicating it", () => {
    let history = addHistoryEntry([], "Portfolio website", null, daysAgo(2));
    history = addHistoryEntry(history, "study plan", null, daysAgo(1));
    history = addHistoryEntry(history, "portfolio website", null, daysAgo(0));

    expect(history.map((entry) => entry.goal)).toEqual([
      "portfolio website",
      "study plan",
    ]);
  });

  it("skips goals the schema would reject", () => {
    expect(addHistoryEntry([], "   ", null)).toEqual([]);
    expect(addHistoryEntry([], "x".repeat(501), null)).toEqual([]);
  });
});

describe("sorting plans", () => {
  it("orders by recent update or by name", () => {
    const older = planNamed("Zebra site", undefined, daysAgo(5));
    const newer = planNamed("Apple site", undefined, daysAgo(1));
    expect(sortPlans([older, newer], "recent")[0]).toBe(newer);
    expect(sortPlans([newer, older], "name")[0]).toBe(newer);
    expect(sortPlans([older, newer], "name").map((p) => p.title)).toEqual([
      "Apple site",
      "Zebra site",
    ]);
  });
});

describe("backup files", () => {
  it("names the file by date", () => {
    expect(backupFileName(new Date(2026, 0, 5))).toBe(
      "whichai-backup-2026-01-05.json",
    );
  });

  it("round-trips through parseBackup", () => {
    const plan = planNamed("Round trip");
    const entry = historyEntry("study plan", daysAgo(1));
    const text = JSON.stringify(
      buildBackup(data({ plans: [plan], history: [entry] })),
    );

    const parsed = parseBackup(text);

    expect(parsed).toMatchObject({ ok: true });
    if (!parsed.ok) return;
    expect(parsed.backup.plans).toEqual([plan]);
    expect(parsed.backup.history).toEqual([entry]);
    expect(parsed.backup.settings).toEqual(DEFAULT_SETTINGS);
    expect(parsed.backup.skipped).toBe(0);
  });

  it("rejects text that is not JSON", () => {
    expect(parseBackup("<html>")).toEqual({ ok: false, error: "not-json" });
  });

  it("rejects the wrong shape", () => {
    for (const wrong of [
      [],
      "text",
      {},
      {
        app: "other",
        schemaVersion: 1,
        exportedAt: "x",
        plans: [],
        history: [],
      },
      { ...buildBackup(data()), schemaVersion: 99 },
      { ...buildBackup(data()), plans: "nope" },
      { ...buildBackup(data()), exportedAt: "yesterday" },
    ]) {
      expect(parseBackup(JSON.stringify(wrong))).toEqual({
        ok: false,
        error: "wrong-shape",
      });
    }
  });

  it("rejects a file over the size limit before parsing it", () => {
    expect(parseBackup(" ".repeat(MAX_IMPORT_BYTES + 1))).toEqual({
      ok: false,
      error: "too-large",
    });
  });

  it("rejects a file with more plans than the limit allows", () => {
    const plans = Array.from({ length: MAX_SAVED_PLANS + 1 }, () =>
      planNamed("p"),
    );
    const text = JSON.stringify(buildBackup(data({ plans })));
    expect(parseBackup(text)).toEqual({ ok: false, error: "wrong-shape" });
  });

  it("drops invalid records and counts them", () => {
    const good = planNamed("Good");
    const backup = {
      ...buildBackup(data()),
      plans: [good, { id: "x" }, "text", null],
      history: [{ nope: true }],
    };

    const parsed = parseBackup(JSON.stringify(backup));

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.backup.plans).toEqual([good]);
    expect(parsed.backup.skipped).toBe(4);
  });

  it("reports a backup with nothing usable as empty", () => {
    const backup = { ...buildBackup(data()), settings: undefined };
    expect(parseBackup(JSON.stringify(backup))).toEqual({
      ok: false,
      error: "empty",
    });
  });

  it("treats HTML in text fields as plain strings", () => {
    const plan = planNamed("<img src=x onerror=alert(1)>");
    const parsed = parseBackup(
      JSON.stringify(buildBackup(data({ plans: [plan] }))),
    );
    expect(parsed.ok && parsed.backup.plans[0]?.title).toBe(
      "<img src=x onerror=alert(1)>",
    );
  });
});

describe("applying an import", () => {
  const mine = planNamed("Mine", undefined, daysAgo(3));
  const theirs = planNamed("Theirs", "study plan for my exams", daysAgo(2));
  const entryA = historyEntry("study plan", daysAgo(5));
  const entryB = historyEntry("resume for a job", daysAgo(1));
  const backup = {
    plans: [theirs],
    history: [entryB],
    settings: { ...DEFAULT_SETTINGS, theme: "dark" as const },
    skipped: 0,
  };

  it("replace swaps in the file's plans, history and settings", () => {
    const current = data({ plans: [mine], history: [entryA] });

    const { data: next, dropped } = applyImport(current, backup, "replace");

    expect(next.plans).toEqual([theirs]);
    expect(next.history).toEqual([entryB]);
    expect(next.settings.theme).toBe("dark");
    expect(dropped).toBe(0);
  });

  it("replace keeps current settings when the file has none", () => {
    const current = data({ settings: { ...DEFAULT_SETTINGS, theme: "light" } });
    const { data: next } = applyImport(
      current,
      { ...backup, settings: null },
      "replace",
    );
    expect(next.settings.theme).toBe("light");
  });

  it("merge keeps what is here, adds what is new and keeps current settings", () => {
    const current = data({ plans: [mine], history: [entryA] });

    const { data: next } = applyImport(current, backup, "merge");

    expect(next.plans.map((plan) => plan.title).sort()).toEqual([
      "Mine",
      "Theirs",
    ]);
    expect(next.history).toHaveLength(2);
    expect(next.history[0]).toEqual(entryB);
    expect(next.settings).toEqual(DEFAULT_SETTINGS);
  });

  it("merge lets the newer copy of the same plan win", () => {
    const newer = {
      ...mine,
      title: "Mine, edited",
      updatedAt: daysAgo(0).toISOString(),
    };
    const stale = {
      ...mine,
      title: "Old copy",
      updatedAt: daysAgo(9).toISOString(),
    };

    const fromNewer = applyImport(
      data({ plans: [mine] }),
      { ...backup, plans: [newer], history: [] },
      "merge",
    );
    const fromStale = applyImport(
      data({ plans: [mine] }),
      { ...backup, plans: [stale], history: [] },
      "merge",
    );

    expect(fromNewer.data.plans.map((p) => p.title)).toEqual(["Mine, edited"]);
    expect(fromStale.data.plans.map((p) => p.title)).toEqual(["Mine"]);
  });

  it("merge stops at the plan limit and reports what it left out", () => {
    const existing = Array.from({ length: MAX_SAVED_PLANS }, (_, index) =>
      planNamed(`Plan ${index}`, undefined, daysAgo(10)),
    );

    const { data: next, dropped } = applyImport(
      data({ plans: existing }),
      { ...backup, plans: [theirs], history: [] },
      "merge",
    );

    expect(next.plans).toHaveLength(MAX_SAVED_PLANS);
    expect(next.plans.some((plan) => plan.id === theirs.id)).toBe(true);
    expect(dropped).toBe(1);
  });
});
