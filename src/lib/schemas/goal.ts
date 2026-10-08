import { z } from "./zod";

export const GOAL_MAX_LENGTH = 500;

export const goalSchema = z.object({
  goal: z
    .string()
    .trim()
    .min(1, "Describe what you want to do first.")
    .max(GOAL_MAX_LENGTH, `Keep it under ${GOAL_MAX_LENGTH} characters.`),
});

export type GoalInput = z.infer<typeof goalSchema>;
