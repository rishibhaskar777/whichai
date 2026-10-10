export const REQUEST_TIMEOUT_MS = 10_000;
export const MAX_JSON_BYTES = 3_000_000;
export const USER_AGENT =
  "WhichAI-discovery/1.0 (weekly job; +https://github.com/rishibhaskar777/whichai-1)";

export class SourceError extends Error {}

export interface JsonClient {
  getJson(url: string, headers?: Record<string, string>): Promise<unknown>;
}

export interface ClientOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  maxBytes?: number;
}

/**
 * A GET that returns parsed JSON. https only, no redirects, a timeout, a size
 * limit, and a clear error for rate limits so a source can be skipped.
 */
export function createJsonClient({
  fetchImpl = fetch,
  timeoutMs = REQUEST_TIMEOUT_MS,
  maxBytes = MAX_JSON_BYTES,
}: ClientOptions = {}): JsonClient {
  return {
    async getJson(url, headers = {}) {
      if (new URL(url).protocol !== "https:")
        throw new SourceError("not https");
      const response = await fetchImpl(url, {
        method: "GET",
        redirect: "manual",
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          accept: "application/json",
          "user-agent": USER_AGENT,
          ...headers,
        },
      });
      if (response.status === 403 || response.status === 429) {
        throw new SourceError(
          `rate limited or refused (HTTP ${response.status})`,
        );
      }
      if (response.status !== 200) {
        throw new SourceError(`HTTP ${response.status}`);
      }
      const text = await response.text();
      if (text.length > maxBytes) throw new SourceError("response too large");
      try {
        return JSON.parse(text) as unknown;
      } catch {
        throw new SourceError("response was not JSON");
      }
    },
  };
}

export interface SourceResult<T> {
  source: string;
  ok: boolean;
  items: T[];
  /** Items the source returned before this project's filters. */
  seen: number;
  error: string | null;
  requests: number;
}

export function reason(error: unknown): string {
  return error instanceof Error ? error.message : "request failed";
}
