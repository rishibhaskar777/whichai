import {
  appendSnapshot,
  evaluateAdmission,
  isoDay,
  priority,
  type Admission,
} from "./admission.ts";
import { cleanCandidate, mergeCandidates } from "./clean.ts";
import type { DiscoveryConfig, RejectedList } from "./config.ts";
import {
  closestTools,
  suggestJobs,
  type JobInfo,
  type ToolInfo,
} from "./jobs.ts";
import {
  findDuplicate,
  findRejected,
  type CatalogueIndex,
  type DuplicateReason,
} from "./match.ts";
import { decodeState, issueTitle, renderBody } from "./state.ts";
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
} from "./types.ts";

export interface RunContext {
  now: Date;
  config: DiscoveryConfig;
  rejected: RejectedList;
  index: CatalogueIndex;
  jobs: readonly JobInfo[];
  tools: readonly ToolInfo[];
  existing: readonly ExistingIssue[];
  found: readonly RawCandidate[];
  checkHomepage: (url: string, today: string) => Promise<HomepageCheck>;
  /** Fresh signals for a candidate not seen in this run's searches. */
  lookup?: (state: CandidateState) => Promise<Signals | null>;
}

export interface PlannedIssue {
  title: string;
  body: string;
  labels: string[];
  state: CandidateState;
  admission: Admission;
}

export interface PlannedUpdate {
  number: number;
  title: string;
  /** Null when the body is unchanged. */
  body: string | null;
  labels: string[] | null;
  close: boolean;
  becameReady: boolean;
  admission: Admission | null;
}

export interface SourceStats {
  produced: number;
  invalid: number;
  duplicates: number;
  duplicateReasons: Partial<Record<DuplicateReason, number>>;
  rejected: number;
}

export interface RunStats {
  bySource: Record<SourceName, SourceStats>;
  merged: number;
  alreadyKnownClosed: number;
  matchedOpen: number;
  newCandidates: number;
  createdNow: number;
  deferred: number;
  refreshed: number;
  unreadableIssues: number;
  readyNow: number;
}

export interface RunPlan {
  create: PlannedIssue[];
  update: PlannedUpdate[];
  stats: RunStats;
}

const SKIP_LABELS: readonly string[] = [LABELS.approved];

function emptySourceStats(): SourceStats {
  return {
    produced: 0,
    invalid: 0,
    duplicates: 0,
    duplicateReasons: {},
    rejected: 0,
  };
}

function jobNamesOf(jobs: readonly JobInfo[]): Map<string, string> {
  return new Map(jobs.map((job) => [job.id, job.name]));
}

function newState(
  candidate: Candidate,
  jobIds: string[],
  today: string,
): CandidateState {
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
    keys: candidate.keys.slice(0, 8),
    sources: candidate.sources,
    topics: candidate.topics,
    jobs: jobIds,
    firstSeen: today,
    lastSeen: today,
    history: [{ date: today, signals: candidate.signals }],
    homepageCheck: null,
  };
}

/** The same candidate seen again: keep what is known, fill in what is new. */
function refreshState(
  state: CandidateState,
  candidate: Candidate,
  today: string,
): CandidateState {
  const previous = state.history[state.history.length - 1]?.signals ?? {};
  const signals = { ...previous, ...candidate.signals };
  const sources = [...state.sources];
  for (const link of candidate.sources) {
    const known = sources.some(
      (entry) => entry.source === link.source && entry.url === link.url,
    );
    if (!known && sources.length < 6) sources.push(link);
  }
  return {
    ...state,
    description:
      state.description === "" ? candidate.description : state.description,
    homepage: state.homepage ?? candidate.homepage,
    repository: state.repository ?? candidate.repository,
    announcement: state.announcement ?? candidate.announcement,
    maintainer: state.maintainer ?? candidate.maintainer,
    keys: [...new Set([...state.keys, ...candidate.keys])].slice(0, 8),
    sources,
    lastSeen: today,
    history: appendSnapshot(state.history, { date: today, signals }),
  };
}

function withSignals(state: CandidateState, fresh: Signals, today: string) {
  const previous = state.history[state.history.length - 1]?.signals ?? {};
  return {
    ...state,
    lastSeen: today,
    history: appendSnapshot(state.history, {
      date: today,
      signals: { ...previous, ...fresh },
    }),
  };
}

/**
 * Decides what a run would do, without doing it. Network access goes through
 * `checkHomepage` and `lookup`; creating and editing issues is the caller's.
 */
