import { REQUEST_TIMEOUT_MS, USER_AGENT } from "./http.ts";
import { hostOf } from "./identity.ts";
import { safeHttpsUrl } from "./sanitize.ts";
import type { HomepageCheck } from "./types.ts";

/** Statuses that mean the address does not lead anywhere. */
function leadsNowhere(status: number): boolean {
  return status >= 500 || status === 404 || status === 410;
}

async function request(
  url: string,
  method: "HEAD" | "GET",
  fetchImpl: typeof fetch,
): Promise<Response> {
  const response = await fetchImpl(url, {
    method,
    redirect: "manual",
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { "user-agent": USER_AGENT, accept: "text/html,*/*;q=0.5" },
  });
  // The body is never read. Only the status and the redirect target matter.
  await response.body?.cancel().catch(() => undefined);
  return response;
}

/**
 * The one request made to a candidate's own site: a HEAD, or a GET when HEAD
 * is refused. A redirect is reported and not followed. A site that answers
 * 401, 403 or 429 exists but refuses scripts, which counts as an answer; the
 * reviewer opens it by hand either way.
 */
export async function checkHomepage(
  url: string,
  today: string,
  fetchImpl: typeof fetch = fetch,
): Promise<HomepageCheck> {
  const safe = safeHttpsUrl(url);
  if (safe === null) {
    return { date: today, status: null, ok: false, redirectHost: null };
  }
  try {
    let response = await request(safe, "HEAD", fetchImpl);
    if ([400, 403, 405, 501].includes(response.status)) {
      response = await request(safe, "GET", fetchImpl);
    }
    const location = response.headers.get("location");
    let redirectHost: string | null = null;
    if (location !== null) {
      const target = safeHttpsUrl(new URL(location, safe).href);
      redirectHost = target === null ? null : hostOf(target);
    }
    return {
      date: today,
      status: response.status,
      ok: !leadsNowhere(response.status),
      redirectHost,
    };
  } catch {
    return { date: today, status: null, ok: false, redirectHost: null };
  }
}
