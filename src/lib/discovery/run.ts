import {
  appendSnapshot,
  daysBetween,
  evaluateAdmission,
  isoDay,
  priority,
  type Admission,
} from "./admission.ts";
import { cleanCandidate, mergeCandidates, sameThing } from "./clean.ts";
import type { DiscoveryConfig, RejectedList } from "./config.ts";
import {
  closestTools,
  suggestJobs,
  type ClosestTool,
  type JobInfo,
  type ToolInfo,
} from "./jobs.ts";
import {
  findDuplicate,
  findRejected,
  findSimilar,
  type CatalogueIndex,
  type DuplicateReason,
} from "./match.ts";
import { decodeState, issueTitle, renderBody } from "./state.ts";
import { emptyWatchlist, isExpiredNow, statusOf } from "./watchlist.ts";
import {
  LABELS,
  SOURCE_NAMES,
  type Candidate,
  type CandidateState,
  type ExistingIssue,
  type HomepageCheck,
  type RawCandidate,
  type Signals,
  type SourceName,
  type WatchEntry,
  type Watchlist,
} from "./types.ts";

export interface RunContext {
  now: Date;
  config: DiscoveryConfig;
  rejected: RejectedList;
  index: CatalogueIndex;
  jobs: readonly JobInfo[];
  tools: readonly ToolInfo[];
  /** Individual candidate issues, open and closed. */
  issues: readonly ExistingIssue[];
  /** The stored watchlist, or null the first time. */
  watchlist: Watchlist | null;
  found: readonly RawCandidate[];
  checkHomepage: (url: string, today: string) => Promise<HomepageCheck>;
  /** Fresh signals for a tracked candidate the searches did not return. */
  lookup?: (state: CandidateState) => Promise<Signals | null>;
}

export interface PlannedIssue {
  title: string;
  body: string;
  labels: string[];
  state: CandidateState;
  admission: Admission;
  /** The watchlist entry it came from, to put back if creating the issue fails. */
  entry: WatchEntry;
}

export interface PlannedClose {
  number: number;
  title: string;
}

export interface SourceStats {
  /** Items kept by the source's own filters. */
  produced: number;
  invalid: number;
  duplicates: number;
  duplicateReasons: Partial<Record<DuplicateReason, number>>;
  rejected: number;
  /** Already has an issue, is on the expired list, or is on the watchlist. */
  alreadyKnown: number;
  /** Not seen before: what this source adds to the watchlist. */
  fresh: number;
}

export interface RunStats {
  bySource: Record<SourceName, SourceStats>;
  merged: number;
  tracked: number;
  newlyAdded: number;
  expired: number;
  /** Removed because the catalogue or the rejected list now covers them. */
  dropped: number;
  /** Removed for the size limit, lowest score first. */
  trimmed: number;
  refreshed: number;
  /** Tracked candidates that pass all five rules this run. */
  readyThisWeek: number;
  issuesCreated: number;
  readyDeferred: number;
  unreadableIssues: number;
}

export interface RunPlan {
  create: PlannedIssue[];
  close: PlannedClose[];
  /** The watchlist after this run, before the size limit is applied. */
  watchlist: Watchlist;
  statuses: Map<string, string>;
  stats: RunStats;
}

function emptySourceStats(): SourceStats {
  return {
    produced: 0,
    invalid: 0,
    duplicates: 0,
    duplicateReasons: {},
    rejected: 0,
    alreadyKnown: 0,
    fresh: 0,
  };
}

function latestSignals(state: CandidateState): Signals {
  return state.history[state.history.length - 1]?.signals ?? {};
}

const GROWTH_KEYS = [
  "githubStars",
  "hfLikes",
  "hfDownloads",
  "hnPoints",
] as const;

function grew(before: Signals, after: Signals): boolean {
  return GROWTH_KEYS.some((key) => (after[key] ?? 0) > (before[key] ?? 0));
}

type Identity = { id: string; keys: readonly string[] };

/**
 * The same candidate: they share an id or a key, and neither points at a
 * repository or site the other does not.
 */
function sharesKey(a: Identity, b: Identity): boolean {
  const shared = a.id === b.id || a.keys.some((key) => b.keys.includes(key));
  return shared && sameThing(a, b);
}

function newEntry(
  candidate: Candidate,
  jobIds: string[],
  today: string,
  config: DiscoveryConfig,
): WatchEntry {
  return {
    version: 1,
    id: candidate.id,
    name: candidate.name,
    description: candidate.description,
    homepage: candidate.homepage,
    repository: candidate.repository,
    announcement: candidate.announcement,
    maintainer: candidate.maintainer,
    kind: candidate.kind,
    keys: candidate.keys.slice(0, 3),
    sources: candidate.sources.slice(0, 3),
    topics: candidate.topics,
    jobs: jobIds,
    firstSeen: today,
    lastSeen: today,
    history: [{ date: today, signals: candidate.signals }],
    homepageCheck: null,
    score: priority(candidate.signals, candidate.sources.length, config),
    lastGrowth: today,
  };
}

