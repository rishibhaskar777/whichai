import { z } from "zod";
import type { DiscoveryConfig } from "../config.ts";
import { hostOf } from "../identity.ts";
import { reason, type JsonClient, type SourceResult } from "../http.ts";
import { safeHttpsUrl } from "../sanitize.ts";
import type { CandidateKind, RawCandidate } from "../types.ts";

const repositorySchema = z.object({
  name: z.string(),
  full_name: z.string(),
  description: z.string().nullable().optional(),
  html_url: z.string(),
  homepage: z.string().nullable().optional(),
  stargazers_count: z.number(),
  created_at: z.string().optional(),
  topics: z.array(z.string()).optional(),
  fork: z.boolean().optional(),
  archived: z.boolean().optional(),
  disabled: z.boolean().optional(),
  owner: z.object({ login: z.string() }),
});
export type GithubRepository = z.infer<typeof repositorySchema>;

const searchSchema = z.object({ items: z.array(z.unknown()) });
const DAY_MS = 86_400_000;

function kindOf(topics: readonly string[]): CandidateKind | null {
  const has = (...names: string[]) => names.some((n) => topics.includes(n));
  if (has("cli", "command-line", "terminal")) return "cli";
  if (has("vscode-extension", "chrome-extension", "browser-extension")) {
    return "extension";
  }
  if (has("sdk", "library", "framework")) return "library";
  return null;
}

function wordsOf(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9-]+/)
      .filter(Boolean),
  );
}

/** A homepage of its own: https, and not just the repository again. */
function ownHomepage(homepage: string | null | undefined): string | null {
  const safe = safeHttpsUrl(homepage ?? "");
  if (safe === null) return null;
  return hostOf(safe) === "github.com" ? null : safe;
}

/**
 * The repository as a candidate, or null when it fails the filters: a fork,
 * an archived or disabled repository, a list, course or paper by name or
 * topic, too few stars or too slow a rise, or nothing that says it is a tool
 * a person can use (a homepage of its own, or a user-facing word in the
 * description).
 */
export function toCandidate(
  repo: GithubRepository,
  config: DiscoveryConfig,
  now: Date,
): RawCandidate | null {
  const rules = config.github;
  if (repo.fork === true || repo.archived === true || repo.disabled === true) {
    return null;
  }
  if (repo.stargazers_count < rules.minStars) return null;

  const created = Date.parse(repo.created_at ?? "");
  if (Number.isNaN(created)) return null;
  const ageDays = Math.max(1, (now.getTime() - created) / DAY_MS);
  if (repo.stargazers_count / ageDays < rules.minStarsPerDay) return null;

  const topics = repo.topics ?? [];
  const excluded = new Set(rules.excludeWords);
  const named = [
    ...wordsOf(repo.name),
    ...repo.name.toLowerCase().split(/[^a-z0-9]+/),
    ...topics.flatMap((topic) => [topic, ...topic.split("-")]),
  ];
  if (named.some((word) => excluded.has(word))) return null;
  if (/\bawesome\b.*\blist\b|\bcurated list\b/i.test(repo.description ?? "")) {
    return null;
  }

  const homepage = ownHomepage(repo.homepage);
  const described = wordsOf(repo.description ?? "");
  const namesATool = rules.toolWords.some((word) => described.has(word));
  if (homepage === null && !namesATool) return null;

  return {
    source: "github",
    name: repo.name,
    description: repo.description ?? "",
    homepage,
    repository: repo.html_url,
    announcement: null,
    maintainer: repo.owner.login,
    topics,
    kindHint: kindOf(topics),
    seenUrl: repo.html_url,
    signals: { githubStars: repo.stargazers_count },
  };
}

export interface Parsed {
  /** Items in the response before any filter. */
  seen: number;
  kept: RawCandidate[];
}

/** Repositories in a search response that pass the filters. */
export function parseSearch(
  json: unknown,
  config: DiscoveryConfig,
  now: Date,
): Parsed {
  const parsed = searchSchema.safeParse(json);
  if (!parsed.success) return { seen: 0, kept: [] };
  const kept: RawCandidate[] = [];
  for (const item of parsed.data.items) {
    const repo = repositorySchema.safeParse(item);
    if (!repo.success) continue;
    const candidate = toCandidate(repo.data, config, now);
    if (candidate !== null) kept.push(candidate);
  }
  return { seen: parsed.data.items.length, kept };
}

const API = "https://api.github.com";

function authHeaders(token: string | undefined): Record<string, string> {
  return {
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  };
}

export function searchUrl(
  topic: string,
  since: string,
  config: DiscoveryConfig,
): string {
  const query = `topic:${topic} created:>${since} stars:>=${config.github.minStars}`;
  const params = new URLSearchParams({
    q: query,
    sort: "stars",
    order: "desc",
    per_page: String(config.github.perQuery),
  });
  return `${API}/search/repositories?${params}`;
}

/**
 * Recently created repositories with AI topics, most starred first. The token
 * is sent to api.github.com only. Without one the search limit is 10 requests
 * a minute, which is enough for the handful of queries made here.
 */
export async function fetchGithub(
  client: JsonClient,
  config: DiscoveryConfig,
  now: Date,
  token?: string,
): Promise<SourceResult<RawCandidate>> {
  const since = new Date(
    now.getTime() - config.github.createdWithinDays * DAY_MS,
  )
    .toISOString()
    .slice(0, 10);
  const items: RawCandidate[] = [];
  let requests = 0;
  let seen = 0;
  try {
    for (const topic of config.github.topics) {
      requests += 1;
      const json = await client.getJson(
        searchUrl(topic, since, config),
        authHeaders(token),
      );
      const parsed = parseSearch(json, config, now);
      seen += parsed.seen;
      items.push(...parsed.kept);
    }
    return { source: "github", ok: true, items, seen, error: null, requests };
  } catch (error) {
    // Keep what earlier queries returned; the rest wait for the next run.
    return {
      source: "github",
      ok: items.length > 0,
      items,
      seen,
      error: reason(error),
      requests,
    };
  }
}

/** Current stars for one repository, or null. Used to refresh tracked candidates. */
export async function lookupRepository(
  client: JsonClient,
  fullName: string,
  token?: string,
): Promise<number | null> {
  if (!/^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(fullName)) return null;
  const json = await client.getJson(
    `${API}/repos/${fullName}`,
    authHeaders(token),
  );
  const repo = z.object({ stargazers_count: z.number() }).safeParse(json);
  return repo.success ? repo.data.stargazers_count : null;
}
