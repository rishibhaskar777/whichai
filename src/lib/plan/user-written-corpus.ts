import userWritten from "@/data/goals/test-sets/user-written.json";
import { goalIdSchema } from "@/lib/schemas/catalogue";
import { z } from "@/lib/schemas/zod";
import type { CorpusCase } from "./goal-corpus";

const caseSchema = z
  .strictObject({
    text: z.string().trim().min(1).max(500),
    goal: goalIdSchema.optional(),
    parts: z.array(z.string().min(1).max(60)).min(1).optional(),
    none: z.literal(true).optional(),
  })
  .refine(
    (entry) =>
      [entry.goal, entry.parts, entry.none].some(
        (value) => value !== undefined,
      ),
    { message: "Give an expected goal, parts or none." },
  );

/** Sentences written by a real user. Invalid entries fail the test that reads this. */
export const USER_WRITTEN_CASES: readonly CorpusCase[] = z
  .array(caseSchema)
  .parse(userWritten) as CorpusCase[];
