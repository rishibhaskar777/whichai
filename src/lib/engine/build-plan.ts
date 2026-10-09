import { catalogue } from "@/data/catalogue";
import { featureIdOf, taskJobIdOf } from "@/lib/plan/chips";
import {
  JOB_CATEGORIES,
  type Catalogue,
  type GoalLevel,
  type GoalTemplate,
  type Job,
  type Tool,
} from "@/lib/schemas/catalogue";
import type {
  Budget,
  Chip,
  JobRecommendation,
  Level,
  ModelGuidance,
  Plan,
  PlanLevel,
  ToolkitGroup,
  UnderstoodGoal,
} from "@/lib/schemas/plan";
import { LEVELS } from "@/lib/schemas/plan";
import {
  compatibilityNote,
  costText,
  fillToolNames,
  pricingText,
  toAlternative,
  watchOutText,
  whyText,
} from "./describe";
import { isCompatible, selectForJob, type Selection } from "./select-tools";

/** The plan view and the plan schema both hold up to 12 jobs. */
const MAX_JOBS = 12;
const DEFAULT_JOB = "ai-assistant";

export interface BuildOptions {
  /** The level the plan opens on. All three levels are always built. */
  level: Level;
  budget: Budget | null;
  /** Ids of the tools the person already uses. */
  toolsUsed: ReadonlySet<string>;
}

interface Picked {
  job: Job;
  selection: Selection;
}

export function jobIdsFor(
  template: GoalTemplate,
  chips: readonly Chip[],
  level: Level,
): string[] {
  const featureIds = new Set(chips.map(featureIdOf));
  const fromFeatures = template.features
    .filter((feature) => featureIds.has(feature.id))
    .flatMap((feature) => feature.jobs);
  const fromTasks = chips.flatMap((chip) => taskJobIdOf(chip) ?? []);

  const ids = [
    ...new Set([...template.levels[level].jobs, ...fromFeatures, ...fromTasks]),
  ];
  if (ids.length === 0) ids.push(DEFAULT_JOB);
  return ids.slice(0, MAX_JOBS);
}

function pickTools(
  jobIds: readonly string[],
  template: GoalTemplate,
  level: Level,
  options: BuildOptions,
  data: Catalogue,
): Picked[] {
  const picked: Picked[] = [];
  const chosen: Tool[] = [];

  for (const jobId of jobIds) {
    const job = data.jobs.find((candidate) => candidate.id === jobId);
    if (!job) continue;
    const selection = selectForJob(jobId, data.tools, {
      level,
      budget: options.budget,
      toolsUsed: options.toolsUsed,
      chosen,
      seed: `${template.id}:${jobId}`,
    });
    if (!selection) continue;
    chosen.push(selection.pick);
    picked.push({ job, selection });
  }
  return picked;
}

function modelGuidanceFor(
  goalLevel: GoalLevel,
  job: Job,
  tool: Tool,
  data: Catalogue,
): ModelGuidance | null {
  if (tool.kind !== "ai-tool") return null;
  const guidance = goalLevel.modelGuidance.find((g) => g.jobId === job.id);
  if (!guidance) return null;
  return {
    steps: guidance.steps.map((step) => ({
      ...step,
      useFor:
        data.modelClasses.find((c) => c.id === step.modelClass)?.useFor ?? "",
    })),
  };
}

function recommend(
  { job, selection }: Picked,
  buildPeers: readonly Tool[],
  goalLevel: GoalLevel,
  options: BuildOptions,
  data: Catalogue,
): JobRecommendation {
  const { pick, tag, outscored, alternatives, levelStretched } = selection;
  return {
    jobId: job.id,
    jobName: job.name,
    toolId: pick.id,
    toolName: pick.name,
    kind: pick.kind,
    why: whyText(pick, tag, outscored),
    tag,
    pricing: pricingText(pick, options.budget),
    watchOutFor: watchOutText(pick, levelStretched),
    fitScore: pick.fitScores[job.id] ?? 1,
    verified: pick.verified,
    sourceLabel: pick.verified ? "official-docs" : "sample",
    lastVerified: pick.lastVerified,
    officialUrl: pick.officialUrl,
    modelGuidance: modelGuidanceFor(goalLevel, job, pick, data),
    compatibilityNote:
      job.category === "build"
        ? compatibilityNote(pick, buildPeers, isCompatible)
        : null,
    alternatives: alternatives.map(toAlternative),
  };
}

function toolkitFor(picked: readonly Picked[]): ToolkitGroup[] {
  const seen = new Set<string>();
  return JOB_CATEGORIES.flatMap((category) => {
    const tools = picked
      .filter(({ job }) => job.category === category)
      .filter(({ selection }) => {
        if (seen.has(selection.pick.id)) return false;
        seen.add(selection.pick.id);
        return true;
      })
      .map(({ job, selection }) => ({
        jobId: job.id,
        toolId: selection.pick.id,
        toolName: selection.pick.name,
      }));
    return tools.length > 0 ? [{ category, tools }] : [];
  });
}

function buildLevel(
  goal: UnderstoodGoal,
  template: GoalTemplate,
  level: Level,
  options: BuildOptions,
  data: Catalogue,
): PlanLevel {
  const goalLevel = template.levels[level];
  const jobIds = jobIdsFor(template, goal.chips, level);
  const picked = pickTools(jobIds, template, level, options, data);
  if (picked.length === 0) {
    throw new Error(`No tools could be chosen for ${template.id} at ${level}.`);
  }

  const buildPeers = picked
    .filter(({ job }) => job.category === "build")
    .map(({ selection }) => selection.pick);
  const toolNames = new Map(
    picked.map(({ job, selection }) => [job.id, selection.pick.name]),
  );
  const jobsById = new Map(data.jobs.map((job) => [job.id, job]));
  const fill = (text: string) => fillToolNames(text, toolNames, jobsById);

  return {
    summary: fill(goalLevel.summary),
    estimatedCost: costText(
      picked.map(({ selection }) => selection.pick),
      options.budget,
    ),
    estimatedTime: goalLevel.estimatedTime,
    jobs: picked.map((item) =>
      recommend(item, buildPeers, goalLevel, options, data),
    ),
    toolkit: toolkitFor(picked),
    tiers: null,
    workflow: goalLevel.steps.map((step) => ({
      title: fill(step.title),
      detail: fill(step.detail),
      examplePrompt: step.examplePrompt,
    })),
    starterBrief: template.starterBrief,
    checkTheFacts: goalLevel.checkTheFacts,
    whenToUpgrade: goalLevel.whenToUpgrade.map(fill),
    commonMistakes: goalLevel.commonMistakes.map(fill),
  };
}

export function buildPlan(
  goal: UnderstoodGoal,
  options: BuildOptions,
  data: Catalogue = catalogue,
): Plan {
  const template = data.goals.find(
    (candidate) => candidate.id === goal.goalType,
  );
  if (!template) throw new Error(`Unknown goal type ${goal.goalType}.`);

  const [simple, polished, advanced] = LEVELS.map((level) =>
    buildLevel(goal, template, level, options, data),
  ) as [PlanLevel, PlanLevel, PlanLevel];

  const isSample = [simple, polished, advanced].some((level) =>
    level.jobs.some((job) => !job.verified),
  );

  return {
    id: template.id,
    goalType: template.id,
    headline: template.headline,
    isSample,
    startLevel: options.level,
    levels: { simple, polished, advanced },
  };
}
