import { parseContactEmail } from "@/lib/env";

export const REPOSITORY_URL = "https://github.com/rishibhaskar777/whichai";
export const SECURITY_POLICY_URL = `${REPOSITORY_URL}/security/policy`;
/** GitHub's private vulnerability reporting form for this repository. */
export const SECURITY_REPORT_URL = `${REPOSITORY_URL}/security/advisories/new`;
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

/** The issue form for colleges and coaching centres asking about a plan. */
export function institutionUrl(title: string): string {
  const params = new URLSearchParams({
    template: "institution.yml",
    title,
  });
  return `${REPOSITORY_URL}/issues/new?${params.toString()}`;
}

/** Default contact address. Empty: every contact path goes through GitHub. */
export const CONTACT_EMAIL: string = "";

/**
 * A project-only address from NEXT_PUBLIC_CONTACT_EMAIL, or the default.
 * Empty means "show only the GitHub options".
 */
export function getContactEmail(): string {
  return (
    parseContactEmail(process.env.NEXT_PUBLIC_CONTACT_EMAIL) || CONTACT_EMAIL
  );
}
