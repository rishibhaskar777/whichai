import { readBlock, writeBlock } from "./hidden-block.ts";
import { z } from "zod";
import type { Admission } from "./admission.ts";
import { starGrowth } from "./admission.ts";
import type { DiscoveryConfig } from "./config.ts";
import { codeSpan, safeHttpsUrl } from "./sanitize.ts";
import {
  SOURCE_NAMES,
  type ExpiredEntry,
  type Signals,
  type Snapshot,
  type WatchEntry,
  type Watchlist,
} from "./types.ts";

/*
 * The watchlist is one issue. Its visible part is a short table; its hidden
 * part is an HTML comment holding every tracked candidate in a compact form.
 * Short keys and trimmed text keep it far below GitHub's body limit, and
 * `fitWatchlist` removes the lowest scores if it ever is not.
 */

const MARKER = "whichai-watchlist";
const MAX_DESCRIPTION = 160;
const MAX_HISTORY = 6;

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(70);
const url = z
  .string()
  .max(300)
  .nullable()
  .transform((value) => (value === null ? null : safeHttpsUrl(value)));
const nullableCount = z.number().int().min(0).max(1_000_000_000).nullable();

const entrySchema = z.strictObject({
  i: slug,
  n: z.string().min(1).max(60),
  d: z.string().max(MAX_DESCRIPTION),
  h: url,
  r: url,
  a: url,
  m: z.string().max(60).nullable(),
  k: z.enum(["ai-tool", "model", "cli", "extension", "library"]),
  q: z.array(z.string().max(120)).max(3),
  s: z
    .array(
      z.tuple([
        z.enum(SOURCE_NAMES),
        z.string().max(300).transform(safeHttpsUrl).pipe(z.string()),
      ]),
    )
    .max(3),
  j: z
    .array(
      z
        .string()
        .regex(/^[a-z0-9-]+$/)
        .max(60),
    )
    .max(3),
  f: day,
  l: day,
  g: day,
  p: z.number().min(0).max(10_000),
  c: z
    .tuple([
      day,
      z.number().int().min(100).max(599).nullable(),
      z.boolean(),
      z.string().max(100).nullable(),
    ])
    .nullable(),
  /** [date, stars, likes, downloads, points, announced] */
  y: z
    .array(
      z.tuple([
        day,
        nullableCount,
        nullableCount,
        nullableCount,
        nullableCount,
        z.boolean(),
      ]),
    )
    .max(MAX_HISTORY),
});

const expiredSchema = z.strictObject({
  i: slug,
  q: z.array(z.string().max(120)).max(2),
  u: day,
});

const watchlistSchema = z.strictObject({
  v: z.literal(1),
  u: day,
  t: z.array(entrySchema).max(300),
  x: z.array(expiredSchema).max(1000),
});

type CompactEntry = z.infer<typeof entrySchema>;

function compactSnapshot(snapshot: Snapshot): CompactEntry["y"][number] {
  const s = snapshot.signals;
  return [
    snapshot.date,
    s.githubStars ?? null,
    s.hfLikes ?? null,
    s.hfDownloads ?? null,
    s.hnPoints ?? null,
    s.announced === true,
  ];
}

function expandSnapshot(row: CompactEntry["y"][number]): Snapshot {
  const signals: Signals = {};
  if (row[1] !== null) signals.githubStars = row[1];
  if (row[2] !== null) signals.hfLikes = row[2];
  if (row[3] !== null) signals.hfDownloads = row[3];
  if (row[4] !== null) signals.hnPoints = row[4];
  if (row[5]) signals.announced = true;
  return { date: row[0], signals };
}

function compact(entry: WatchEntry): CompactEntry {
  const check = entry.homepageCheck;
  return {
    i: entry.id,
    n: entry.name,
    d: entry.description.slice(0, MAX_DESCRIPTION),
    h: entry.homepage,
    r: entry.repository,
    a: entry.announcement,
    m: entry.maintainer,
    k: entry.kind,
    q: entry.keys.slice(0, 3),
    s: entry.sources.slice(0, 3).map((link) => [link.source, link.url]),
    j: entry.jobs.slice(0, 3),
    f: entry.firstSeen,
    l: entry.lastSeen,
    g: entry.lastGrowth,
    p: Math.round(entry.score * 100) / 100,
    c:
      check === null
        ? null
        : [check.date, check.status, check.ok, check.redirectHost],
    y: entry.history.slice(-MAX_HISTORY).map(compactSnapshot),
  };
}

function expand(row: CompactEntry): WatchEntry {
  return {
    version: 1,
    id: row.i,
    name: row.n,
    description: row.d,
    homepage: row.h,
    repository: row.r,
    announcement: row.a,
    maintainer: row.m,
    kind: row.k,
    keys: row.q,
    sources: row.s.map(([source, link]) => ({ source, url: link })),
    topics: [],
    jobs: row.j,
    firstSeen: row.f,
    lastSeen: row.l,
    history: row.y.map(expandSnapshot),
    homepageCheck:
      row.c === null
        ? null
        : {
            date: row.c[0],
            status: row.c[1],
            ok: row.c[2],
            redirectHost: row.c[3],
          },
    score: row.p,
    lastGrowth: row.g,
  };
}

export function emptyWatchlist(today: string): Watchlist {
  return { version: 1, updated: today, tracked: [], expired: [] };
}

