import { mergeSignals } from "./admission.ts";
import { identityKeys, slugify } from "./identity.ts";
import { hashText } from "../storage/hash.ts";
import {
  DESCRIPTION_LENGTH,
  NAME_LENGTH,
  cleanText,
  safeHttpsUrl,
} from "./sanitize.ts";
import type { Candidate, RawCandidate, Signals, SourceLink } from "./types.ts";

const MAX_SOURCES = 6;
const MAX_TOPICS = 8;

function cleanMaker(input: string | null): string | null {
  if (input === null) return null;
  const text = cleanText(input, NAME_LENGTH).replace(/[@#]/g, "").trim();
  return text === "" ? null : text;
}

function cleanSignals(signals: Signals): Signals {
  const clean: Signals = {};
  for (const key of [
    "githubStars",
    "hfLikes",
    "hfDownloads",
    "hnPoints",
  ] as const) {
    const value = signals[key];
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
      clean[key] = Math.floor(value);
    }
  }
  if (signals.announced === true) clean.announced = true;
  return clean;
}

/**
 * Turns one source's raw item into a candidate with clean text and https
 * links only, or null when it has no usable name or nowhere to go.
 */
export function cleanCandidate(raw: RawCandidate): Candidate | null {
  const name = cleanText(raw.name, NAME_LENGTH);
  if (!/[\p{L}\p{N}]/u.test(name)) return null;

  const homepage = safeHttpsUrl(raw.homepage);
  const repository = safeHttpsUrl(raw.repository);
  const announcement = safeHttpsUrl(raw.announcement);
  if (homepage === null && repository === null && announcement === null) {
    return null;
  }

  const seen = safeHttpsUrl(raw.seenUrl);
  const sources: SourceLink[] =
    seen === null ? [] : [{ source: raw.source, url: seen }];

  const keys = identityKeys({ name, homepage, repository });
  return {
    id: slugify(name),
    name,
    description: cleanText(raw.description, DESCRIPTION_LENGTH),
    homepage,
    repository,
    announcement,
    maintainer: cleanMaker(raw.maintainer),
    kind: raw.kindHint ?? "ai-tool",
    keys,
    sources,
    signals: cleanSignals(raw.signals),
    topics: raw.topics
      .map((topic) => cleanText(topic, 30).toLowerCase())
      .filter((topic) => topic !== "")
      .slice(0, MAX_TOPICS),
  };
}

function absorb(target: Candidate, other: Candidate): void {
  target.homepage ??= other.homepage;
  target.repository ??= other.repository;
  target.announcement ??= other.announcement;
  target.maintainer ??= other.maintainer;
  if (other.description.length > target.description.length) {
    target.description = other.description;
  }
  if (target.kind === "ai-tool") target.kind = other.kind;
  target.keys = [...new Set([...target.keys, ...other.keys])];
  target.signals = mergeSignals(target.signals, other.signals);
  target.topics = [...new Set([...target.topics, ...other.topics])].slice(
    0,
    MAX_TOPICS,
  );
  for (const link of other.sources) {
    const known = target.sources.some(
      (entry) => entry.source === link.source && entry.url === link.url,
    );
    if (!known && target.sources.length < MAX_SOURCES)
      target.sources.push(link);
  }
}

/**
 * Two items that share a name are the same tool unless each points at its own
 * repository or its own site, in which case they are different things that
 * happen to be called alike.
 */
function sameThing(a: Candidate, b: Candidate): boolean {
  for (const prefix of ["repo:", "site:"]) {
    const left = a.keys.filter((key) => key.startsWith(prefix));
    const right = b.keys.filter((key) => key.startsWith(prefix));
    const both = left.length > 0 && right.length > 0;
    if (both && !left.some((key) => right.includes(key))) return false;
  }
  return true;
}

/**
 * Merges candidates that share a repository, a site or a name, so a tool
 * found on GitHub and on Hacker News is one candidate with both sources.
 */
export function mergeCandidates(candidates: readonly Candidate[]): Candidate[] {
  const merged: Candidate[] = [];
  const byKey = new Map<string, Candidate>();

  for (const candidate of candidates) {
    const home = candidate.keys
      .map((key) => byKey.get(key))
      .find((found) => found !== undefined && sameThing(found, candidate));
    if (home === undefined) {
      const copy: Candidate = {
        ...candidate,
        sources: [...candidate.sources],
        keys: [...candidate.keys],
        topics: [...candidate.topics],
        signals: { ...candidate.signals },
      };
      merged.push(copy);
      for (const key of copy.keys) byKey.set(key, copy);
    } else {
      absorb(home, candidate);
      for (const key of home.keys) byKey.set(key, home);
    }
  }

  // Two different products can share a name; keep their ids apart.
  const seen = new Set<string>();
  for (const candidate of merged) {
    if (seen.has(candidate.id)) {
      candidate.id = `${candidate.id}-${hashText(candidate.keys.join()).slice(0, 4)}`;
    }
    seen.add(candidate.id);
  }
  return merged;
}
