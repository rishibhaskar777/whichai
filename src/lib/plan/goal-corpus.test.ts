import { describe, expect, it } from "vitest";
import { GOAL_CORPUS, HELD_OUT_CORPUS } from "./goal-corpus";
import { formatCorpusReport, runCorpus } from "./goal-corpus-report";
import { USER_WRITTEN_CASES } from "./user-written-corpus";

const REQUIRED_RATE = 0.9;

describe("goal corpus", () => {
  it("has at least 200 sentences, with expectations for each", () => {
    const all = [...GOAL_CORPUS, ...HELD_OUT_CORPUS];
    expect(all.length).toBeGreaterThanOrEqual(200);
    for (const testCase of all) {
      const expectations = [testCase.goal, testCase.parts, testCase.none];
      expect(expectations.some((value) => value !== undefined)).toBe(true);
    }
  });

  it("does not repeat a sentence", () => {
    const texts = [...GOAL_CORPUS, ...HELD_OUT_CORPUS].map((testCase) =>
      testCase.text.toLowerCase(),
    );
    expect(new Set(texts).size).toBe(texts.length);
  });

  it("is understood at least 90% of the time", () => {
    const main = runCorpus(GOAL_CORPUS);
    const heldOut = runCorpus(HELD_OUT_CORPUS);
    process.stdout.write(
      `\nMain set\n${formatCorpusReport(main)}\nSecond set\n${formatCorpusReport(heldOut)}`,
    );
    expect(main.rate).toBeGreaterThanOrEqual(REQUIRED_RATE);
    expect(heldOut.rate).toBeGreaterThanOrEqual(REQUIRED_RATE);
  }, 30_000);

  it("covers every goal at least twice", () => {
    const counts = new Map<string, number>();
    for (const testCase of [...GOAL_CORPUS, ...HELD_OUT_CORPUS]) {
      if (testCase.goal) {
        counts.set(testCase.goal, (counts.get(testCase.goal) ?? 0) + 1);
      }
    }
    for (const [goal, count] of counts) {
      expect(count, goal).toBeGreaterThanOrEqual(2);
    }
    expect(counts.size).toBeGreaterThanOrEqual(45);
  });
});

describe("user-written sentences", () => {
  it("are valid and reported on their own", () => {
    const report = runCorpus(USER_WRITTEN_CASES);
    process.stdout.write(
      USER_WRITTEN_CASES.length === 0
        ? "\nUser-written set\nNo sentences yet. See src/data/goals/test-sets/README.md.\n"
        : `\nUser-written set\n${formatCorpusReport(report)}`,
    );
    expect(report.total).toBe(USER_WRITTEN_CASES.length);
  });
});
