import { catalogue } from "@/data/catalogue";
import { COMMON_GOAL_IDS } from "@/data/catalogue/common-goals";
import {
  CUSTOM_GOAL_ID,
  FALLBACK_GOAL_ID,
  JOB_STAGES,
  type Catalogue,
  type GoalGroup,
  type GoalTemplate,
  type Job,
} from "@/lib/schemas/catalogue";
import type { Chip, GoalType, Level, UnderstoodGoal } from "@/lib/schemas/plan";
import { featureChip, goalChip, taskChip } from "./chips";
import { LOOSE_WORDS } from "./loose-words";
import {
  findPhrase,
  locatePhrase,
  phraseKey,
  scorePhrases,
  tokenCues,
  tokenize,
  tokenizePhrase,
  type Cue,
  type Span,
} from "./text-match";

interface SkillRule {
  chip: Chip;
  pattern: RegExp;
  level: Exclude<Level, "simple">;
}

/** Most parts a sentence can name before the card gets noisy. */
const MAX_PARTS = 6;
/** A goal needs about one distinctive word or a two-word phrase to be sure. */
const CONFIDENT_SCORE = 1;
/** Goals this near the best are weighed by what each one is for. */
const CLOSE_SCORE = 2.5;
/** A result word ("into a dashboard") promotes a goal this close to the best. */
const PROMOTE_WINDOW = 1;
/** A close goal lends its job as a part only with a phrase of its own. */
const COMPANION_SCORE = 2;
/** Lead over the runner-up that separates a clear match from a coin toss. */
const CONFIDENT_LEAD = 0.5;
/** "which ai" or "best ai tool" is two words of evidence on its own. */
const ASKS_FOR_TOOL = 2;
/** Other words allowed between the words of a phrase. */
const PHRASE_GAP = 2;
/** What a phrase is worth when other words sit between its words. */
const GAP_WEIGHT = 0.75;
/** A job that is only a shared word scores less than this and is ignored. */
const MIN_PART_SCORE = 0.5;
const MAX_SUGGESTIONS = 3;

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

export interface CoveredGoal {
  goalType: GoalType;
  title: string;
  example: string;
  group: GoalGroup;
  /** One of the goals shown first on the "no plan yet" card. */
  common: boolean;
  /** Lowercase words to search on: the title, example and keywords. */
  searchText: string;
}

export const coveredGoals: readonly CoveredGoal[] = catalogue.goals
  .filter((goal) => goal.id !== CUSTOM_GOAL_ID)
  .map((goal) => ({
    goalType: goal.id,
    title: goal.title,
    example: goal.example,
    group: goal.group,
    common: COMMON_GOAL_IDS.includes(goal.id),
    searchText: [goal.title, goal.example, ...goal.keywords, ...goal.synonyms]
      .join(" ")
      .toLowerCase(),
  }));

/** A job a person can add to a plan, with the words a search should match. */
export interface PartOption {
  id: string;
  name: string;
  description: string;
  category: Job["category"];
  searchText: string;
}

/** Every job, for the "Add a part" list. */
export function listParts(data: Catalogue = catalogue): PartOption[] {
  return data.jobs.map((job) => ({
    id: job.id,
    name: job.name,
    description: job.description,
    category: job.category,
    searchText: [job.name, job.description, ...job.keywords]
      .join(" ")
      .toLowerCase(),
  }));
}

/** The chips a person can add on the understanding card for this goal. */
export function addableChips(
  goalType: GoalType,
  data: Catalogue = catalogue,
): Chip[] {
  const template = data.goals.find((goal) => goal.id === goalType);
  if (!template) return [];
  return template.features.map((feature) =>
    featureChip(feature.id, feature.label),
  );
}

