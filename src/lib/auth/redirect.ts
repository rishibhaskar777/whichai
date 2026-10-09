/*
 * Only these pages may be the target after sign-in. Matching is exact, on the
 * pathname alone, so nothing a caller puts in a query string, hash or
 * authority can send a person to another site.
 */
export const REDIRECT_ALLOWLIST: readonly string[] = [
  "/",
  "/projects",
  "/searches",
  "/tool-library",
  "/what-changed",
  "/compare-plans",
  "/privacy",
];

export function safeRedirectPath(input: string | null | undefined): string {
  if (!input || !input.startsWith("/") || input.startsWith("//")) return "/";
  if (input.includes("\\")) return "/";
  const pathname = input.split(/[?#]/)[0] ?? "";
  return REDIRECT_ALLOWLIST.includes(pathname) ? pathname : "/";
}
