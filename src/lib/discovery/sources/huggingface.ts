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

const API = "https://huggingface.co/api";
const DAY_MS = 86_400_000;

export function toCandidate(
  item: HuggingFaceItem,
  type: "model" | "space",
): RawCandidate | null {
  const [owner, name, ...rest] = item.id.split("/");
  if (owner === undefined || name === undefined || rest.length > 0) return null;
  if (item.private === true) return null;
  // Fine-tunes, quantisations and adapters point at the model they came from.
  const tags = item.tags ?? [];
  if (tags.some((tag) => tag.startsWith("base_model:") || tag === "gguf")) {
    return null;
  }
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

/** Items that are new enough and liked enough to be worth listing. */
export function parseList(
  json: unknown,
  type: "model" | "space",
  config: DiscoveryConfig,
  now: Date,
): RawCandidate[] {
  if (!Array.isArray(json)) return [];
  const oldest = now.getTime() - config.huggingface.createdWithinDays * DAY_MS;
  const found: RawCandidate[] = [];
  for (const entry of json) {
    const item = itemSchema.safeParse(entry);
    if (!item.success) continue;
    const created = Date.parse(item.data.createdAt ?? "");
    if (Number.isNaN(created) || created < oldest || created > now.getTime()) {
      continue;
    }
    if ((item.data.likes ?? 0) < config.listing.hfLikes) continue;
    const candidate = toCandidate(item.data, type);
    if (candidate !== null) found.push(candidate);
  }
  return found;
}

function listUrl(type: "models" | "spaces", limit: number): string {
  const params = new URLSearchParams({
    sort: "trendingScore",
    direction: "-1",
    limit: String(limit),
  });
  return `${API}/${type}?${params}`;
}

/** The trending models and Spaces, kept when created recently and liked. */
export async function fetchHuggingFace(
  client: JsonClient,
  config: DiscoveryConfig,
  now: Date,
): Promise<SourceResult<RawCandidate>> {
  const items: RawCandidate[] = [];
  let requests = 0;
  const errors: string[] = [];
  const lists = [
    ["models", "model"],
    ["spaces", "space"],
  ] as const;
  for (const [path, type] of lists) {
    requests += 1;
    try {
      const json = await client.getJson(
        listUrl(path, config.huggingface.perList),
      );
      items.push(...parseList(json, type, config, now));
    } catch (error) {
      errors.push(`${path}: ${reason(error)}`);
    }
  }
  return {
    source: "huggingface",
    ok: errors.length < lists.length,
    items,
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
