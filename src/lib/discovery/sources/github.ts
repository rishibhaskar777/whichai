import { z } from "zod";
import type { DiscoveryConfig } from "../config.ts";
import { reason, type JsonClient, type SourceResult } from "../http.ts";
import type { CandidateKind, RawCandidate } from "../types.ts";

const repositorySchema = z.object({
  name: z.string(),
  full_name: z.string(),
  description: z.string().nullable().optional(),
  html_url: z.string(),
  homepage: z.string().nullable().optional(),
  stargazers_count: z.number(),
  topics: z.array(z.string()).optional(),
  fork: z.boolean().optional(),
  archived: z.boolean().optional(),
  disabled: z.boolean().optional(),
  owner: z.object({ login: z.string() }),
});
export type GithubRepository = z.infer<typeof repositorySchema>;

const searchSchema = z.object({ items: z.array(z.unknown()) });

/** Lists, courses and papers are about AI but are not tools. */
const NOT_A_TOOL =
  /\b(awesome|tutorials?|courses?|books?|handbook|cookbook|guides?|learning|resources|roadmap|cheat-?sheets?|interview|leetcode|papers?|survey|datasets?|benchmarks?|prompts?|examples?|workshop|notes|list|collection)\b/i;

function kindOf(topics: readonly string[]): CandidateKind | null {
  const has = (...names: string[]) => names.some((n) => topics.includes(n));
  if (has("cli", "command-line", "terminal")) return "cli";
  if (has("vscode-extension", "chrome-extension", "browser-extension")) {
    return "extension";
  }
  if (has("sdk", "library", "framework")) return "library";
  return null;
}

export function toCandidate(repo: GithubRepository): RawCandidate | null {
  if (repo.fork === true || repo.archived === true || repo.disabled === true) {
    return null;
  }
  const topics = repo.topics ?? [];
  if (NOT_A_TOOL.test(`${repo.name} ${topics.join(" ")}`)) return null;
  return {
    source: "github",
    name: repo.name,
    description: repo.description ?? "",
    homepage: repo.homepage ?? null,
    repository: repo.html_url,
    announcement: null,
    maintainer: repo.owner.login,
    topics,
    kindHint: kindOf(topics),
    seenUrl: repo.html_url,
    signals: { githubStars: repo.stargazers_count },
  };
}

/** Repositories in a search response. Malformed items are skipped. */
export function parseSearch(json: unknown): RawCandidate[] {
  const parsed = searchSchema.safeParse(json);
  if (!parsed.success) return [];
  const found: RawCandidate[] = [];
  for (const item of parsed.data.items) {
    const repo = repositorySchema.safeParse(item);
    if (!repo.success) continue;
    const candidate = toCandidate(repo.data);
    if (candidate !== null) found.push(candidate);
  }
  return found;
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
  const query = `topic:${topic} created:>${since} stars:>=${config.listing.githubStars}`;
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
    now.getTime() - config.github.createdWithinDays * 86_400_000,
  )
    .toISOString()
    .slice(0, 10);
  const items: RawCandidate[] = [];
  let requests = 0;
  try {
    for (const topic of config.github.topics) {
      requests += 1;
      const json = await client.getJson(
        searchUrl(topic, since, config),
        authHeaders(token),
      );
      items.push(...parseSearch(json));
    }
    return { source: "github", ok: true, items, error: null, requests };
  } catch (error) {
    // Keep what earlier queries returned; the rest wait for the next run.
    return {
      source: "github",
      ok: items.length > 0,
      items,
      error: reason(error),
      requests,
    };
  }
}

/** Current stars for one repository, or null. Used to refresh open candidates. */
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