export async function planRun(context: RunContext): Promise<RunPlan> {
  const { config, now, index } = context;
  const today = isoDay(now);
  const jobNames = jobNamesOf(context.jobs);
  const stats: RunStats = {
    bySource: Object.fromEntries(
      SOURCE_NAMES.map((name) => [name, emptySourceStats()]),
    ) as Record<SourceName, SourceStats>,
    merged: 0,
    alreadyKnownClosed: 0,
    matchedOpen: 0,
    newCandidates: 0,
    createdNow: 0,
    deferred: 0,
    refreshed: 0,
    unreadableIssues: 0,
    readyNow: 0,
  };

  // 1. Clean, then drop what the catalogue or the rejected list already covers.
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
    usable.push(candidate);
  }
  const merged = mergeCandidates(usable);
  stats.merged = merged.length;

  // 2. Existing issues are the state. Closed ones are never touched.
  const issues: { issue: ExistingIssue; state: CandidateState }[] = [];
  for (const issue of context.existing) {
    const state = decodeState(issue.body);
    if (state === null) stats.unreadableIssues += 1;
    else issues.push({ issue, state });
  }
  const findIssue = (candidate: Candidate) =>
    issues.find(
      ({ state }) =>
        state.id === candidate.id ||
        state.keys.some((key) => candidate.keys.includes(key)),
    );

  const seenNow = new Map<number, Candidate>();
  const fresh: Candidate[] = [];
  for (const candidate of merged) {
    const hit = findIssue(candidate);
    if (hit === undefined) fresh.push(candidate);
    else if (hit.issue.state === "closed") stats.alreadyKnownClosed += 1;
    else seenNow.set(hit.issue.number, candidate);
  }
  stats.matchedOpen = seenNow.size;
  stats.newCandidates = fresh.length;

  // 3. New issues, strongest first, at most the per-run limit.
  fresh.sort(
    (a, b) =>
      priority(b.signals, b.sources.length, config) -
        priority(a.signals, a.sources.length, config) ||
      a.name.localeCompare(b.name),
  );
  const create: PlannedIssue[] = [];
  for (const candidate of fresh.slice(0, config.maxNewIssuesPerRun)) {
    const jobIds = suggestJobs(
      `${candidate.name} ${candidate.description} ${candidate.topics.join(" ")}`,
      context.jobs,
    );
    const state = newState(candidate, jobIds, today);
    const admission = evaluateAdmission({
      state,
      firstSeen: today,
      now,
      config,
      duplicate: null,
      rejectedReason: null,
    });
    create.push({
      title: issueTitle(state),
      body: renderBody(state, {
        admission,
        closest: closestTools(jobIds, context.tools),
        jobNames,
      }),
      labels: [LABELS.candidate],
      state,
      admission,
    });
  }
  stats.createdNow = create.length;
  stats.deferred = fresh.length - create.length;

  // 4. Open candidates: refresh signals, apply the rules, edit the body.
  const update: PlannedUpdate[] = [];
  let lookups = 0;
  for (const { issue, state: stored } of issues) {
    if (issue.state !== "open") continue;
    if (issue.labels.some((label) => SKIP_LABELS.includes(label))) continue;
    if (issue.labels.includes(LABELS.rejected)) {
      update.push({
        number: issue.number,
        title: issueTitle(stored),
        body: null,
        labels: null,
        close: true,
        becameReady: false,
        admission: null,
      });
      continue;
    }

    let state = stored;
    const candidate = seenNow.get(issue.number);
    if (candidate !== undefined) {
      state = refreshState(stored, candidate, today);
    } else if (
      context.lookup !== undefined &&
      lookups < config.maxRefreshLookups
    ) {
      lookups += 1;
      const signals = await context.lookup(stored).catch(() => null);
      if (signals !== null) {
        state = withSignals(stored, signals, today);
        stats.refreshed += 1;
      }
    }

    const duplicate = findDuplicate(state, index);
    const rejectedReason = findRejected(state, context.rejected);
    const evaluate = () =>
      evaluateAdmission({
        state,
        firstSeen: isoDay(new Date(issue.createdAt)),
        now,
        config,
        duplicate,
        rejectedReason,
      });
    let admission = evaluate();
    if (admission.needsHomepageCheck && state.homepage !== null) {
      state = {
        ...state,
        homepageCheck: await context.checkHomepage(state.homepage, today),
      };
      admission = evaluate();
    }

    const jobIds = state.jobs;
    const body = renderBody(state, {
      admission,
      closest: closestTools(jobIds, context.tools),
      jobNames,
    });
    const hadReady = issue.labels.includes(LABELS.ready);
    const labels =
      admission.ready === hadReady
        ? null
        : admission.ready
          ? [...issue.labels, LABELS.ready]
          : issue.labels.filter((label) => label !== LABELS.ready);
    if (admission.ready) stats.readyNow += 1;
    update.push({
      number: issue.number,
      title: issueTitle(state),
      body: body === issue.body ? null : body,
      labels,
      close: false,
      becameReady: admission.ready && !hadReady,
      admission,
    });
  }

  return { create, update, stats };
}
