import { NEWS_TAGS, type NewsItem, type NewsTag } from "./types";

export const NEWS_PAGE_SIZE = 20;
const MAX_TEXT_LENGTH = 80;
const MAX_PAGE = 1000;

export interface NewsQuery {
  q: string;
  tag: NewsTag | null;
  source: string | null;
  page: number;
}

export const DEFAULT_NEWS_QUERY: NewsQuery = {
  q: "",
  tag: null,
  source: null,
  page: 1,
};

type RawParams = Record<string, string | string[] | undefined>;

function first(params: RawParams, key: string): string {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/**
 * Reads filters from the URL. Anything unknown falls back to its default, so
 * an old or hand-edited link still shows a list.
 */
export function parseNewsQuery(
  params: RawParams,
  sourceIds: readonly string[],
): NewsQuery {
  const tag = first(params, "tag");
  const source = first(params, "source");
  const page = Number.parseInt(first(params, "page"), 10);
  return {
    q: first(params, "q").replace(/\s+/g, " ").trim().slice(0, MAX_TEXT_LENGTH),
    tag: (NEWS_TAGS as readonly string[]).includes(tag)
      ? (tag as NewsTag)
      : null,
    source: sourceIds.includes(source) ? source : null,
    page: Number.isInteger(page) && page > 0 && page < MAX_PAGE ? page : 1,
  };
}

export function hasActiveNewsFilters(query: NewsQuery): boolean {
  return query.q !== "" || query.tag !== null || query.source !== null;
}

export function newsHref(
  query: NewsQuery,
  patch: Partial<NewsQuery> = {},
): string {
  const next = { ...query, ...patch };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.tag) params.set("tag", next.tag);
  if (next.source) params.set("source", next.source);
  if (next.page > 1) params.set("page", String(next.page));
  const search = params.toString();
  return search ? `/what-changed?${search}` : "/what-changed";
}

export interface NewsPage {
  matches: NewsItem[];
  pageItems: NewsItem[];
  page: number;
  pageCount: number;
}

export function queryNews(
  items: readonly NewsItem[],
  query: NewsQuery,
): NewsPage {
  const needle = query.q.toLowerCase();
  const matches = items.filter((item) => {
    if (query.tag && item.tag !== query.tag) return false;
    if (query.source && item.sourceId !== query.source) return false;
    if (needle === "") return true;
    return [item.title, item.summary, item.sourceName]
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });
  const pageCount = Math.max(1, Math.ceil(matches.length / NEWS_PAGE_SIZE));
  const page = Math.min(query.page, pageCount);
  const start = (page - 1) * NEWS_PAGE_SIZE;
  return {
    matches,
    pageItems: matches.slice(start, start + NEWS_PAGE_SIZE),
    page,
    pageCount,
  };
}