/** The hidden block. `<`, `>` and `--` are escaped so it cannot end early. */
export function encodeWatchlist(watchlist: Watchlist): string {
  const json = JSON.stringify({
    v: 1,
    u: watchlist.updated,
    t: watchlist.tracked.map(compact),
    x: watchlist.expired.map((entry) => ({
      i: entry.id,
      q: entry.keys.slice(0, 2),
      u: entry.until,
    })),
  });
  return writeBlock(MARKER, json);
}

/** The last block in a body, validated again. Null when it cannot be read. */
export function decodeWatchlist(body: string): Watchlist | null {
  const json = readBlock(body, MARKER);
  if (json === null) return null;
  try {
    const parsed = watchlistSchema.safeParse(JSON.parse(json));
    if (!parsed.success) return null;
    return {
      version: 1,
      updated: parsed.data.u,
      tracked: parsed.data.t.map(expand),
      expired: parsed.data.x.map((row) => ({
        id: row.i,
        keys: row.q,
        until: row.u,
      })),
    };
  } catch {
    return null;
  }
}

/** A short reason a candidate is not ready, or "ready". */
export function statusOf(admission: Admission): string {
  if (admission.ready) return "ready";
  const failed = admission.rules.find((rule) => !rule.passed);
  if (failed === undefined) return "ready";
  switch (failed.rule) {
    case 1:
      return "needs a site and a maker";
    case 2:
      return "too new";
    case 3:
      return "needs more usage";
    case 4:
      return "in the catalogue";
    default:
      return "rejected";
  }
}

const numbers = new Intl.NumberFormat("en-US");

function signalText(entry: WatchEntry): string {
  const latest = entry.history[entry.history.length - 1]?.signals ?? {};
  const growth = starGrowth(entry.history);
  const parts: string[] = [];
  if (latest.githubStars !== undefined) {
    const rise =
      growth === null
        ? ""
        : ` (${growth >= 0 ? "+" : ""}${numbers.format(growth)}/30d)`;
    parts.push(`${numbers.format(latest.githubStars)} stars${rise}`);
  }
  if (latest.hfLikes !== undefined) {
    parts.push(`${numbers.format(latest.hfLikes)} likes`);
  }
  if (latest.hfDownloads !== undefined) {
    parts.push(`${numbers.format(latest.hfDownloads)} downloads`);
  }
  if (latest.hnPoints !== undefined) {
    parts.push(`${numbers.format(latest.hnPoints)} HN points`);
  }
  if (latest.announced === true) parts.push("announced");
  return parts.join(", ") || "none";
}

export interface WatchlistView {
  config: DiscoveryConfig;
  today: string;
  /** Short status per candidate id, from the admission rules. */
  statuses: ReadonlyMap<string, string>;
  /** Counts for this run, shown above the table. */
  counts: { added: number; expired: number; ready: number; promoted: number };
}

function visiblePart(watchlist: Watchlist, view: WatchlistView): string {
  const top = [...watchlist.tracked]
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, view.config.watchlist.summaryRows);
  const rows = top.map((entry, rank) => {
    const days = Math.max(
      0,
      Math.floor(
        (Date.parse(view.today) - Date.parse(entry.firstSeen)) / 86_400_000,
      ),
    );
    return `| ${rank + 1} | ${codeSpan(entry.name)} | ${entry.score.toFixed(1)} | ${days} | ${signalText(entry)} | ${view.statuses.get(entry.id) ?? ""} |`;
  });
  return [
    "Candidate tools the weekly discovery job is following. This issue is edited in place each run; it is never commented on. An issue of its own is opened for a candidate only when it passes all five admission rules.",
    "",
    `Updated ${view.today}. Tracking ${watchlist.tracked.length}, ${watchlist.expired.length} on the expired list. This run: ${view.counts.added} added, ${view.counts.expired} expired, ${view.counts.ready} ready, ${view.counts.promoted} given an issue.`,
    "",
    `### Top ${top.length} by score`,
    "",
    "| # | Name | Score | Days | Signals | Status |",
    "| --- | --- | --- | --- | --- | --- |",
    ...(rows.length > 0 ? rows : ["| | none yet | | | | |"]),
    "",
    "Names and numbers come from the open internet and are shown as code. Rules and review steps: `docs/TOOL-DISCOVERY.md`.",
    "",
  ].join("\n");
}

export interface RenderedWatchlist {
  body: string;
  /** The watchlist as stored, after any trimming to fit the size limit. */
  watchlist: Watchlist;
  /** How many tracked candidates were dropped to fit. */
  trimmed: number;
}

/**
 * The issue body, with the lowest-scoring candidates (then the oldest expired
 * ones) removed until it fits `maxBodyChars`.
 */
export function fitWatchlist(
  watchlist: Watchlist,
  view: WatchlistView,
): RenderedWatchlist {
  const limit = view.config.watchlist.maxBodyChars;
  let tracked = [...watchlist.tracked].sort((a, b) => b.score - a.score);
  let expired = [...watchlist.expired].sort((a, b) =>
    b.until.localeCompare(a.until),
  );
  let trimmed = 0;
  for (;;) {
    const current: Watchlist = { ...watchlist, tracked, expired };
    const body = `${visiblePart(current, view)}${encodeWatchlist(current)}`;
    if (body.length <= limit) return { body, watchlist: current, trimmed };
    if (tracked.length > 0) {
      tracked = tracked.slice(0, -1);
      trimmed += 1;
    } else if (expired.length > 0) {
      expired = expired.slice(0, -1);
    } else {
      return { body, watchlist: current, trimmed };
    }
  }
}

export function isExpiredNow(entry: ExpiredEntry, today: string): boolean {
  return entry.until > today;
}
