import type { GoalId } from "@/lib/schemas/catalogue";

/**
 * The goals shown first on the "no plan yet" card. An editorial pick of broad
 * everyday goals, not a count of what people searched for.
 */
export const COMMON_GOAL_IDS: readonly GoalId[] = [
  "portfolio-website",
  "study-plan",
  "resume-and-job-search",
  "presentation",
  "build-an-app",
  "make-a-video",
  "exam-preparation",
  "summarise-pdfs",
];
