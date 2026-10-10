import { XMLParser } from "fast-xml-parser";
import { isOnToolDomain } from "../catalogue/links.ts";
import { tagItem } from "./tagging.ts";
import { toPlainText, truncate } from "./text.ts";
import type { ToolMatcher } from "./tool-match.ts";
import type { NewsItem, NewsSource } from "./types.ts";

/*
 * Reads RSS 2.0, RSS 1.0 and Atom with fast-xml-parser, configured so that
 * nothing in the document can cause work or reach outside it. See
 * docs/decisions/0012-news-from-official-feeds.md.
 */

export const SUMMARY_LENGTH = 160;
export const TITLE_LENGTH = 200;
export const MAX_AGE_MS = 60 * 24 * 60 * 60 * 1000;
/** The fetcher stops at 1 MB; the parser enforces the same limit again. */
export const MAX_FEED_CHARS = 1_000_000;
const MAX_ITEMS_PER_FEED = 30;
const MAX_ITEMS_PER_RELEASES_FEED = 5;
const MAX_LINK_LENGTH = 600;
const MAX_ENTRIES_SCANNED = 2000;

const PRERELEASE =
  /\b(alpha|beta|rc\d*|canary|nightly|pre-?release|preview|dev)\b/i;

/*
 * Entities are left alone by the parser (`processEntities: false`) and
 * decoded afterwards by `toPlainText`, which knows only the five XML
 * entities, numeric references and a short list of HTML names, and never
 * reads a declaration. DOCTYPE blocks are removed before parsing, so no
 * internal or external entity can be declared. Values stay strings, and
 * CDATA is kept apart so that escaped and raw markup can be told apart.
 */
const parser = new XMLParser({
  processEntities: false,
  htmlEntities: false,
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  cdataPropName: "#cdata",
  parseTagValue: false,
  parseAttributeValue: false,
  ignoreDeclaration: true,
  ignorePiTags: true,
  maxNestedTags: 40,
  isArray: (name) => name === "item" || name === "entry" || name === "link",
});

export interface ParseOptions {
  /** Milliseconds since the epoch; items dated after it are dropped. */
  now: number;
  matchTools: ToolMatcher;
  /** Oldest item kept. Defaults to 60 days; the source check widens it. */
  maxAgeMs?: number;
}

export function isReleasesFeed(feedUrl: string): boolean {
  return feedUrl.endsWith("/releases.atom");
}

type Node = unknown;
type Element = Record<string, Node>;

function isElement(node: Node): node is Element {
  return typeof node === "object" && node !== null && !Array.isArray(node);
}

function rank(key: string): number {
  return key === "#text" ? 0 : key === "#cdata" ? 1 : 2;
}

/**
 * The element's text as it would appear between its tags: escaped text, with
 * CDATA put back in its wrapper, ready for `toPlainText`. Elements nested
 * inside (an unescaped <b> in a description) contribute their text too.
 */
function rawText(node: Node, depth = 0): string | null {
  const value = Array.isArray(node) ? node[0] : node;
  if (typeof value === "string") return value;
  if (!isElement(value) || depth > 4) return null;
  const parts: string[] = [];
  // Own text first, then CDATA, then nested elements.
  const ordered = Object.entries(value).sort(([a], [b]) => rank(a) - rank(b));
  for (const [key, child] of ordered) {
    if (key.startsWith("@_")) continue;
    if (key === "#cdata") {
      for (const piece of Array.isArray(child) ? child : [child]) {
        if (typeof piece === "string") parts.push(`<![CDATA[${piece}]]>`);
      }
      continue;
    }
    const text = rawText(child, depth + 1);
    if (text !== null) parts.push(text);
  }
  return parts.length > 0 ? parts.join(" ") : null;
}

function field(entry: Element, name: string): string | null {
  return rawText(entry[name]);
}

