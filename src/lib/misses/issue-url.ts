import { REPOSITORY_URL } from "@/lib/links";
import type { MissedGoal } from "@/lib/storage/schemas";

/** Browsers and GitHub both refuse very long addresses, so the list is cut. */
const MAX_GOALS = 25;
const MAX_GOAL_LENGTH = 160;
const MAX_URL_LENGTH = 7000;

/** One line of Markdown with the goal in a code span, so nothing can ping anyone. */
function line(goal: MissedGoal): string {
  const text = goal.goal
    .replace(/\s+/g, " ")
    .replace(/`/g, "'")
    .slice(0, MAX_GOAL_LENGTH);
  return `- \`${text}\` (${goal.reason})`;
}

/**
 * A prefilled "new issue" page listing goals that were not understood. The
 * person sees it in GitHub and chooses whether to submit; nothing is sent from
 * the app itself.
 */
export function buildMissedGoalsIssueUrl(
  goals: readonly MissedGoal[],
  catalogueVersion: string,
): string {
  const lines = goals.slice(0, MAX_GOALS).map(line);
  const make = (items: readonly string[]) => {
    const body = [
      "These goals were not understood by WhichAI. They were kept on my device and I chose to send them.",
      "",
      ...items,
      "",
      `Catalogue version: ${catalogueVersion}`,
    ].join("\n");
    const query = new URLSearchParams({
      title: "Goals WhichAI did not understand",
      body,
    });
    return `${REPOSITORY_URL}/issues/new?${query.toString()}`;
  };

  let items = lines;
  let url = make(items);
  while (url.length > MAX_URL_LENGTH && items.length > 1) {
    items = items.slice(0, -1);
    url = make(items);
  }
  return url;
}
