import { z } from "zod";
import type { DiscoveryConfig } from "../config.ts";
import { reason, type JsonClient, type SourceResult } from "../http.ts";
import { hostOf, isContentHost } from "../identity.ts";
import { fromShowHn } from "../names.ts";
import type { RawCandidate } from "../types.ts";

const hitSchema = z.object({
  objectID: z.string().regex(/^\d+$/),
  title: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  points: z.number().nullable().optional(),
  author: z.string().nullable().optional(),
});
export type HackerNewsHit = z.infer<typeof hitSchema>;

const responseSchema = z.object({ hits: z.array(z.unknown()) });

export function toCandidate(hit: HackerNewsHit): RawCandidate | null {
  if (!hit.title) return null;
  const url = hit.url ?? null;
  const named = fromShowHn(hit.title, url);
  if (named === null) return null;
  const host = url === null ? null : hostOf(url);
  if (host !== null && isContentHost(host)) return null;
  const onRepository = url !== null && /^https:\/\/github\.com\//.test(url);
  return {
    source: "hackernews",
    name: named.name,
    description: named.description,
    homepage: onRepository ? null : url,
    repository: onRepository ? url : null,
    announcement: null,
    // A "Show HN" post is the maker showing their own work.
    maintainer: hit.author ?? null,
    topics: [],
    kindHint: null,
    seenUrl: `https://news.ycombinator.com/item?id=${hit.objectID}`,
    signals: { hnPoints: hit.points ?? 0 },
  };
}

export function parseHits(json: unknown): RawCandidate[] {
  const parsed = responseSchema.safeParse(json);
  if (!parsed.success) return [];
  const found: RawCandidate[] = [];
  for (const entry of parsed.data.hits) {
    const hit = hitSchema.safeParse(entry);
    if (!hit.success) continue;
    const candidate = toCandidate(hit.data);
    if (candidate !== null) found.push(candidate);
  }
  return found;
}

export function searchUrl(
  query: string,
  now: Date,
  config: DiscoveryConfig,
): string {
  const since = Math.floor(
    (now.getTime() - config.hackernews.withinDays * 86_400_000) / 1000,
  );
  const params = new URLSearchParams({
    query,
    tags: "show_hn",
    numericFilters: `points>=${config.listing.hnPoints},created_at_i>=${since}`,
    hitsPerPage: String(config.hackernews.perQuery),
  });
  return `https://hn.algolia.com/api/v1/search?${params}`;
}

/** "Show HN" posts about AI above the listing threshold, via Algolia's free API. */
export async function fetchHackerNews(
  client: JsonClient,
  config: DiscoveryConfig,
  now: Date,
): Promise<SourceResult<RawCandidate>> {
  const items: RawCandidate[] = [];
  let requests = 0;
  try {
    for (const query of config.hackernews.queries) {
      requests += 1;
      items.push(
        ...parseHits(await client.getJson(searchUrl(query, now, config))),
      );
    }
    return { source: "hackernews", ok: true, items, error: null, requests };
  } catch (error) {
    return {
      source: "hackernews",
      ok: items.length > 0,
      items,
      error: reason(error),
      requests,
    };
  }
}
