import { catalogue } from "@/data/catalogue";
import { pricingInfo } from "@/lib/catalogue/pricing";
import { featureIdOf, taskJobIdOf } from "@/lib/plan/chips";
import {
  JOB_CATEGORIES,
  JOB_STAGES,
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
  WorkflowStep,
} from "@/lib/schemas/plan";
import { LEVELS } from "@/lib/schemas/plan";
import {
  compatibilityNote,
  costText,
  coverText,
  fillToolNames,
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
  /** Tools picked by hand, by job id. Unknown or unsuitable ids are ignored. */
  chosenTools?: Readonly<Record<string, string>>;
  /** Jobs added from the full list, on top of what the goal provides. */
  addedJobs?: readonly string[];
  /** Jobs taken out of the plan by hand. */
  removedJobs?: readonly string[];
}

export interface PartEdits {
  added?: readonly string[] | undefined;
  removed?: readonly string[] | undefined;
}

interface Picked {
  job: Job;
  selection: Selection;
  /** Later jobs in this plan that the pick already covers on its own. */
  covers: Job[];
}

interface JobSelection {
  ids: string[];
  /** Jobs that are in the plan because of a part, not because of the goal. */
  parts: Set<string>;
}

function stageRank(jobId: string, data: Catalogue): number {
  const stage = data.jobs.find((job) => job.id === jobId)?.stage;
  return stage ? JOB_STAGES.indexOf(stage) : JOB_STAGES.length;
}

function selectJobs(
  template: GoalTemplate,
  chips: readonly Chip[],
  level: Level,
  edits: PartEdits,
  data: Catalogue,
): JobSelection {
  const featureIds = new Set(chips.map(featureIdOf));
  const fromFeatures = template.features
    .filter((feature) => featureIds.has(feature.id))
    .flatMap((feature) => feature.jobs);
  const base = [...template.levels[level].jobs, ...fromFeatures];

  // Parts follow the goal's own jobs, in the order a project goes.
  const parts = [
    ...chips.flatMap((chip) => taskJobIdOf(chip) ?? []),
    ...(edits.added ?? []),
  ].filter((id) => !base.includes(id));
  const ordered = [...new Set(parts)].sort(
    (a, b) => stageRank(a, data) - stageRank(b, data),
  );

  const removed = new Set(edits.removed ?? []);
  const ids = [...new Set([...base, ...ordered])].filter(
    (id) => !removed.has(id),
  );
  if (ids.length === 0) ids.push(DEFAULT_JOB);
  return { ids: ids.slice(0, MAX_JOBS), parts: new Set(ordered) };
}

export function jobIdsFor(
  template: GoalTemplate,
  chips: readonly Chip[],
  level: Level,
  edits: PartEdits = {},
  data: Catalogue = catalogue,
): string[] {
  return selectJobs(template, chips, level, edits, data).ids;
}

