import { catalogue } from "@/data/catalogue";
import {
  FALLBACK_GOAL_ID,
  type Catalogue,
  type GoalTemplate,
} from "@/lib/schemas/catalogue";
import type { Chip, GoalType, Level, UnderstoodGoal } from "@/lib/schemas/plan";
import { featureChip, goalChip, taskChip } from "./chips";
import { phraseKey, scorePhrases, tokenize } from "./text-match";

interface SkillRule {
  chip: Chip;
  pattern: RegExp;
  level: Exclude<Level, "simple">;
}

/** Most tasks a "pick the right AI" request can name before it gets noisy. */
const MAX_TASKS = 4;

function skillChip(id: string, label: string): Chip {
  return { id: `skill:${id}`, label, kind: "skill" };
}

const SKILL_RULES: readonly SkillRule[] = [
  {
    chip: skillChip("react", "React"),
    pattern: /\breact(?:\.?js)?\b(?!\s+(?:to|when|if|by|against)\b)/,
    level: "advanced",
  },
  {
    chip: skillChip("nextjs", "Next.js"),
    pattern: /\bnext(?:\.js|js|\s+js)\b/,
    level: "advanced",
  },
  { chip: skillChip("api", "API"), pattern: /\bapis?\b/, level: "advanced" },
  {
    chip: skillChip("git", "Git"),
    pattern: /\bgit(?:hub)?\b/,
    level: "polished",
  },
  {
    chip: skillChip("deploy", "Deploying"),
    pattern: /\bdeploy(?:s|ed|ing|ment)?\b/,
    level: "polished",
  },
];

const LEVEL_RANK: Record<Level, number> = {
  simple: 0,
  polished: 1,
  advanced: 2,
};

export const coveredGoals: readonly {
  goalType: GoalType;
  title: string;
  example: string;
}[] = catalogue.goals.map(({ id, title, example }) => ({
  goalType: id,
  title,
  example,
}));

/** The chips a person can add on the understanding card for this goal. */
export function addableChips(
  goalType: GoalType,
  data: Catalogue = catalogue,
): Chip[] {
  const template = data.goals.find((goal) => goal.id === goalType);
  if (!template) return [];
  if (template.id === FALLBACK_GOAL_ID) {
    return data.jobs
      .filter((job) => job.category !== "build")
      .map((job) => taskChip(job.id, job.name));
  }
  return template.features.map((feature) =>
    featureChip(feature.id, feature.label),
  );
}

/** How many goals list each phrase, so shared words can count for less. */
function sharedPhrases(data: Catalogue): Map<string, number> {
  const counts = new Map<string, number>();
  for (const goal of data.goals) {
    const keys = new Set([...goal.keywords, ...goal.synonyms].map(phraseKey));
    for (const key of keys) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function matchGoal(
  tokens: readonly string[],
  data: Catalogue,
): GoalTemplate | null {
  const shared = sharedPhrases(data);
  let best: { goal: GoalTemplate; score: number; firstIndex: number } | null =
    null;

  for (const goal of data.goals) {
    const { score, firstIndex } = scorePhrases(
      tokens,
      [...goal.keywords, ...goal.synonyms],
      shared,
    );
    if (score === 0) continue;
    const beatsBest =
      best === null ||
      score > best.score ||
      (score === best.score && firstIndex < best.firstIndex);
    if (beatsBest) best = { goal, score, firstIndex };
  }

  return best?.goal ?? null;
}

/** Jobs the text asks for, strongest evidence first. */
function matchTasks(tokens: readonly string[], data: Catalogue): Chip[] {
  return data.jobs
    .map((job) => ({ job, ...scorePhrases(tokens, job.keywords) }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score || a.firstIndex - b.firstIndex)
    .slice(0, MAX_TASKS)
    .map(({ job }) => taskChip(job.id, job.name));
}

function matchFeatures(
  tokens: readonly string[],
  template: GoalTemplate,
): Chip[] {
  return template.features
    .filter((feature) => scorePhrases(tokens, feature.keywords).score > 0)
    .map((feature) => featureChip(feature.id, feature.label));
}

export function inferLevel(chips: readonly Chip[]): Level {
  let level: Level = "simple";
  for (const rule of SKILL_RULES) {
    const present = chips.some((chip) => chip.id === rule.chip.id);
    if (present && LEVEL_RANK[rule.level] > LEVEL_RANK[level]) {
      level = rule.level;
    }
  }
  return level;
}

export function interpretGoal(
  goalText: string,
  data: Catalogue = catalogue,
): UnderstoodGoal | null {
  const tokens = tokenize(goalText);
  const fallback = data.goals.find((goal) => goal.id === FALLBACK_GOAL_ID);
  const matched = matchGoal(tokens, data);

  let template = matched;
  let taskChips: Chip[] = [];
  if (!template || template.id === FALLBACK_GOAL_ID) {
    taskChips = matchTasks(tokens, data);
    if (!template && taskChips.length > 0) template = fallback ?? null;
  }
  if (!template) return null;

  const lowered = goalText.toLowerCase();
  const chips: Chip[] = [
    goalChip(template.id, template.title),
    ...matchFeatures(tokens, template),
    ...taskChips,
    ...SKILL_RULES.filter((rule) => rule.pattern.test(lowered)).map(
      (rule) => rule.chip,
    ),
  ];

  return {
    goalType: template.id,
    title: template.title,
    chips,
    inferredLevel: inferLevel(chips),
  };
}