/** How many entries list each phrase, so shared words can count for less. */
function sharedPhrases(
  lists: readonly (readonly string[])[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const list of lists) {
    for (const key of new Set(list.map(phraseKey))) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return counts;
}

const sharedCache = new WeakMap<
  Catalogue,
  { goals: Map<string, number>; jobs: Map<string, number> }
>();

/** How many goals and how many jobs list each phrase, worked out once. */
function sharedCounts(data: Catalogue) {
  let counts = sharedCache.get(data);
  if (!counts) {
    counts = {
      goals: sharedPhrases(
        data.goals
          .filter((goal) => goal.id !== CUSTOM_GOAL_ID)
          .map((goal) => [...goal.keywords, ...goal.synonyms]),
      ),
      jobs: sharedPhrases(data.jobs.map((job) => job.keywords)),
    };
    sharedCache.set(data, counts);
  }
  return counts;
}

interface GoalMatch {
  goal: GoalTemplate;
  score: number;
  firstIndex: number;
  spans: Span[];
  /** True when the cue words, not the score, put this goal in front. */
  ledByCue?: boolean;
  /** A close goal whose own job is brought in as a part. */
  companion?: GoalTemplate;
}

/** Goals with any evidence, best first. Ties go to the earlier mention. */
function rankGoals(
  tokens: readonly string[],
  data: Catalogue,
  cues: readonly Cue[],
): GoalMatch[] {
  const candidates = data.goals.filter((goal) => goal.id !== CUSTOM_GOAL_ID);
  const shared = sharedCounts(data).goals;
  const ranked = candidates
    .map((goal) => ({
      goal,
      ...scorePhrases(
        tokens,
        [...goal.keywords, ...goal.synonyms],
        shared,
        PHRASE_GAP,
      ),
    }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score || a.firstIndex - b.firstIndex);
  return chooseLead(ranked, cues);
}

const CUE_RANK: Record<NonNullable<Cue> | "none", number> = {
  primary: 0,
  none: 1,
  secondary: 2,
};

/**
 * Goals that score close are decided by what is being made. A goal named after
 * "for" or "with" is a subject or an add-on, and one named after "into" is the
 * result. Failing that, a toss-up goes to the one named first. The goal that
 * loses keeps its place as a companion, whose own job joins as a part.
 */
function chooseLead(ranked: GoalMatch[], cues: readonly Cue[]): GoalMatch[] {
  const top = ranked[0];
  if (!top) return ranked;
  // What a goal is about is read where its first words end: "a chatbot" in
  // "a website with a chatbot" is an add-on, however early its phrase starts.
  const rank = (match: GoalMatch) => {
    const [first] = [...match.spans].sort(
      (a, b) => a.start - b.start || a.length - b.length,
    );
    const end = first ? first.start + first.length - 1 : -1;
    return CUE_RANK[cues[end] ?? "none"];
  };
  /** Negative when the cue words put a first, positive for b, 0 if undecided. */
  const byCueWords = (a: GoalMatch, b: GoalMatch) => {
    // A goal that only shares a word has no say in what is being made.
    if (Math.min(a.score, b.score) < CONFIDENT_SCORE) return 0;
    const difference = rank(a) - rank(b);
    if (difference === 0) return 0;
    const favoured = difference < 0 ? a : b;
    const promoted = rank(favoured) === CUE_RANK.primary;
    // A result word promotes a goal only when it is nearly as strong.
    if (promoted && Math.abs(a.score - b.score) > PROMOTE_WINDOW) return 0;
    return difference;
  };
  const close = ranked.filter(
    (match) => top.score - match.score <= CLOSE_SCORE,
  );
  const rest = ranked.filter((match) => !close.includes(match));
  close.sort((a, b) => {
    const cue = byCueWords(a, b);
    if (cue !== 0) return cue;
    const gap = b.score - a.score;
    if (Math.abs(gap) < CONFIDENT_LEAD) {
      return a.firstIndex - b.firstIndex || gap;
    }
    return gap;
  });
  const lead = close[0]!;
  const other = close[1];
  const byCue = other !== undefined && byCueWords(lead, other) < 0;
  const ordered = [lead, ...close.slice(1), ...rest];
  ordered[0] = {
    ...lead,
    ...(byCue ? { ledByCue: true } : {}),
    // Only a goal with a phrase of its own lends its job, not a lone word.
    ...(byCue && other.score >= COMPANION_SCORE
      ? { companion: other.goal }
      : {}),
  };
  return ordered;
}

interface PartHit {
  jobIndex: number;
  start: number;
  words: string[];
  weight: number;
}

/** Words that name a skill; they set the level and are not parts to add. */
const SKILL_WORDS: ReadonlySet<string> = new Set([
  "react",
  "reactjs",
  "next",
  "js",
  "nextjs",
  "api",
  "apis",
  "git",
  "github",
  "deploy",
  "deploys",
  "deployed",
  "deploying",
  "deployment",
]);

/**
 * Jobs the text asks for, strongest evidence first. Longer phrases claim their
 * words first, so "image editing" is not also read as "image generation", and
 * words that already belong to the goal are not read again as parts.
 */
function detectJobs(
  tokens: readonly string[],
  data: Catalogue,
  taken: ReadonlySet<number>,
  /** True once a goal has matched, so loose single words are not enough. */
  strict: boolean,
): Job[] {
  const shared = sharedCounts(data).jobs;
  const open = tokens.map((token, index) =>
    taken.has(index) || SKILL_WORDS.has(token) ? "" : token,
  );

  const hits: PartHit[] = [];
  data.jobs.forEach((job, jobIndex) => {
    for (const keyword of job.keywords) {
      const words = tokenizePhrase(keyword);
      if (strict && words.length === 1 && LOOSE_WORDS.has(words[0]!)) continue;
      const start = findPhrase(open, words);
      const spread =
        start >= 0 || strict || words.length < 2
          ? null
          : locatePhrase(open, words, PHRASE_GAP);
      if (start < 0 && !spread) continue;
      hits.push({
        jobIndex,
        start: start >= 0 ? start : spread!.start,
        words,
        weight:
          (words.length * (start >= 0 ? 1 : GAP_WEIGHT)) /
          (shared.get(words.join(" ")) ?? 1),
      });
    }
  });
  hits.sort(
    (a, b) =>
      b.words.length - a.words.length ||
      a.start - b.start ||
      a.jobIndex - b.jobIndex,
  );

  const claimedBy = new Map<number, string>();
  const scores = new Map<number, { score: number; first: number }>();
  for (const hit of hits) {
    const key = hit.words.join(" ");
    const covered = hit.words.map((_word, offset) => hit.start + offset);
    const clash = covered.some((index) => {
      const owner = claimedBy.get(index);
      return owner !== undefined && owner !== key;
    });
    if (clash) continue;
    covered.forEach((index) => claimedBy.set(index, key));
    const current = scores.get(hit.jobIndex) ?? {
      score: 0,
      first: Number.POSITIVE_INFINITY,
    };
    scores.set(hit.jobIndex, {
      score: current.score + hit.weight,
      first: Math.min(current.first, hit.start),
    });
  }

  return [...scores]
    .filter(([, { score }]) => score >= MIN_PART_SCORE)
    .sort(([, a], [, b]) => b.score - a.score || a.first - b.first)
    .map(([jobIndex]) => data.jobs[jobIndex]!);
}

function matchFeatures(
  tokens: readonly string[],
  template: GoalTemplate,
): { chips: Chip[]; jobIds: string[]; spans: Span[] } {
  const chips: Chip[] = [];
  const jobIds: string[] = [];
  const spans: Span[] = [];
  for (const feature of template.features) {
    const { score, spans: found } = scorePhrases(tokens, feature.keywords);
    if (score === 0) continue;
    chips.push(featureChip(feature.id, feature.label));
    jobIds.push(...feature.jobs);
    spans.push(...found);
  }
  return { chips, jobIds, spans };
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

/** The order a plan built from parts follows: idea, design, build, and so on. */
function byStage(jobs: readonly Job[]): Job[] {
  const rank = (job: Job) => JOB_STAGES.indexOf(job.stage);
  return [...jobs].sort((a, b) => rank(a) - rank(b));
}

function skillChips(text: string): Chip[] {
  const lowered = text.toLowerCase();
  return SKILL_RULES.filter((rule) => rule.pattern.test(lowered)).map(
    (rule) => rule.chip,
  );
}

/** The jobs a template already provides at its starting level. */
function providedJobs(template: GoalTemplate, featureJobs: string[]) {
  return new Set([...template.levels.simple.jobs, ...featureJobs]);
}

function goalWithTemplate(
  template: GoalTemplate,
  tokens: readonly string[],
  text: string,
  data: Catalogue,
  goalSpans: readonly Span[],
  companion?: GoalTemplate,
): UnderstoodGoal {
  const features = matchFeatures(tokens, template);
  const taken = new Set(
    [...goalSpans, ...features.spans].flatMap(({ start, length }) =>
      Array.from({ length }, (_, offset) => start + offset),
    ),
  );
  const provided = providedJobs(template, features.jobIds);
  // Asking which AI to use is about the task, so loose words count here.
  const strict = template.id !== FALLBACK_GOAL_ID;
  const parts = detectJobs(tokens, data, taken, strict)
    .filter((job) => !provided.has(job.id))
    .slice(0, MAX_PARTS);
  const borrowed = companionJob(companion, provided, parts, data);
  if (borrowed) parts.push(borrowed);

  const chips: Chip[] = [
    goalChip(template.id, template.title),
    ...features.chips,
    ...byStage(parts).map((job) => taskChip(job.id, job.name)),
    ...skillChips(text),
  ];
  return {
    goalType: template.id,
    title: template.title,
    chips,
    inferredLevel: inferLevel(chips),
  };
}

/** The one job that makes the close goal what it is, when this one lacks it. */
function companionJob(
  companion: GoalTemplate | undefined,
  provided: ReadonlySet<string>,
  parts: readonly Job[],
  data: Catalogue,
): Job | undefined {
  if (!companion) return undefined;
  const id = companion.levels.simple.jobs.find(
    (jobId) =>
      jobId !== "ai-assistant" &&
      !provided.has(jobId) &&
      !parts.some((part) => part.id === jobId),
  );
  return data.jobs.find((job) => job.id === id);
}

function customGoal(
  jobs: readonly Job[],
  text: string,
  data: Catalogue,
): UnderstoodGoal | null {
  const template = data.goals.find((goal) => goal.id === CUSTOM_GOAL_ID);
  if (!template || jobs.length === 0) return null;
  const chips: Chip[] = [
    goalChip(template.id, template.title),
    ...byStage(jobs.slice(0, MAX_PARTS)).map((job) =>
      taskChip(job.id, job.name),
    ),
    ...skillChips(text),
  ];
  return {
    goalType: template.id,
    title: template.title,
    chips,
    inferredLevel: inferLevel(chips),
  };
}

export interface GoalSuggestion {
  goalType: GoalType;
  title: string;
}

export interface Understanding {
  goal: UnderstoodGoal;
  /** "low" when the text fits several goals, or one only weakly. */
  confidence: "high" | "low";
  /** The best few goals to offer when confidence is low. */
  suggestions: GoalSuggestion[];
  /** A plan made only from the jobs found in the text, when there are any. */
  partsGoal: UnderstoodGoal | null;
}

/**
 * Reads a goal sentence. Goals and jobs are scored together: a goal that fits
 * becomes the plan, and jobs the text names that the goal does not provide
 * are added as parts. When no goal fits, the jobs alone make a custom plan.
 * Returns null only when nothing is recognised.
 */
export function understandGoal(
  goalText: string,
  data: Catalogue = catalogue,
): Understanding | null {
  const tokens = tokenize(goalText);
  const ranked = rankGoals(tokens, data, tokenCues(goalText));
  const wrapper = ranked.find((match) => match.goal.id === FALLBACK_GOAL_ID);
  const contenders = ranked.filter(
    (match) => match.goal.id !== FALLBACK_GOAL_ID,
  );
  const [first, second] = contenders;

  // Asking outright which AI to use is the request, whatever task follows.
  const asksForTool = wrapper !== undefined && wrapper.score >= ASKS_FOR_TOOL;
  const clear = asksForTool
    ? wrapper
    : first !== undefined && first.score >= CONFIDENT_SCORE
      ? first
      : (wrapper ?? first);
  const jobs = detectJobs(tokens, data, new Set(), false);
  const partsGoal = customGoal(jobs, goalText, data);

  if (!clear) {
    return partsGoal
      ? { goal: partsGoal, confidence: "high", suggestions: [], partsGoal }
      : null;
  }

  // A goal that only shares a word gives way to parts the text really names.
  const weak = clear !== wrapper && clear.score < CONFIDENT_SCORE;
  const namedParts = detectJobs(tokens, data, new Set(), true).length > 0;
  const goal =
    weak && partsGoal && namedParts
      ? partsGoal
      : goalWithTemplate(
          clear.goal,
          tokens,
          goalText,
          data,
          clear.spans,
          clear.companion,
        );
  const decided =
    clear === wrapper ||
    clear.ledByCue === true ||
    (clear.score >= CONFIDENT_SCORE &&
      (second === undefined || clear.score - second.score >= CONFIDENT_LEAD));
  const suggestions = decided
    ? []
    : contenders.slice(0, MAX_SUGGESTIONS).map(({ goal: option }) => ({
        goalType: option.id,
        title: option.title,
      }));

  return {
    goal,
    confidence: decided ? "high" : "low",
    suggestions,
    partsGoal,
  };
}

/** The same sentence read as one particular goal, for "Did you mean". */
export function understandAs(
  goalText: string,
  goalType: GoalType,
  data: Catalogue = catalogue,
): UnderstoodGoal | null {
  const template = data.goals.find((goal) => goal.id === goalType);
  if (!template) return null;
  const tokens = tokenize(goalText);
  const { spans } = scorePhrases(tokens, [
    ...template.keywords,
    ...template.synonyms,
  ]);
  return goalWithTemplate(template, tokens, goalText, data, spans);
}

export function interpretGoal(
  goalText: string,
  data: Catalogue = catalogue,
): UnderstoodGoal | null {
  return understandGoal(goalText, data)?.goal ?? null;
}
