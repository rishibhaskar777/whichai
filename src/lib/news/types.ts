/*
 * Plain types for the news feature. No runtime imports, so the parser and the
 * cache can run under Node without a build step.
 */

export const NEWS_TAGS = [
  "new-model",
  "new-tool",
  "feature-update",
  "pricing",
  "policy",
  "research",
  "other",
] as const;
export type NewsTag = (typeof NEWS_TAGS)[number];

export interface NewsSource {
  id: string;
  name: string;
  feedUrl: string;
  homepage: string;
  /** Hosts a story link may be on. `github.com/owner` limits a shared host. */
  officialDomains: string[];
  /** Catalogue tool ids the source is about. */
  toolIds: string[];
  defaultTag: NewsTag;
}

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  /** ISO 8601, always in the past when the item was accepted. */
  publishedAt: string;
  sourceId: string;
  sourceName: string;
  /** Plain text, at most 160 characters. */
  summary: string;
  tag: NewsTag;
  toolIds: string[];
}

export interface ToolName {
  id: string;
  name: string;
}

/** What the server hands the side panel: a few headlines and how fresh they are. */
export interface PanelNews {
  items: readonly NewsItem[];
  /** ISO time the list was made; relative times are measured from it. */
  now: string;
  lastUpdated: string | null;
  /** True when the last refresh failed for every feed. */
  allFailed: boolean;
}