/** The same candidate seen again: keep what is known, fill in what is new. */
function seenAgain(
  entry: WatchEntry,
  candidate: Candidate,
  today: string,
  config: DiscoveryConfig,
): WatchEntry {
  const before = latestSignals(entry);
  const signals = { ...before, ...candidate.signals };
  const sources = [...entry.sources];
  for (const link of candidate.sources) {
    const known = sources.some(
      (item) => item.source === link.source && item.url === link.url,
    );
    if (!known && sources.length < 3) sources.push(link);
  }
  return {
    ...entry,
    description:
      entry.description === "" ? candidate.description : entry.description,
    homepage: entry.homepage ?? candidate.homepage,
    repository: entry.repository ?? candidate.repository,
    announcement: entry.announcement ?? candidate.announcement,
    maintainer: entry.maintainer ?? candidate.maintainer,
    keys: [...new Set([...entry.keys, ...candidate.keys])].slice(0, 3),
    sources,
    lastSeen: today,
    history: appendSnapshot(entry.history, { date: today, signals }),
    lastGrowth: grew(before, signals) ? today : entry.lastGrowth,
    score: priority(signals, sources.length, config),
  };
}

function withFreshSignals(
  entry: WatchEntry,
  fresh: Signals,
  today: string,
  config: DiscoveryConfig,
): WatchEntry {
  const before = latestSignals(entry);
  const signals = { ...before, ...fresh };
  return {
    ...entry,
    lastSeen: today,
    history: appendSnapshot(entry.history, { date: today, signals }),
    lastGrowth: grew(before, signals) ? today : entry.lastGrowth,
    score: priority(signals, entry.sources.length, config),
  };
}

function addDays(day: string, days: number): string {
  return isoDay(new Date(Date.parse(day) + days * 86_400_000));
}

/**
 * Decides what a run would do, without doing it. The watchlist is updated in
 * memory; an issue is planned only for a candidate that passes all five
 * rules, at most `maxNewIssuesPerRun` of them, highest score first. Network
 * access goes through `checkHomepage` and `lookup`.
 */
