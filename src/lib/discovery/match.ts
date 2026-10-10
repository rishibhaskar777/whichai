import { wordsMatch } from "../plan/text-match.ts";
import {
  hostOf,
  isSharedHost,
  normaliseName,
  repositoryKey,
} from "./identity.ts";
import type { RejectedList } from "./config.ts";

/** The parts of a catalogue record that decide whether a candidate is known. */
export interface IndexedTool {
  id: string;
  name: string;
  providerId: string;
  officialUrl: string;
  officialDomains: string[];
  getIt?: Record<string, unknown> | undefined;
}

export interface IndexedProvider {
  id: string;
  name: string;
}

export type DuplicateReason =
  "repository" | "domain" | "name" | "alias" | "typo" | "extends";

export interface Duplicate {
  toolId: string;
  reason: DuplicateReason;
}

interface Entry {
  toolId: string;
  /** Exact names: the name and the aliases made from it. */
  exact: { text: string; reason: "name" | "alias" }[];
  /** The name as lowercase words, to spot "Ollama Desktop" for "Ollama". */
  words: string[];
}

export interface CatalogueIndex {
  entries: Entry[];
  hosts: { host: string; toolId: string }[];
  repositories: Map<string, string>;
}

const MIN_PREFIX_LENGTH = 4;

function wordsOf(text: string): string[] {
  return text
    .normalize("NFKD")
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 0);
}

function linkUrls(tool: IndexedTool): string[] {
  const urls = [tool.officialUrl];
  for (const entry of Object.values(tool.getIt ?? {})) {
    if (entry && typeof entry === "object" && "url" in entry) {
      const { url } = entry as { url: unknown };
      if (typeof url === "string") urls.push(url);
    }
  }
  return urls;
}

/**
 * The catalogue records have no alias field, so aliases are made from what is
 * there: the id, the name without the company's name in front of it, and the
 * name without a bracketed part.
 */
function aliasesOf(tool: IndexedTool, provider: IndexedProvider | undefined) {
  const aliases = new Set<string>();
  aliases.add(normaliseName(tool.id));
  aliases.add(normaliseName(tool.name.replace(/\([^)]*\)/g, "")));
  const name = tool.name.toLowerCase();
  const company = provider?.name.toLowerCase();
  if (company !== undefined && name.startsWith(`${company} `)) {
    aliases.add(normaliseName(name.slice(company.length)));
  }
  if (company !== undefined && !name.startsWith(company)) {
    aliases.add(normaliseName(`${company} ${name}`));
  }
  const own = normaliseName(tool.name);
  aliases.delete(own);
  aliases.delete("");
  return [...aliases];
}

export function buildIndex(
  tools: readonly IndexedTool[],
  providers: readonly IndexedProvider[],
): CatalogueIndex {
  const providerById = new Map(providers.map((p) => [p.id, p]));
  const entries: Entry[] = [];
  const hosts: CatalogueIndex["hosts"] = [];
  const repositories = new Map<string, string>();

  for (const tool of tools) {
    const own = normaliseName(tool.name);
    entries.push({
      toolId: tool.id,
      exact: [
        { text: own, reason: "name" },
        ...aliasesOf(tool, providerById.get(tool.providerId)).map((text) => ({
          text,
          reason: "alias" as const,
        })),
      ],
      words: wordsOf(tool.name),
    });
    for (const domain of tool.officialDomains) {
      // `github.com/owner` is shared by every project of the owner, so only
      // whole hosts identify a tool.
      if (domain.includes("/") || isSharedHost(domain)) continue;
      hosts.push({ host: domain.toLowerCase(), toolId: tool.id });
    }
    for (const url of linkUrls(tool)) {
      const key = repositoryKey(url);
      if (key !== null) repositories.set(key, tool.id);
    }
  }
  return { entries, hosts, repositories };
}

function onHost(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

export interface Subject {
  name: string;
  homepage: string | null;
  repository: string | null;
}

/** The catalogue tool a candidate already is, or null when it is new. */
export function findDuplicate(
  subject: Subject,
  index: CatalogueIndex,
): Duplicate | null {
  for (const url of [subject.repository, subject.homepage]) {
    const key = repositoryKey(url);
    const toolId = key === null ? undefined : index.repositories.get(key);
    if (toolId !== undefined) return { toolId, reason: "repository" };
  }

  for (const url of [subject.homepage, subject.repository]) {
    const host = url === null ? null : hostOf(url);
    if (host === null || isSharedHost(host)) continue;
    const hit = index.hosts.find((entry) => onHost(host, entry.host));
    if (hit !== undefined) return { toolId: hit.toolId, reason: "domain" };
  }

  const name = normaliseName(subject.name);
  if (name === "") return null;

  for (const entry of index.entries) {
    const exact = entry.exact.find((candidate) => candidate.text === name);
    if (exact !== undefined)
      return { toolId: entry.toolId, reason: exact.reason };
  }
  for (const entry of index.entries) {
    if (entry.exact.some((candidate) => wordsMatch(name, candidate.text))) {
      return { toolId: entry.toolId, reason: "typo" };
    }
  }

  const words = wordsOf(subject.name);
  for (const entry of index.entries) {
    const own = entry.words;
    const longEnough = own.join("").length >= MIN_PREFIX_LENGTH;
    const startsWith =
      own.length > 0 &&
      words.length > own.length &&
      own.every((word, offset) => words[offset] === word);
    if (longEnough && startsWith) {
      return { toolId: entry.toolId, reason: "extends" };
    }
  }
  return null;
}

/** Why a candidate is on the rejected list, or null when it is not. */
export function findRejected(
  subject: Subject,
  rejected: RejectedList,
): string | null {
  const name = normaliseName(subject.name);
  for (const entry of rejected.names) {
    const other = normaliseName(entry);
    if (other !== "" && (other === name || wordsMatch(name, other))) {
      return `name matches "${entry}"`;
    }
  }

  for (const entry of rejected.domains) {
    const [host = "", owner] = entry.toLowerCase().split("/");
    for (const url of [subject.homepage, subject.repository]) {
      if (url === null) continue;
      const found = hostOf(url);
      if (found === null || !onHost(found, host)) continue;
      if (owner === undefined) return `domain matches ${entry}`;
      const path = new URL(url).pathname.toLowerCase().split("/")[1];
      if (path === owner) return `domain matches ${entry}`;
    }
  }
  return null;
}
