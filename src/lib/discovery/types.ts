/*
 * Plain types for tool discovery. Everything under src/lib/discovery runs
 * under Node without a build step (the weekly job and the import script), so
 * files here import only `.ts` siblings, packages and types.
 */

export const SOURCE_NAMES = [
  "github",
  "huggingface",
  "hackernews",
  "news",
] as const;
export type SourceName = (typeof SOURCE_NAMES)[number];

/** Numbers a source reported about a candidate. Missing means not reported. */
export interface Signals {
  githubStars?: number;
  hfLikes?: number;
  hfDownloads?: number;
  hnPoints?: number;
  /** An announcement on one of our official news feeds. */
  announced?: boolean;
}

export interface SourceLink {
  source: SourceName;
  url: string;
}

export type CandidateKind =
  "ai-tool" | "model" | "cli" | "extension" | "library";

/** What a source returned, before any cleaning. Text here is untrusted. */
export interface RawCandidate {
  source: SourceName;
  name: string;
  description: string;
  homepage: string | null;
  repository: string | null;
  /** An announcement page on an official domain, for news items. */
  announcement: string | null;
  maintainer: string | null;
  topics: string[];
  kindHint: CandidateKind | null;
  seenUrl: string;
  signals: Signals;
}

export interface Candidate {
  id: string;
  name: string;
  description: string;
  homepage: string | null;
  repository: string | null;
  announcement: string | null;
  maintainer: string | null;
  kind: CandidateKind;
  /** Identity keys: repository, site and name. Used to merge and to find issues. */
  keys: string[];
  sources: SourceLink[];
  signals: Signals;
  topics: string[];
}

export interface Snapshot {
  date: string;
  signals: Signals;
}

export interface HomepageCheck {
  date: string;
  /** HTTP status of the single request, or null when it failed. */
  status: number | null;
  ok: boolean;
  /** Host of a redirect target. Never followed. */
  redirectHost: string | null;
}

/** The machine-readable block stored in a candidate issue. */
export interface CandidateState {
  version: 1;
  id: string;
  name: string;
  description: string;
  homepage: string | null;
  repository: string | null;
  announcement: string | null;
  maintainer: string | null;
  kind: CandidateKind;
  keys: string[];
  sources: SourceLink[];
  topics: string[];
  jobs: string[];
  firstSeen: string;
  lastSeen: string;
  history: Snapshot[];
  homepageCheck: HomepageCheck | null;
}

/** A candidate on the watchlist: its state, a score and when it last grew. */
export interface WatchEntry extends CandidateState {
  score: number;
  /** The last day any usage number went up. Starts as the day it was added. */
  lastGrowth: string;
}

/** A candidate dropped for lack of growth, kept so it is not re-added. */
export interface ExpiredEntry {
  id: string;
  keys: string[];
  /** The first day it may be added again. */
  until: string;
}

export interface Watchlist {
  version: 1;
  updated: string;
  tracked: WatchEntry[];
  expired: ExpiredEntry[];
}

export interface ExistingIssue {
  number: number;
  state: "open" | "closed";
  labels: string[];
  createdAt: string;
  body: string;
  authorLogin: string;
}

export const LABELS = {
  candidate: "tool-candidate",
  ready: "ready-for-review",
  approved: "approved",
  rejected: "rejected",
  watchlist: "discovery-watchlist",
} as const;

/** The only account whose issues and comments are trusted as machine state. */
export const BOT_LOGIN = "github-actions[bot]";
