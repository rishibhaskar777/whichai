import { z } from "zod";
import type { DiscoveryConfig } from "../config.ts";
import { reason, type JsonClient, type SourceResult } from "../http.ts";
import { hostOf, isContentHost } from "../identity.ts";
import { fromShowHn } from "../names.ts";
import { safeHttpsUrl } from "../sanitize.ts";
import type { RawCandidate } from "../types.ts";

const hitSchema = z.object({
  objectID: z.string().regex(/^\d+$/),
  title: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  points: z.number().nullable().optional(),
  num_comments: z.number().nullable().optional(),
  author: z.string().nullable().optional(),
});
export type HackerNewsHit = z.infer<typeof hitSchema>;

const responseSchema = z.object({ hits: z.array(z.unknown()) });

/**
 * A "Show HN" post as a candidate, or null when it fails the filters: too few
 * points or comments, an "Ask HN" post, no external https link, a link to a
 * discussion or paper instead of a tool, or no name.
 */
export function toCandidate(
  hit: HackerNewsHit,
  config: DiscoveryConfig,
): RawCandidate | null {
  const rules = config.hackernews;
  if (!hit.title || /^\s*ask hn\b/i.test(hit.title)) return null;
  if ((hit.points ?? 0) < rules.minPoints) return null;
  if ((hit.num_comments ?? 0) < rules.minComments) return null;

  const url = safeHttpsUrl(hit.url ?? "");
  if (url === null) return null;
  const host = hostOf(url);
  if (host === null || host === "news.ycombinator.com" || isContentHost(host)) {
    return null;
  }

  const named = fromShowHn(hit.title, url);
  if (named === null) return null;
  const onRepository = host === "github.com";
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

export interface Parsed {
  seen: number;
  kept: RawCandidate[];
}

export function parseHits(json: unknown, config: DiscoveryConfig): Parsed {
  const parsed = responseSchema.safeParse(json);
  if (!parsed.success) return { seen: 0, kept: [] };
  const kept: RawCandidate[] = [];
  for (const entry of parsed.data.hits) {
    const hit = hitSchema.safeParse(entry);
    if (!hit.success) continue;
    const candidate = toCandidate(hit.data, config);
    if (candidate !== null) kept.push(candidate);
  }
  return { seen: parsed.data.hits.length, kept };
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
    numericFilters: `points>=${config.hackernews.minPoints},num_comments>=${config.hackernews.minComments},created_at_i>=${since}`,
    hitsPerPage: String(config.hackernews.perQuery),
  });
  return `https://hn.algolia.com/api/v1/search?${params}`;
}

/** "Show HN" posts about AI above the points and comments thresholds. */
export async function fetchHackerNews(
  client: JsonClient,
  config: DiscoveryConfig,
  now: Date,
): Promise<SourceResult<RawCandidate>> {
  const items: RawCandidate[] = [];
  let requests = 0;
  let seen = 0;
  try {
    for (const query of config.hackernews.queries) {
      requests += 1;
      const parsed = parseHits(
        await client.getJson(searchUrl(query, now, config)),
        config,
      );
      seen += parsed.seen;
      items.push(...parsed.kept);
    }
    return {
      source: "hackernews",
      ok: true,
      items,
      seen,
      error: null,
      requests,
    };
  } catch (error) {
    return {
      source: "hackernews",
      ok: items.length > 0,
      items,
      seen,
      error: reason(error),
      requests,
    };
  }
}
