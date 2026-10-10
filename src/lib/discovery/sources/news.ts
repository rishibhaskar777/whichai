import { fetchFeedText } from "../../news/fetch-feed.ts";
import { parseFeed } from "../../news/parse-feed.ts";
import type { NewsItem, NewsSource } from "../../news/types.ts";
import type { DiscoveryConfig } from "../config.ts";
import { reason, type SourceResult } from "../http.ts";
import { fromAnnouncement } from "../names.ts";
import type { RawCandidate } from "../types.ts";

const DAY_MS = 86_400_000;

/**
 * A launch headline from an official feed that names a product. The link is
 * on the source's own domains (the feed reader drops others), so the company
 * behind it is the source. Whether the product is new to the catalogue is
 * decided later by the duplicate check.
 */
export function toCandidate(
  item: NewsItem,
  source: NewsSource,
): RawCandidate | null {
  const name = fromAnnouncement(item.title);
  if (name === null) return null;
  return {
    source: "news",
    name,
    description: item.summary,
    homepage: null,
    repository: null,
    announcement: item.url,
    maintainer: source.name,
    topics: [],
    kindHint: null,
    seenUrl: item.url,
    signals: { announced: true },
  };
}

export function fromItems(
  items: readonly NewsItem[],
  source: NewsSource,
  config: DiscoveryConfig,
  now: Date,
): RawCandidate[] {
  const oldest = now.getTime() - config.news.withinDays * DAY_MS;
  return items
    .filter((item) => Date.parse(item.publishedAt) >= oldest)
    .map((item) => toCandidate(item, source))
    .filter((candidate): candidate is RawCandidate => candidate !== null);
}

/** Reads every source in sources.json with the site's own feed reader. */
export async function fetchNews(
  sources: readonly NewsSource[],
  config: DiscoveryConfig,
  now: Date,
  fetchImpl?: typeof fetch,
): Promise<SourceResult<RawCandidate>> {
  const failures: string[] = [];
  let seen = 0;
  const results = await Promise.all(
    sources.map(async (source) => {
      try {
        const text = await fetchFeedText(
          source.feedUrl,
          fetchImpl === undefined ? {} : { fetchImpl },
        );
        const items = parseFeed(text, source, {
          now: now.getTime(),
          matchTools: () => [],
          maxAgeMs: config.news.withinDays * DAY_MS,
        });
        if (items === null) throw new Error("not a feed");
        seen += items.length;
        return fromItems(items, source, config, now);
      } catch (error) {
        failures.push(`${source.id}: ${reason(error)}`);
        return [];
      }
    }),
  );
  return {
    source: "news",
    ok: failures.length < sources.length,
    items: results.flat(),
    seen,
    error: failures.length > 0 ? failures.join("; ") : null,
    requests: sources.length,
  };
}
