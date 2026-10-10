import { isOnToolDomain } from "../catalogue/links";
import { tagItem } from "./tagging";
import { toPlainText, truncate } from "./text";
import type { ToolMatcher } from "./tool-match";
import type { NewsItem, NewsSource } from "./types";

/*
 * A deliberately small RSS 2.0, RSS 1.0 and Atom reader. It looks for the few
 * elements the site needs with plain string search, so it never expands
 * entities from a DTD, never builds a document tree and takes time linear in
 * the size of its input. See docs/decisions/0012-news-from-official-feeds.md.
 */

export const SUMMARY_LENGTH = 160;
export const TITLE_LENGTH = 200;
export const MAX_AGE_MS = 60 * 24 * 60 * 60 * 1000;
/** Raw entries read from one feed; the response size limit is the real bound. */
const MAX_ENTRIES_SCANNED = 2000;
const MAX_ITEMS_PER_FEED = 30;
const MAX_ITEMS_PER_RELEASES_FEED = 5;
const MAX_LINK_LENGTH = 600;

const PRERELEASE =
  /\b(alpha|beta|rc\d*|canary|nightly|pre-?release|preview|dev)\b/i;

export interface ParseOptions {
  /** Milliseconds since the epoch; items dated after it are dropped. */
  now: number;
  matchTools: ToolMatcher;
}

export function isReleasesFeed(feedUrl: string): boolean {
  return feedUrl.endsWith("/releases.atom");
}

function isNameBoundary(char: string | undefined): boolean {
  return char === ">" || char === "/" || /\s/.test(char ?? "");
}

function indexOfOpenTag(xml: string, name: string, from: number): number {
  const needle = `<${name}`;
  let at = xml.indexOf(needle, from);
  while (at !== -1 && !isNameBoundary(xml[at + needle.length])) {
    at = xml.indexOf(needle, at + needle.length);
  }
  return at;
}

interface OpenTag {
  attributes: string;
  selfClosing: boolean;
  /** Index just after the `>`. */
  contentStart: number;
}

function readOpenTag(xml: string, at: number, name: string): OpenTag | null {
  const end = xml.indexOf(">", at);
  if (end === -1) return null;
  const inside = xml.slice(at + name.length + 1, end);
  return {
    attributes: inside,
    selfClosing: inside.endsWith("/"),
    contentStart: end + 1,
  };
}

/** The raw content of each `<name>` element, in document order. */
function elementBlocks(xml: string, name: string, limit: number): string[] {
  const blocks: string[] = [];
  const close = `</${name}>`;
  let position = 0;
  while (blocks.length < limit) {
    const at = indexOfOpenTag(xml, name, position);
    if (at === -1) break;
    const open = readOpenTag(xml, at, name);
    if (!open) break;
    if (open.selfClosing) {
      position = open.contentStart;
      continue;
    }
    const end = xml.indexOf(close, open.contentStart);
    // An element that never closes is the cut-off end of a large feed.
    if (end === -1) break;
    blocks.push(xml.slice(open.contentStart, end));
    position = end + close.length;
  }
  return blocks;
}

function firstElement(block: string, name: string): string | null {
  return elementBlocks(block, name, 1)[0] ?? null;
}

function attribute(attributes: string, name: string): string | null {
  const match = new RegExp(
    `(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`,
    "i",
  ).exec(attributes);
  return match ? (match[1] ?? match[2] ?? "") : null;
}

function candidateLinks(block: string): string[] {
  const links: string[] = [];
  let position = 0;
  while (links.length < 8) {
    const at = indexOfOpenTag(block, "link", position);
    if (at === -1) break;
    const open = readOpenTag(block, at, "link");
    if (!open) break;
    position = open.contentStart;
    const href = attribute(open.attributes, "href");
    if (href !== null) {
      const rel = attribute(open.attributes, "rel");
      if (rel === null || rel === "alternate") links.push(href);
    } else if (!open.selfClosing) {
      const end = block.indexOf("</link>", open.contentStart);
      if (end !== -1) links.push(block.slice(open.contentStart, end));
    }
  }
  const guid = firstElement(block, "guid");
  if (guid !== null) links.push(guid);
  return links;
}

function parseDate(block: string): number | null {
  for (const name of ["pubDate", "published", "dc:date", "updated", "date"]) {
    const raw = firstElement(block, name);
    if (raw === null) continue;
    const time = Date.parse(toPlainText(raw));
    // Years before 2000 are an epoch default, not a publication date.
    if (Number.isFinite(time) && time >= Date.UTC(2000, 0, 1)) return time;
  }
  return null;
}

/** A link is kept only as https, without credentials, on an official domain. */
export function safeLink(
  raw: string,
  officialDomains: readonly string[],
): string | null {
  const text = toPlainText(raw);
  if (text.length === 0 || text.length > MAX_LINK_LENGTH) return null;
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password) return null;
  if (!isOnToolDomain(url.href, officialDomains)) return null;
  url.hash = "";
  return url.href;
}

/** Short, stable id from the link (FNV-1a), good enough for React keys. */
export function itemId(link: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < link.length; index += 1) {
    hash = Math.imul(hash ^ link.charCodeAt(index), 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

/** A summary that is only an address says nothing, so it is left empty. */
function summaryFrom(raw: string): string {
  const text = toPlainText(raw);
  return /^https?:\/\/\S+$/.test(text) ? "" : truncate(text, SUMMARY_LENGTH);
}

function readEntry(
  block: string,
  source: NewsSource,
  options: ParseOptions,
): NewsItem | null {
  const rawTitle = firstElement(block, "title");
  const title =
    rawTitle === null ? "" : truncate(toPlainText(rawTitle), TITLE_LENGTH);
  if (title.length === 0) return null;

  const published = parseDate(block);
  if (published === null || published > options.now) return null;
  if (options.now - published > MAX_AGE_MS) return null;

  let url: string | null = null;
  for (const candidate of candidateLinks(block)) {
    url = safeLink(candidate, source.officialDomains);
    if (url !== null) break;
  }
  if (url === null) return null;

  const rawSummary =
    firstElement(block, "description") ??
    firstElement(block, "summary") ??
    firstElement(block, "content:encoded") ??
    firstElement(block, "content") ??
    "";
  const summary = summaryFrom(rawSummary);

  return {
    id: itemId(url),
    title,
    url,
    publishedAt: new Date(published).toISOString(),
    sourceId: source.id,
    sourceName: source.name,
    summary,
    tag: tagItem({ title, summary, defaultTag: source.defaultTag }),
    toolIds: [...new Set([...source.toolIds, ...options.matchTools(title)])],
  };
}

/**
 * Items from one feed, newest first, or null when the text is not a feed at
 * all (an HTML error page, a login wall). An empty feed is an empty array.
 */
export function parseFeed(
  xml: string,
  source: NewsSource,
  options: ParseOptions,
): NewsItem[] | null {
  if (!/<(rss|feed|rdf:RDF)[\s>]/i.test(xml.slice(0, 20_000))) return null;

  const releases = isReleasesFeed(source.feedUrl);
  const tag = /<entry[\s>]/.test(xml) ? "entry" : "item";
  const items: NewsItem[] = [];
  for (const block of elementBlocks(xml, tag, MAX_ENTRIES_SCANNED)) {
    const item = readEntry(block, source, options);
    if (item === null) continue;
    if (releases && PRERELEASE.test(item.title)) continue;
    items.push(item);
  }
  items.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return items.slice(
    0,
    releases ? MAX_ITEMS_PER_RELEASES_FEED : MAX_ITEMS_PER_FEED,
  );
}
