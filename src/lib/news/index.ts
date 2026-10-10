import { catalogue } from "@/data/catalogue";
import sourcesData from "@/data/news/sources.json";
import { fetchFeedText } from "./fetch-feed";
import {
  createNewsService,
  type NewsService,
  type NewsSnapshot,
} from "./service";
import { parseSources } from "./sources";
import { createToolMatcher } from "./tool-match";

export type { NewsSnapshot };

/*
 * Server only. The service holds the in-memory cache: one per server
 * process, refreshed at most every 30 minutes.
 */
let service: NewsService | null = null;

function getService(): NewsService {
  service ??= createNewsService({
    sources: parseSources(sourcesData),
    matchTools: createToolMatcher(
      catalogue.tools.map(({ id, name }) => ({ id, name })),
    ),
    fetchText: (url) => fetchFeedText(url),
  });
  return service;
}

function emptySnapshot(allFailed: boolean): NewsSnapshot {
  return {
    items: [],
    generatedAt: new Date().toISOString(),
    lastUpdated: null,
    allFailed,
    sources: [],
  };
}

/**
 * Never throws: a broken news layer must not take a page down with it. The
 * production build renders pages without a visitor, and it must not call out
 * to news sites, so it gets an empty list.
 */
export async function getNews(): Promise<NewsSnapshot> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return emptySnapshot(false);
  }
  try {
    return await getService().get();
  } catch {
    return emptySnapshot(true);
  }
}
