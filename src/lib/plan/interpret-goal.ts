import type { Chip, GoalType, Level, UnderstoodGoal } from "@/lib/schemas/plan";

interface GoalRule {
  goalType: GoalType;
  title: string;
  example: string;
  patterns: readonly RegExp[];
}

interface FeatureRule {
  chip: Chip;
  pattern: RegExp;
}

interface SkillRule {
  chip: Chip;
  pattern: RegExp;
  level: Exclude<Level, "simple">;
}

/*
 * Rules are plain data so later phases can add keywords, synonyms and fuzzy
 * matching here without changing the function that applies them.
 */
const GOAL_RULES: readonly GoalRule[] = [
  {
    goalType: "portfolio-website",
    title: "Portfolio website",
    example: "Build a portfolio website to show my work",
    patterns: [/\bportfolios?\b/, /\bweb\s?sites?\b/, /\bsites?\b/],
  },
  {
    goalType: "study-plan",
    title: "Study plan",
    example: "Make a study plan for my upcoming exams",
    patterns: [
      /\bstud(?:y|ies|ying|ied)\b/,
      /\bexams?\b/,
      /\bsyllab(?:us|uses|i)\b/,
      /\blearn(?:s|ed|ing)?\b/,
    ],
  },
];

function featureChip(id: string, label: string): Chip {
  return { id: `feature:${id}`, label, kind: "feature" };
}

function skillChip(id: string, label: string): Chip {
  return { id: `skill:${id}`, label, kind: "skill" };
}

const FEATURE_RULES: readonly FeatureRule[] = [
  { chip: featureChip("animation", "Animation"), pattern: /\banimat\w*/ },
  { chip: featureChip("blog", "Blog"), pattern: /\bblog(?:s|ging)?\b/ },
  {
    chip: featureChip("contact-form", "Contact form"),
    pattern: /\bcontact[\s-]*(?:me[\s-]*)?forms?\b/,
  },
  {
    chip: featureChip("dark-mode", "Dark mode"),
    pattern: /\bdark[\s-]*(?:mode|theme)\b/,
  },
  { chip: featureChip("notes", "Notes"), pattern: /\bnotes?\b/ },
  { chip: featureChip("quiz", "Quiz"), pattern: /\bquiz(?:zes)?\b/ },
];

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

export const featureOptions: readonly Chip[] = FEATURE_RULES.map(
  (rule) => rule.chip,
);

export const coveredGoals: readonly {
  goalType: GoalType;
  title: string;
  example: string;
}[] = GOAL_RULES.map(({ goalType, title, example }) => ({
  goalType,
  title,
  example,
}));

function matchGoal(text: string): GoalRule | null {
  let best: { rule: GoalRule; hits: number; firstIndex: number } | null = null;

  for (const rule of GOAL_RULES) {
    const indexes = rule.patterns
      .map((pattern) => text.search(pattern))
      .filter((index) => index >= 0);
    if (indexes.length === 0) continue;

    const candidate = {
      rule,
      hits: indexes.length,
      firstIndex: Math.min(...indexes),
    };
    const beatsBest =
      best === null ||
      candidate.hits > best.hits ||
      (candidate.hits === best.hits && candidate.firstIndex < best.firstIndex);
    if (beatsBest) best = candidate;
  }

  return best?.rule ?? null;
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

export function interpretGoal(goalText: string): UnderstoodGoal | null {
  const text = goalText.toLowerCase();
  const goal = matchGoal(text);
  if (!goal) return null;

  const chips: Chip[] = [
    { id: `goal:${goal.goalType}`, label: goal.title, kind: "goal" },
    ...FEATURE_RULES.filter((rule) => rule.pattern.test(text)).map(
      (rule) => rule.chip,
    ),
    ...SKILL_RULES.filter((rule) => rule.pattern.test(text)).map(
      (rule) => rule.chip,
    ),
  ];

  return {
    goalType: goal.goalType,
    title: goal.title,
    chips,
    inferredLevel: inferLevel(chips),
  };
}
