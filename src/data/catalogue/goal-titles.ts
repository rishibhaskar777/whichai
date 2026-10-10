import type { GoalId } from "@/lib/schemas/catalogue";

/**
 * Goal titles for pages that only need a name, so they do not have to load the
 * whole catalogue. A catalogue test keeps this in step with goals.json.
 */
export const GOAL_TITLES: Record<GoalId, string> = {
  "portfolio-website": "Portfolio website",
  "study-plan": "Study plan",
  "resume-and-job-search": "Resume and job search",
  "make-a-video": "Make a video",
  "build-an-app": "Build an app",
  "research-and-reading": "Research and reading",
  "business-website": "Business website",
  presentation: "Presentation",
  "pick-an-ai": "Pick the right AI for a task",
};
