import { z } from "./zod";

export const levelSchema = z.enum(["simple", "polished", "advanced"]);
export type Level = z.infer<typeof levelSchema>;
export const LEVELS = levelSchema.options;

export const goalTypeSchema = z.enum(["portfolio-website", "study-plan"]);
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

const httpsUrl = z
  .url()
  .refine((value) => new URL(value).protocol === "https:", {
    message: "Use an https URL.",
  });

export const alternativeSchema = z.object({
  toolName: text(60),
  chooseIf: text(200),
  paidOnly: z.boolean(),
});
export type Alternative = z.infer<typeof alternativeSchema>;

export const jobRecommendationSchema = z.object({
  jobName: text(60),
  toolName: text(60),
  why: text(300),
  tag: tagSchema,
  pricing: text(200),
  watchOutFor: text(300),
  sourceLabel: sourceLabelSchema,
  lastVerified: z.iso.date().nullable(),
  officialUrl: httpsUrl.nullable(),
  alternatives: z.array(alternativeSchema).max(5),
});
export type JobRecommendation = z.infer<typeof jobRecommendationSchema>;

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
  isSample: z.literal(true),
  levels: z.object({
    simple: planLevelSchema,
    polished: planLevelSchema,
    advanced: planLevelSchema,
  }),
});
export type Plan = z.infer<typeof planSchema>;
