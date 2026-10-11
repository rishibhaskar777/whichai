import {
  budgetSchema,
  chipKindSchema,
  goalTypeSchema,
  levelSchema,
} from "./plan";
import { z } from "./zod";

/**
 * Everything needed to rebuild a plan with `buildPlan`. The plan itself is
 * never stored or shared, so a rebuilt plan always uses the current data.
 * Strict, because it is also parsed from share links and imported files.
 */
/** Longest list of jobs added to or taken out of a plan by hand. */
export const MAX_PART_EDITS = 12;

const jobIdList = z.array(z.string().min(1).max(60)).max(MAX_PART_EDITS);

export const planRequestSchema = z.strictObject({
  goal: z.strictObject({
    goalType: goalTypeSchema,
    title: z.string().min(1).max(80),
    chips: z
      .array(
        z.strictObject({
          id: z.string().min(1).max(60),
          label: z.string().min(1).max(60),
          kind: chipKindSchema,
        }),
      )
      .max(20),
    inferredLevel: levelSchema,
  }),
  level: levelSchema,
  budget: budgetSchema.nullable(),
  toolsUsed: z.array(z.string().min(1).max(60)).max(40),
  /** Tools picked by hand instead of the engine's choice, by job id. */
  chosenTools: z
    .record(z.string().min(1).max(60), z.string().min(1).max(60))
    .refine((chosen) => Object.keys(chosen).length <= 12)
    .default({}),
  /** Parts (jobs) the person added from the full list. */
  addedJobs: jobIdList.default([]),
  /** Parts (jobs) the person took out of the plan. */
  removedJobs: jobIdList.default([]),
});
export type PlanRequest = z.infer<typeof planRequestSchema>;
