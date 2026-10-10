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

/** The address in SECURITY.md. Empty means "use a GitHub issue instead". */
export const CONTACT_EMAIL: string = "rishibhaskar254@gmail.com";

export function mailtoUrl(subject: string, body: string): string {
  const params = new URLSearchParams({ subject, body });
  // URLSearchParams writes spaces as "+", which mail apps show literally.
  return `mailto:${CONTACT_EMAIL}?${params.toString().replace(/\+/g, "%20")}`;
}

/** A prefilled email to the contact, or a GitHub issue when no email is set. */
export function contactUrl(subject: string, body: string): string {
  if (CONTACT_EMAIL !== "") return mailtoUrl(subject, body);
  const params = new URLSearchParams({ title: subject, body });
  return `${REPOSITORY_URL}/issues/new?${params.toString()}`;
}
