import { z } from "zod";
import type { DiscoveryConfig } from "../config.ts";
import { reason, type JsonClient, type SourceResult } from "../http.ts";
import type { RawCandidate } from "../types.ts";

const itemSchema = z.object({
  id: z.string(),
  likes: z.number().optional(),
  downloads: z.number().optional(),
  createdAt: z.string().optional(),
  private: z.boolean().optional(),
  pipeline_tag: z.string().optional(),
  sdk: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
export type HuggingFaceItem = z.infer<typeof itemSchema>;

const organisationSchema = z.object({
  isVerified: z.boolean().optional(),
  plan: z.string().optional(),
});

const API = "https://huggingface.co/api";
const DAY_MS = 86_400_000;

type ListType = "model" | "space";

/** A fine-tune, quantisation, merge or adapter of another model. */
export function isDerivative(
  item: HuggingFaceItem,
  config: DiscoveryConfig,
): boolean {
  const rules = config.huggingface;
  const tags = (item.tags ?? []).map((tag) => tag.toLowerCase());
  if (
    tags.some(
      (tag) =>
        rules.derivativeTags.includes(tag) ||
        rules.derivativeTagPrefixes.some((prefix) => tag.startsWith(prefix)),
    )
  ) {
    return true;
  }
  const name = item.id.split("/")[1]?.toLowerCase() ?? "";
  const parts = name.split(/[^a-z0-9]+/);
  return parts.some((part) => rules.derivativeNameWords.includes(part));
}

export function toCandidate(
  item: HuggingFaceItem,
  type: ListType,
): RawCandidate | null {
  const [owner, name, ...rest] = item.id.split("/");
  if (owner === undefined || name === undefined || rest.length > 0) return null;
  if (item.private === true) return null;
  const url =
    type === "model"
      ? `https://huggingface.co/${item.id}`
      : `https://huggingface.co/spaces/${item.id}`;
  const description =
    type === "model"
      ? `${item.pipeline_tag ?? "machine learning"} model on Hugging Face`
      : `${item.sdk ?? "app"} Space on Hugging Face`;
  return {
    source: "huggingface",
    name,
    description,
    homepage: null,
    repository: url,
    announcement: null,
    maintainer: owner,
    topics: (item.tags ?? []).slice(0, 8),
    kindHint: type === "model" ? "model" : null,
    seenUrl: url,
    signals: {
      ...(item.likes === undefined ? {} : { hfLikes: item.likes }),
      ...(item.downloads === undefined ? {} : { hfDownloads: item.downloads }),
    },
  };
}

export interface Parsed {
  seen: number;
  kept: RawCandidate[];
}

/**
 * Items that are recent, liked and downloaded enough, and not a derivative of
 * another model. Models also need downloads: likes alone are cheap.
 */
export function parseList(
  json: unknown,
  type: ListType,
  config: DiscoveryConfig,
  now: Date,
): Parsed {
  if (!Array.isArray(json)) return { seen: 0, kept: [] };
  const rules = config.huggingface;
  const oldest = now.getTime() - rules.createdWithinDays * DAY_MS;
  const kept: RawCandidate[] = [];
  for (const entry of json) {
    const item = itemSchema.safeParse(entry);
    if (!item.success) continue;
    const created = Date.parse(item.data.createdAt ?? "");
    if (Number.isNaN(created) || created < oldest || created > now.getTime()) {
      continue;
    }
    if ((item.data.likes ?? 0) < rules.minLikes) continue;
    if (type === "model" && (item.data.downloads ?? 0) < rules.minDownloads) {
      continue;
    }
    if (isDerivative(item.data, config)) continue;
    const candidate = toCandidate(item.data, type);
    if (candidate !== null) kept.push(candidate);
  }
  return { seen: json.length, kept };
}

/**
 * The top items of a list. An official organisation (verified, or on a team or
 * enterprise plan) comes first; a person's own account is kept only above a
 * higher likes threshold. Then likes, then downloads.
 */
export function selectTop(
  candidates: readonly RawCandidate[],
  official: ReadonlySet<string>,
  config: DiscoveryConfig,
): RawCandidate[] {
  const rules = config.huggingface;
  const likes = (c: RawCandidate) => c.signals.hfLikes ?? 0;
  return candidates
    .filter((c) => {
      const owner = c.maintainer ?? "";
      return official.has(owner) || likes(c) >= rules.individualMinLikes;
    })
    .sort((a, b) => {
      const rank = (c: RawCandidate) =>
        official.has(c.maintainer ?? "") ? 1 : 0;
      return (
        rank(b) - rank(a) ||
        likes(b) - likes(a) ||
        (b.signals.hfDownloads ?? 0) - (a.signals.hfDownloads ?? 0)
      );
    })
    .slice(0, rules.keepTop);
}

function listUrl(type: "models" | "spaces", limit: number): string {
  const params = new URLSearchParams({
    sort: "trendingScore",
    direction: "-1",
    limit: String(limit),
  });
  return `${API}/${type}?${params}`;
}

async function officialOrganisations(
  client: JsonClient,
  owners: readonly string[],
  limit: number,
): Promise<{ official: Set<string>; requests: number }> {
  const official = new Set<string>();
  const asked = owners
    .filter((owner) => /^[A-Za-z0-9._-]+$/.test(owner))
    .slice(0, limit);
  await Promise.all(
    asked.map(async (owner) => {
      try {
        const json = await client.getJson(
          `${API}/organizations/${owner}/overview`,
        );
        const parsed = organisationSchema.safeParse(json);
        if (!parsed.success) return;
        const plan = parsed.data.plan;
        if (
          parsed.data.isVerified === true ||
          plan === "team" ||
          plan === "enterprise"
        ) {
          official.add(owner);
        }
      } catch {
        // Not an organisation, or no answer: treated as a person's account.
      }
    }),
  );
  return { official, requests: asked.length };
}

/** The trending models and Spaces, filtered and ranked as described above. */
export async function fetchHuggingFace(
  client: JsonClient,
  config: DiscoveryConfig,
  now: Date,
): Promise<SourceResult<RawCandidate>> {
  const rules = config.huggingface;
  const lists = [
    ["models", "model"],
    ["spaces", "space"],
  ] as const;
  const filtered: RawCandidate[][] = [];
  const errors: string[] = [];
  let requests = 0;
  let seen = 0;
  for (const [path, type] of lists) {
    requests += 1;
    try {
      const json = await client.getJson(listUrl(path, rules.perList));
      const parsed = parseList(json, type, config, now);
      seen += parsed.seen;
      filtered.push(parsed.kept);
    } catch (error) {
      errors.push(`${path}: ${reason(error)}`);
      filtered.push([]);
    }
  }

  const owners = [
    ...new Set(filtered.flat().map((item) => item.maintainer ?? "")),
  ].filter((owner) => owner !== "");
  const lookup = await officialOrganisations(
    client,
    owners,
    rules.maxOrganisationLookups,
  );
  requests += lookup.requests;

  const items = filtered.flatMap((list) =>
    selectTop(list, lookup.official, config),
  );
  return {
    source: "huggingface",
    ok: errors.length < lists.length,
    items,
    seen,
    error: errors.length > 0 ? errors.join("; ") : null,
    requests,
  };
}

/** Current likes and downloads of one model or Space, or null. */
export async function lookupItem(
  client: JsonClient,
  url: string,
): Promise<{ likes: number; downloads: number | undefined } | null> {
  let path: string;
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "huggingface.co") return null;
    path = parsed.pathname.replace(/^\/+/, "");
  } catch {
    return null;
  }
  const type = path.startsWith("spaces/") ? "spaces" : "models";
  const id = path.replace(/^spaces\//, "");
  if (!/^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(id)) return null;
  const json = await client.getJson(`${API}/${type}/${id}`);
  const item = itemSchema.safeParse(json);
  if (!item.success || item.data.likes === undefined) return null;
  return { likes: item.data.likes, downloads: item.data.downloads };
}
