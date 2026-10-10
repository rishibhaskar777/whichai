export const REPOSITORY_URL = "https://github.com/rishibhaskar777/whichai";
export const SECURITY_POLICY_URL = `${REPOSITORY_URL}/security/policy`;
export const FEEDBACK_URL = `${REPOSITORY_URL}/issues/new?template=feedback.yml`;

/** A prefilled issue form for a wrong or out-of-date record. */
export function toolProblemUrl(toolId: string): string {
  const params = new URLSearchParams({
    template: "tool-problem.yml",
    title: `Tool problem: ${toolId}`,
    tool: toolId,
  });
  return `${REPOSITORY_URL}/issues/new?${params.toString()}`;
}