export async function planRun(context: RunContext): Promise<RunPlan> {
  const { config, now, index } = context;
  const today = isoDay(now);
  const jobNames = new Map(context.jobs.map((job) => [job.id, job.name]));
  const stats: RunStats = {
    bySource: Object.fromEntries(
      SOURCE_NAMES.map((name) => [name, emptySourceStats()]),
    ) as Record<SourceName, SourceStats>,
    merged: 0,
    tracked: 0,
    newlyAdded: 0,
    expired: 0,
    dropped: 0,
    trimmed: 0,
    refreshed: 0,
    readyThisWeek: 0,
    issuesCreated: 0,
    readyDeferred: 0,
    unreadableIssues: 0,
  };

  const stored = context.watchlist ?? emptyWatchlist(today);
  let tracked: WatchEntry[] = [...stored.tracked];
  const expired = stored.expired.filter((entry) => isExpiredNow(entry, today));

  const issues: { issue: ExistingIssue; state: CandidateState }[] = [];
  for (const issue of context.issues) {
    const state = decodeState(issue.body);
    if (state === null) stats.unreadableIssues += 1;
    else issues.push({ issue, state });
  }
  const issued = (candidate: Identity) =>
    issues.some(({ state }) => sharesKey(state, candidate));
  const isExpired = (candidate: Identity) =>
    expired.some((entry) => sharesKey(entry, candidate));
  const trackedMatch = (candidate: Identity) =>
    tracked.find((entry) => sharesKey(entry, candidate));

  // 1. Clean what the sources returned and drop what is already covered.
  const usable: Candidate[] = [];
  for (const raw of context.found) {
    const counts = stats.bySource[raw.source];
    counts.produced += 1;
    const candidate = cleanCandidate(raw);
    if (candidate === null) {
      counts.invalid += 1;
      continue;
    }
    const duplicate = findDuplicate(candidate, index);
    if (duplicate !== null) {
      counts.duplicates += 1;
      counts.duplicateReasons[duplicate.reason] =
        (counts.duplicateReasons[duplicate.reason] ?? 0) + 1;
      continue;
    }
    if (findRejected(candidate, context.rejected) !== null) {
      counts.rejected += 1;
      continue;
    }
    if (issued(candidate) || isExpired(candidate)) {
      counts.alreadyKnown += 1;
      continue;
    }
    if (trackedMatch(candidate) !== undefined) counts.alreadyKnown += 1;
    else counts.fresh += 1;
    usable.push(candidate);
  }
  const merged = mergeCandidates(usable);
  stats.merged = merged.length;

  // 2. Fold them into the watchlist. The 30 day clock starts here.
  const seenIds = new Set<string>();
  for (const candidate of merged) {
    const known = trackedMatch(candidate);
    if (known === undefined) {
      const jobIds = suggestJobs(
        `${candidate.name} ${candidate.description} ${candidate.topics.join(" ")}`,
        context.jobs,
      );
      const entry = newEntry(candidate, jobIds, today, config);
      tracked.push(entry);
      seenIds.add(entry.id);
      stats.newlyAdded += 1;
    } else {
      const updated = seenAgain(known, candidate, today, config);
      tracked = tracked.map((entry) => (entry === known ? updated : entry));
      seenIds.add(updated.id);
    }
  }

  // 3. Refresh what the searches did not return.
  let lookups = 0;
  if (context.lookup !== undefined) {
    for (const [position, entry] of tracked.entries()) {
      if (seenIds.has(entry.id) || lookups >= config.maxRefreshLookups) {
        continue;
      }
      lookups += 1;
      const fresh = await context.lookup(entry).catch(() => null);
      if (fresh === null) continue;
      tracked[position] = withFreshSignals(entry, fresh, today, config);
      stats.refreshed += 1;
    }
  }

  // 4. Remove what the catalogue or the rejected list now covers, and what
  //    has not grown for too long.
  const kept: WatchEntry[] = [];
  for (const entry of tracked) {
    if (
      findDuplicate(entry, index) !== null ||
      findRejected(entry, context.rejected) !== null
    ) {
      stats.dropped += 1;
      continue;
    }
    if (
      daysBetween(entry.lastGrowth, today) >= config.watchlist.expireAfterDays
    ) {
      expired.push({
        id: entry.id,
        keys: entry.keys.slice(0, 2),
        until: addDays(today, config.watchlist.reAddAfterDays),
      });
      stats.expired += 1;
      continue;
    }
    kept.push(entry);
  }

  // 5. Apply the rules. The homepage is checked only when every other rule
  //    already passes.
  const statuses = new Map<string, string>();
  const ready: { entry: WatchEntry; admission: Admission }[] = [];
  for (const [position, original] of kept.entries()) {
    let entry = original;
    const evaluate = () =>
      evaluateAdmission({
        state: entry,
        firstSeen: entry.firstSeen,
        now,
        config,
        duplicate: null,
        rejectedReason: null,
      });
    let admission = evaluate();
    if (admission.needsHomepageCheck && entry.homepage !== null) {
      entry = {
        ...entry,
        homepageCheck: await context.checkHomepage(entry.homepage, today),
      };
      kept[position] = entry;
      admission = evaluate();
    }
    statuses.set(entry.id, statusOf(admission));
    if (admission.ready) ready.push({ entry, admission });
  }
  stats.readyThisWeek = ready.length;

  // 6. An issue of its own for the best ready candidates.
  ready.sort(
    (a, b) =>
      b.entry.score - a.entry.score || a.entry.name.localeCompare(b.entry.name),
  );
  const create: PlannedIssue[] = [];
  for (const { entry, admission } of ready.slice(
    0,
    config.maxNewIssuesPerRun,
  )) {
    const similar: ClosestTool[] = findSimilar(entry, index).map((tool) => ({
      id: tool.id,
      name: tool.name,
      sharedJobs: [],
      similarName: true,
    }));
    const closest = [
      ...similar,
      ...closestTools(entry.jobs, context.tools).filter(
        (tool) => !similar.some((item) => item.id === tool.id),
      ),
    ].slice(0, 6);
    const state: CandidateState = {
      version: 1,
      id: entry.id,
      name: entry.name,
      description: entry.description,
      homepage: entry.homepage,
      repository: entry.repository,
      announcement: entry.announcement,
      maintainer: entry.maintainer,
      kind: entry.kind,
      keys: entry.keys,
      sources: entry.sources,
      topics: entry.topics,
      jobs: entry.jobs,
      firstSeen: entry.firstSeen,
      lastSeen: entry.lastSeen,
      history: entry.history,
      homepageCheck: entry.homepageCheck,
    };
    create.push({
      title: issueTitle(state),
      body: renderBody(state, { admission, closest, jobNames }),
      labels: [LABELS.candidate, LABELS.ready],
      state,
      admission,
      entry,
    });
  }
  stats.issuesCreated = create.length;
  stats.readyDeferred = ready.length - create.length;
  const promoted = new Set(create.map((item) => item.entry.id));

  // 7. Individual issues the maintainer labelled "rejected" are closed.
  const close: PlannedClose[] = issues
    .filter(
      ({ issue }) =>
        issue.state === "open" && issue.labels.includes(LABELS.rejected),
    )
    .map(({ issue, state }) => ({
      number: issue.number,
      title: issueTitle(state),
    }));

  const remaining = kept
    .filter((entry) => !promoted.has(entry.id))
    .sort((a, b) => b.score - a.score)
    .slice(0, config.watchlist.maxTracked);
  stats.trimmed = kept.length - promoted.size - remaining.length;
  stats.tracked = remaining.length;

  return {
    create,
    close,
    watchlist: { version: 1, updated: today, tracked: remaining, expired },
    statuses,
    stats,
  };
}
