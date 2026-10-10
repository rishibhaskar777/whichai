import { MAX_AGE_MS, parseFeed } from "./parse-feed";
import type { ToolMatcher } from "./tool-match";
import type { NewsItem, NewsSource } from "./types";

export const REFRESH_INTERVAL_MS = 30 * 60 * 1000;

export interface NewsSnapshot {
  /** Newest first, de-duplicated by link, within the age window. */
  items: NewsItem[];
  /** The moment this snapshot was made. Relative times are measured from it. */
  generatedAt: string;
  /** When any feed last answered, or null if none has since the server began. */
  lastUpdated: string | null;
  /** True when the latest round failed for every feed. */
  allFailed: boolean;
  sources: { id: string; name: string }[];
}

export interface NewsServiceDeps {
  sources: readonly NewsSource[];
  matchTools: ToolMatcher;
  /** Returns the feed text or throws. */
  fetchText: (url: string) => Promise<string>;
  now?: () => number;
  intervalMs?: number;
  warn?: (message: string) => void;
}

interface FeedState {
  items: NewsItem[];
  lastSuccess: number | null;
  failing: boolean;
}

/** Newest first, one entry per link, nothing future-dated or past the window. */
export function mergeItems(
  groups: readonly (readonly NewsItem[])[],
  now: number,
): NewsItem[] {
  const seen = new Set<string>();
  const merged: NewsItem[] = [];
  for (const item of groups.flat()) {
    const published = Date.parse(item.publishedAt);
    if (!Number.isFinite(published) || published > now) continue;
    if (now - published > MAX_AGE_MS) continue;
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    merged.push(item);
  }
  return merged.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

/**
 * Keeps the last good result of every feed and refreshes them together at
 * most once per interval. A stale answer is returned at once while a refresh
 * runs, except on the very first call, which waits for it.
 */
export function createNewsService(deps: NewsServiceDeps) {
  const now = deps.now ?? Date.now;
  const interval = deps.intervalMs ?? REFRESH_INTERVAL_MS;
  const warn = deps.warn ?? ((message: string) => console.warn(message));
  const state = new Map<string, FeedState>(
    deps.sources.map((source) => [
      source.id,
      { items: [], lastSuccess: null, failing: false },
    ]),
  );
  let lastAttempt: number | null = null;
  let allFailed = false;
  let inflight: Promise<void> | null = null;

  async function refreshOne(source: NewsSource): Promise<boolean> {
    const feed = state.get(source.id);
    if (!feed) return false;
    try {
      const text = await deps.fetchText(source.feedUrl);
      const items = parseFeed(text, source, {
        now: now(),
        matchTools: deps.matchTools,
      });
      if (items === null) throw new Error("not a feed");
      feed.items = items;
      feed.lastSuccess = now();
      feed.failing = false;
      return true;
    } catch (error) {
      // One warning per outage, and nothing from the response in it.
      if (!feed.failing) {
        const reason = error instanceof Error ? error.message : "failed";
        warn(`[news] ${source.id}: ${reason}; keeping its last good items`);
      }
      feed.failing = true;
      return false;
    }
  }

  function refresh(): Promise<void> {
    inflight ??= (async () => {
      lastAttempt = now();
      const results = await Promise.all(deps.sources.map(refreshOne));
      allFailed = results.every((ok) => !ok);
    })().finally(() => {
      inflight = null;
    });
    return inflight;
  }

  function snapshot(): NewsSnapshot {
    const current = now();
    const successes = [...state.values()]
      .map((feed) => feed.lastSuccess)
      .filter((time): time is number => time !== null);
    return {
      items: mergeItems(
        [...state.values()].map((feed) => feed.items),
        current,
      ),
      generatedAt: new Date(current).toISOString(),
      lastUpdated:
        successes.length > 0
          ? new Date(Math.max(...successes)).toISOString()
          : null,
      allFailed,
      sources: deps.sources.map(({ id, name }) => ({ id, name })),
    };
  }

  return {
    async get(): Promise<NewsSnapshot> {
      if (lastAttempt === null) {
        await refresh();
      } else if (now() - lastAttempt >= interval) {
        void refresh();
      }
      return snapshot();
    },
  };
}

export type NewsService = ReturnType<typeof createNewsService>;