function pickTools(
  jobIds: readonly string[],
  template: GoalTemplate,
  level: Level,
  options: BuildOptions,
  data: Catalogue,
): { picked: Picked[]; coveredBy: Map<string, Tool> } {
  const picked: Picked[] = [];
  const chosen: Tool[] = [];
  const coveredBy = new Map<string, Tool>();

  jobIds.forEach((jobId, position) => {
    const job = data.jobs.find((candidate) => candidate.id === jobId);
    if (!job || coveredBy.has(jobId)) return;
    const selection = selectForJob(jobId, data.tools, {
      level,
      budget: options.budget,
      toolsUsed: options.toolsUsed,
      chosen,
      seed: `${template.id}:${jobId}`,
      forcedToolId: options.chosenTools?.[jobId],
    });
    if (!selection) return;

    const covers = selection.pick.includes.flatMap((includedId) => {
      const later = jobIds.indexOf(includedId) > position;
      const included = data.jobs.find(
        (candidate) => candidate.id === includedId,
      );
      if (!later || !included) return [];
      coveredBy.set(includedId, selection.pick);
      return [included];
    });
    chosen.push(selection.pick);
    picked.push({ job, selection, covers });
  });
  return { picked, coveredBy };
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
  { job, selection, covers }: Picked,
  buildPeers: readonly Tool[],
  goalLevel: GoalLevel,
  options: BuildOptions,
  data: Catalogue,
): JobRecommendation {
  const { pick, tag, outscored, alternatives, autoPick, levelStretched } =
    selection;
  return {
    jobId: job.id,
    jobName: job.name,
    toolId: pick.id,
    toolName: pick.name,
    kind: pick.kind,
    why: whyText(pick, tag, outscored) + coverText(covers),
    tag,
    freeOption: pick.hasFreeOption,
    pricing: pricingInfo(pick),
    watchOutFor: watchOutText(pick, levelStretched),
    fitScore: pick.fitScores[job.id] ?? 1,
    verified: pick.verified,
    sourceLabel: pick.verified ? "official-docs" : "sample",
    lastVerified: pick.lastVerified,
    officialUrl: pick.officialUrl,
    getIt: pick.getIt ?? null,
    modelGuidance: modelGuidanceFor(goalLevel, job, pick, data),
    compatibilityNote:
      job.category === "build"
        ? compatibilityNote(pick, buildPeers, isCompatible)
        : null,
    alternatives: alternatives.map(toAlternative),
    autoPick: autoPick
      ? { toolId: autoPick.id, toolName: autoPick.name }
      : null,
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

/** The plan schema holds up to 12 workflow steps. */
const MAX_STEPS = 12;

/** One step for each part the goal does not cover, so it is not left out. */
function partSteps(
  picked: readonly Picked[],
  parts: ReadonlySet<string>,
  fill: (text: string) => string,
): WorkflowStep[] {
  return picked
    .filter(({ job }) => parts.has(job.id))
    .map(({ job }) => ({
      title: `Your part: ${job.name}`.slice(0, 80),
      detail: fill(`${job.description} Use {job:${job.id}} for this part.`),
      examplePrompt: null,
    }));
}

const BRIEF_LIMIT = 1200;

/** Adds the chosen tools to the brief, before its closing "ask me" line. */
function briefWithTools(brief: string, toolNames: readonly string[]): string {
  const line = `Tools I plan to use: ${[...new Set(toolNames)].join(", ")}.`;
  const lines = brief.split("\n");
  const withTools = [...lines.slice(0, -1), line, ...lines.slice(-1)].join(
    "\n",
  );
  return withTools.length <= BRIEF_LIMIT ? withTools : brief;
}

function buildLevel(
  goal: UnderstoodGoal,
  template: GoalTemplate,
  level: Level,
  options: BuildOptions,
  data: Catalogue,
): PlanLevel {
  const goalLevel = template.levels[level];
  const { ids: jobIds, parts } = selectJobs(
    template,
    goal.chips,
    level,
    { added: options.addedJobs, removed: options.removedJobs },
    data,
  );
  const { picked, coveredBy } = pickTools(
    jobIds,
    template,
    level,
    options,
    data,
  );
  if (picked.length === 0) {
    throw new Error(`No tools could be chosen for ${template.id} at ${level}.`);
  }

  const buildPeers = picked
    .filter(({ job }) => job.category === "build")
    .map(({ selection }) => selection.pick);
  const toolNames = new Map<string, string>([
    ...[...coveredBy].map(([jobId, tool]) => [jobId, tool.name] as const),
    ...picked.map(
      ({ job, selection }) => [job.id, selection.pick.name] as const,
    ),
  ]);
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
    workflow: [
      ...goalLevel.steps.map((step) => ({
        title: fill(step.title),
        detail: fill(step.detail),
        examplePrompt: step.examplePrompt,
      })),
      ...partSteps(picked, parts, fill),
    ].slice(0, MAX_STEPS),
    starterBrief: briefWithTools(
      template.starterBrief,
      picked.map(({ selection }) => selection.pick.name),
    ),
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
