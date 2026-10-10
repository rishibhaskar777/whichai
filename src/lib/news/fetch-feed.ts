export const FETCH_TIMEOUT_MS = 5000;
export const MAX_RESPONSE_BYTES = 1_000_000;

export interface FetchOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  maxBytes?: number;
}

const USER_AGENT = "WhichAI-news/1.0 (reads public feeds, once per 30 minutes)";

/**
 * Downloads one feed. The caller passes an address from `sources.json` and
 * nothing a visitor typed. It is https only, follows no redirect (a moved
 * feed is a source to fix, not a place to wander), times out, and stops
 * reading at the byte limit. A feed bigger than the limit is read up to the
 * limit; newest entries come first in practice and a cut-off entry is
 * ignored by the parser.
 */
export async function fetchFeedText(
  url: string,
  {
    fetchImpl = fetch,
    timeoutMs = FETCH_TIMEOUT_MS,
    maxBytes = MAX_RESPONSE_BYTES,
  }: FetchOptions = {},
): Promise<string> {
  if (new URL(url).protocol !== "https:") throw new Error("not https");

  const response = await fetchImpl(url, {
    method: "GET",
    redirect: "manual",
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      accept:
        "application/atom+xml, application/rss+xml, application/xml, text/xml;q=0.9",
      "user-agent": USER_AGENT,
    },
  });
  if (response.status !== 200) throw new Error(`HTTP ${response.status}`);
  if (!response.body) return "";

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (received < maxBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    const room = maxBytes - received;
    chunks.push(value.length > room ? value.subarray(0, room) : value);
    received += Math.min(value.length, room);
  }
  await reader.cancel().catch(() => undefined);

  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder("utf-8").decode(bytes);
}