/** Removes the document type declaration, with its internal subset. */
function stripDoctype(xml: string): string {
  const start = xml.indexOf("<!DOCTYPE");
  if (start === -1) return xml;
  const close = xml.indexOf(">", start);
  if (close === -1) return xml.slice(0, start);
  const bracket = xml.indexOf("[", start);
  const subsetEnd = xml.indexOf("]>", start);
  const end =
    bracket !== -1 && bracket < close && subsetEnd !== -1
      ? subsetEnd + 2
      : close + 1;
  return xml.slice(0, start) + xml.slice(end);
}

function rootOf(parsed: Element): Element | null {
  for (const name of ["rss", "feed", "rdf:RDF"]) {
    const root = parsed[name];
    if (isElement(root)) return root;
    // An empty root element parses to an empty string.
    if (root === "") return {};
  }
  return null;
}

function entriesOf(root: Element): Element[] {
  const channel = root["channel"];
  const container = isElement(channel) ? channel : root;
  const list = container["item"] ?? container["entry"] ?? root["item"];
  return (Array.isArray(list) ? list : []).filter(isElement);
}

function parseXml(xml: string): Element | null {
  try {
    const parsed: unknown = parser.parse(xml);
    return isElement(parsed) && rootOf(parsed) !== null ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * A feed cut off by the size limit, or damaged near its end, is repaired by
 * dropping everything after the last complete entry and closing the
 * document. The entries before it are intact.
 */
function parseWithRepair(xml: string): Element | null {
  const parsed = parseXml(xml);
  if (parsed !== null) return parsed;
  const lastItem = xml.lastIndexOf("</item>");
  const lastEntry = xml.lastIndexOf("</entry>");
  if (lastItem === -1 && lastEntry === -1) return null;
  const atom = lastEntry > lastItem;
  const end = atom
    ? lastEntry + "</entry>".length
    : lastItem + "</item>".length;
  return parseXml(xml.slice(0, end) + (atom ? "</feed>" : "</channel></rss>"));
}

function candidateLinks(entry: Element): string[] {
  const links: string[] = [];
  const declared = entry["link"];
  for (const link of Array.isArray(declared) ? declared : []) {
    if (typeof link === "string") {
      links.push(link);
    } else if (isElement(link)) {
      const href = link["@_href"];
      const rel = link["@_rel"];
      if (typeof href === "string") {
        if (rel === undefined || rel === "alternate") links.push(href);
      } else {
        const text = rawText(link);
        if (text !== null) links.push(text);
      }
    }
  }
  const guid = field(entry, "guid");
  if (guid !== null) links.push(guid);
  return links;
}

function parseDate(entry: Element): number | null {
  for (const name of ["pubDate", "published", "dc:date", "updated", "date"]) {
    const raw = field(entry, name);
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
  entry: Element,
  source: NewsSource,
  options: ParseOptions,
): NewsItem | null {
  const rawTitle = field(entry, "title");
  const title =
    rawTitle === null ? "" : truncate(toPlainText(rawTitle), TITLE_LENGTH);
  if (title.length === 0) return null;

  const published = parseDate(entry);
  if (published === null || published > options.now) return null;
  if (options.now - published > (options.maxAgeMs ?? MAX_AGE_MS)) return null;

  let url: string | null = null;
  for (const candidate of candidateLinks(entry)) {
    url = safeLink(candidate, source.officialDomains);
    if (url !== null) break;
  }
  if (url === null) return null;

  const summary = summaryFrom(
    field(entry, "description") ??
      field(entry, "summary") ??
      field(entry, "content:encoded") ??
      field(entry, "content") ??
      "",
  );

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
  const text = stripDoctype(xml.slice(0, MAX_FEED_CHARS));
  if (!/<(rss|feed|rdf:RDF)[\s>]/i.test(text.slice(0, 20_000))) return null;

  const parsed = parseWithRepair(text);
  const root = parsed === null ? null : rootOf(parsed);
  if (root === null) return null;

  const releases = isReleasesFeed(source.feedUrl);
  const items: NewsItem[] = [];
  for (const entry of entriesOf(root).slice(0, MAX_ENTRIES_SCANNED)) {
    const item = readEntry(entry, source, options);
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
