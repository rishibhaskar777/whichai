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
});
export type PlanRequest = z.infer<typeof planRequestSchema>;
