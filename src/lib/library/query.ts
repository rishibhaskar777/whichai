import {
  JOB_CATEGORIES,
  platformSchema,
  toolKindSchema,
  type JobCategory,
  type Platform,
  type ToolKind,
} from "@/lib/schemas/catalogue";

export const SORTS = ["name", "fit", "verified"] as const;
export type LibrarySort = (typeof SORTS)[number];

export const PAGE_SIZE = 24;
export const MAX_COMPARE = 3;
const MAX_TEXT_LENGTH = 80;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface LibraryQuery {
  q: string;
  category: JobCategory | null;
  job: string | null;
  kind: ToolKind | null;
  platform: Platform | null;
  free: boolean;
  verifiedOnly: boolean;
  sort: LibrarySort;
  page: number;
  /** Tool ids picked for comparison, kept in the URL so they can be shared. */
  compare: string[];
}

export const DEFAULT_QUERY: LibraryQuery = {
  q: "",
  category: null,
  job: null,
  kind: null,
  platform: null,
  free: false,
  verifiedOnly: false,
  sort: "name",
  page: 1,
  compare: [],
};

type RawParams = Record<string, string | string[] | undefined>;

function first(params: RawParams, key: string): string {
  const value = params[key];
  const single = Array.isArray(value) ? value[0] : value;
  return single ?? "";
}

function oneOf<T extends string>(
  value: string,
  allowed: readonly T[],
): T | null {
  return (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

/** Splits a comma list into valid, unique ids, at most `limit` of them. */
export function parseIdList(value: string, limit = MAX_COMPARE): string[] {
  const ids = value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length <= 60 && SLUG.test(part));
  return [...new Set(ids)].slice(0, limit);
}

/**
 * Reads filters from a URL query. Anything unknown or malformed falls back to
 * its default, so a hand-edited or stale link still shows a sensible list.
 */
export function parseLibraryQuery(params: RawParams): LibraryQuery {
  const page = Number.parseInt(first(params, "page"), 10);
  const job = first(params, "job");
  return {
    q: first(params, "q").replace(/\s+/g, " ").trim().slice(0, MAX_TEXT_LENGTH),
    category: oneOf(first(params, "category"), JOB_CATEGORIES),
    job: SLUG.test(job) && job.length <= 60 ? job : null,
    kind: oneOf(first(params, "kind"), toolKindSchema.options),
    platform: oneOf(first(params, "platform"), platformSchema.options),
    free: first(params, "free") === "1",
    verifiedOnly: first(params, "verified") === "1",
    sort: oneOf(first(params, "sort"), SORTS) ?? "name",
    page: Number.isInteger(page) && page > 0 && page < 1000 ? page : 1,
    compare: parseIdList(first(params, "compare")),
  };
}

/** The query as URL parameters, leaving out every default value. */
export function toSearchParams(query: LibraryQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.category) params.set("category", query.category);
  if (query.job) params.set("job", query.job);
  if (query.kind) params.set("kind", query.kind);
  if (query.platform) params.set("platform", query.platform);
  if (query.free) params.set("free", "1");
  if (query.verifiedOnly) params.set("verified", "1");
  if (query.sort !== "name") params.set("sort", query.sort);
  if (query.page > 1) params.set("page", String(query.page));
  if (query.compare.length > 0) params.set("compare", query.compare.join(","));
  return params;
}

export function libraryHref(
  query: LibraryQuery,
  patch: Partial<LibraryQuery> = {},
): string {
  const search = toSearchParams({ ...query, ...patch }).toString();
  return search ? `/tools?${search}` : "/tools";
}

export function hasActiveFilters(query: LibraryQuery): boolean {
  return (
    query.q !== "" ||
    query.category !== null ||
    query.job !== null ||
    query.kind !== null ||
    query.platform !== null ||
    query.free ||
    query.verifiedOnly
  );
}
