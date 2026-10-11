import {
  effortSchema,
  getItSchema,
  goalIdSchema,
  httpsUrl,
  jobCategorySchema,
  modelClassIdSchema,
  toolKindSchema,
} from "./catalogue";
import { z } from "./zod";

export const levelSchema = z.enum(["simple", "polished", "advanced"]);
export type Level = z.infer<typeof levelSchema>;
export const LEVELS = levelSchema.options;

export const goalTypeSchema = goalIdSchema;
export type GoalType = z.infer<typeof goalTypeSchema>;

export const chipKindSchema = z.enum([
  "goal",
  "feature",
  "constraint",
  "skill",
]);
export type ChipKind = z.infer<typeof chipKindSchema>;

export const chipSchema = z.object({
  id: z.string().min(1).max(60),
  label: z.string().min(1).max(60),
  kind: chipKindSchema,
});
export type Chip = z.infer<typeof chipSchema>;

export const understoodGoalSchema = z.object({
  goalType: goalTypeSchema,
  title: z.string().min(1).max(80),
  chips: z.array(chipSchema).max(20),
  inferredLevel: levelSchema,
});
export type UnderstoodGoal = z.infer<typeof understoodGoalSchema>;

export const tagSchema = z.enum(["keep", "better", "new"]);
export type JobTag = z.infer<typeof tagSchema>;

export const sourceLabelSchema = z.enum([
  "tested",
  "official-docs",
  "user-reported",
  "sample",
]);
export type SourceLabel = z.infer<typeof sourceLabelSchema>;

const text = (max: number) => z.string().min(1).max(max);

export const budgetSchema = z.enum(["zero", "under-1000", "1000-3000", "more"]);
export type Budget = z.infer<typeof budgetSchema>;

export const alternativeSchema = z.object({
  toolId: text(60),
  toolName: text(60),
  chooseIf: text(200),
  paidOnly: z.boolean(),
});
export type Alternative = z.infer<typeof alternativeSchema>;

export const modelGuidanceSchema = z.object({
  steps: z
    .array(
      z.object({
        task: text(60),
        modelClass: modelClassIdSchema,
        effort: effortSchema.nullable(),
        useFor: text(240),
      }),
    )
    .min(1)
    .max(4),
});
export type ModelGuidance = z.infer<typeof modelGuidanceSchema>;

export const pricingSchema = z.object({
  /** A summary from the official pricing page. Null until one is recorded. */
  text: text(200).nullable(),
  checkedOn: z.iso.date().nullable(),
  /** The pricing page, or the official site when the tool has no such page. */
  url: httpsUrl,
});
export type Pricing = z.infer<typeof pricingSchema>;

/** A capability class with the model names a tool's own page gives for it. */
export const namedModelsSchema = z.object({
  modelClass: modelClassIdSchema,
  names: z.array(text(60)).min(1).max(8),
});
export type NamedModels = z.infer<typeof namedModelsSchema>;

/**
 * The expandable "Get more from <tool>" content for one card. Every part is
 * recorded data; a part with no data is left empty and not shown.
 */
export const getMoreSchema = z.object({
  /** Model names as the tool's own page gives them, with the day they were read. */
  models: z
    .object({
      classes: z.array(namedModelsSchema).min(1),
      checkedOn: z.iso.date(),
      url: httpsUrl,
    })
    .nullable(),
  /** The capability classes the goal calls for, with what each is for. */
  classAdvice: z.array(
    z.object({ modelClass: modelClassIdSchema, useFor: text(240) }),
  ),
  tips: z.array(z.object({ text: text(200), sourceUrl: httpsUrl.nullable() })),
  tipsCheckedOn: z.iso.date().nullable(),
  addOns: z.array(
    z.object({
      toolId: text(60),
      toolName: text(60),
      kind: toolKindSchema,
      officialUrl: httpsUrl,
      getIt: getItSchema.nullable(),
    }),
  ),
  freePlanTips: z.array(text(200)),
});
export type GetMore = z.infer<typeof getMoreSchema>;

export const jobRecommendationSchema = z.object({
  jobId: text(60),
  jobName: text(60),
  toolId: text(60),
  toolName: text(60),
  kind: toolKindSchema,
  /** What to do with the tool in this job, continuing "Use <tool> to ...". */
  task: text(130),
  /** What the tool is good at for this goal, built from the task's tags. */
  why: text(400),
  /** The tool's general summary, shown as "About <tool>". */
  about: text(180),
  /** A ready prompt for this goal and job. */
  starterPrompt: text(320),
  /** Set only for AI tools that have recorded tips, add-ons or models. */
  getMore: getMoreSchema.nullable(),
  tag: tagSchema,
  freeOption: z.union([z.boolean(), z.literal("verify")]),
  pricing: pricingSchema,
  watchOutFor: text(300),
  fitScore: z.number().int().min(1).max(5),
  verified: z.boolean(),
  sourceLabel: sourceLabelSchema,
  lastVerified: z.iso.date().nullable(),
  officialUrl: httpsUrl.nullable(),
  getIt: getItSchema.nullable(),
  modelGuidance: modelGuidanceSchema.nullable(),
  compatibilityNote: text(240).nullable(),
  alternatives: z.array(alternativeSchema).max(5),
  /** The tool the engine would pick on its own, set only after a swap. */
  autoPick: z.object({ toolId: text(60), toolName: text(60) }).nullable(),
});
export type JobRecommendation = z.infer<typeof jobRecommendationSchema>;

export const toolkitGroupSchema = z.object({
  category: jobCategorySchema,
  tools: z
    .array(z.object({ jobId: text(60), toolId: text(60), toolName: text(60) }))
    .min(1),
});
export type ToolkitGroup = z.infer<typeof toolkitGroupSchema>;

export const tierComparisonSchema = z.object({
  toolName: text(60),
  tiers: z
    .array(z.object({ name: text(40), forThisGoal: text(240) }))
    .length(3),
  upgradeTrigger: text(240),
});
export type TierComparison = z.infer<typeof tierComparisonSchema>;

export const workflowStepSchema = z.object({
  title: text(80),
  detail: text(400),
  examplePrompt: text(600).nullable(),
});
export type WorkflowStep = z.infer<typeof workflowStepSchema>;

export const planLevelSchema = z.object({
  summary: text(400),
  estimatedCost: text(120),
  estimatedTime: text(120),
  jobs: z.array(jobRecommendationSchema).min(1).max(12),
  toolkit: z.array(toolkitGroupSchema).min(1),
  tiers: tierComparisonSchema.nullable(),
  workflow: z.array(workflowStepSchema).min(1).max(12),
  starterBrief: text(1200),
  checkTheFacts: text(400).nullable(),
  whenToUpgrade: z.array(text(240)).min(1).max(6),
  commonMistakes: z.array(text(240)).min(1).max(6),
});
export type PlanLevel = z.infer<typeof planLevelSchema>;

export const planSchema = z.object({
  id: text(60),
  goalType: goalTypeSchema,
  headline: text(100),
  isSample: z.boolean(),
  startLevel: levelSchema,
  levels: z.object({
    simple: planLevelSchema,
    polished: planLevelSchema,
    advanced: planLevelSchema,
  }),
});
export type Plan = z.infer<typeof planSchema>;
