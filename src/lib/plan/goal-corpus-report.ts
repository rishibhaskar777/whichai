import { catalogue } from "@/data/catalogue";
import type { Catalogue } from "@/lib/schemas/catalogue";
import { CUSTOM_GOAL_ID } from "@/lib/schemas/catalogue";
import { featureIdOf, taskJobIdOf } from "./chips";
import { GOAL_CORPUS, type CorpusCase } from "./goal-corpus";
import { understandGoal } from "./interpret-goal";

export interface CorpusMiss {
  text: string;
  expected: string;
  got: string;
}

export interface CorpusReport {
  total: number;
  matched: number;
  rate: number;
  /** Cases where the expected goal was the answer or among "Did you mean". */
  reachable: number;
  misses: CorpusMiss[];
}

function describeExpected(testCase: CorpusCase): string {
  if (testCase.none) return "no plan";
  const parts = testCase.parts ? ` + ${testCase.parts.join(", ")}` : "";
  return `${testCase.goal ?? CUSTOM_GOAL_ID}${parts}`;
}

function evaluate(testCase: CorpusCase, data: Catalogue) {
  const understanding = understandGoal(testCase.text, data);
  if (testCase.none) {
    return {
      ok: understanding === null,
      reachable: understanding === null,
      got: understanding?.goal.goalType ?? "no plan",
    };
  }
  if (!understanding) return { ok: false, reachable: false, got: "no plan" };

  const { goal } = understanding;
  const expectedGoal = testCase.goal ?? CUSTOM_GOAL_ID;
  const partIds = new Set(
    goal.chips.flatMap((chip) => taskJobIdOf(chip) ?? []),
  );
  // A feature the sentence names also brings its jobs into the plan.
  const template = data.goals.find(
    (candidate) => candidate.id === goal.goalType,
  );
  const planned = new Set([
    ...partIds,
    ...(template?.features ?? [])
      .filter((feature) =>
        goal.chips.some((chip) => featureIdOf(chip) === feature.id),
      )
      .flatMap((feature) => feature.jobs),
  ]);
  const hasParts = (testCase.parts ?? []).every((id) => planned.has(id));
  const ok = goal.goalType === expectedGoal && hasParts;
  const reachable =
    ok ||
    understanding.suggestions.some(
      (option) => option.goalType === expectedGoal,
    );
  const parts = partIds.size > 0 ? ` + ${[...partIds].join(", ")}` : "";
  return { ok, reachable, got: `${goal.goalType}${parts}` };
}

export function runCorpus(
  cases: readonly CorpusCase[] = GOAL_CORPUS,
  data: Catalogue = catalogue,
): CorpusReport {
  const misses: CorpusMiss[] = [];
  let matched = 0;
  let reachable = 0;
  for (const testCase of cases) {
    const result = evaluate(testCase, data);
    if (result.ok) matched += 1;
    else {
      misses.push({
        text: testCase.text,
        expected: describeExpected(testCase),
        got: result.got,
      });
    }
    if (result.reachable) reachable += 1;
  }
  return {
    total: cases.length,
    matched,
    rate: cases.length === 0 ? 0 : matched / cases.length,
    reachable,
    misses,
  };
}

export function formatCorpusReport(report: CorpusReport): string {
  const percent = (value: number) => `${(value * 100).toFixed(1)}%`;
  const lines = [
    `Goal sentences: ${report.total}`,
    `Matched the expected goal and parts: ${report.matched} (${percent(report.rate)})`,
    `Expected goal reachable, including "Did you mean": ${report.reachable} (${percent(report.reachable / report.total)})`,
    `Misses: ${report.misses.length}`,
    ...report.misses.map(
      (miss) =>
        `  "${miss.text}"\n    expected ${miss.expected}\n    got      ${miss.got}`,
    ),
  ];
  return `${lines.join("\n")}\n`;
}
