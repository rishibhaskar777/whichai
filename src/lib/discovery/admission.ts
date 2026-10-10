import type { DiscoveryConfig } from "./config.ts";
import type { Duplicate } from "./match.ts";
import type { CandidateState, Signals, Snapshot } from "./types.ts";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_HISTORY = 16;
/** A growth figure needs a baseline at least this old. */
const MIN_GROWTH_SPAN_DAYS = 14;
const GROWTH_WINDOW_DAYS = 30;

export function daysBetween(from: string, to: string): number {
  return Math.floor((Date.parse(to) - Date.parse(from)) / DAY_MS);
}

export function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Keeps the largest value seen for each number, so a source cannot lower one. */
export function mergeSignals(a: Signals, b: Signals): Signals {
  const merged: Signals = { ...a };
  for (const key of [
    "githubStars",
    "hfLikes",
    "hfDownloads",
    "hnPoints",
  ] as const) {
    const value = b[key];
    if (value !== undefined) merged[key] = Math.max(merged[key] ?? 0, value);
  }
  if (a.announced === true || b.announced === true) merged.announced = true;
  return merged;
}

/** One snapshot per day, oldest first, at most 16. */
export function appendSnapshot(
  history: readonly Snapshot[],
  snapshot: Snapshot,
): Snapshot[] {
  const rest = history.filter((entry) => entry.date !== snapshot.date);
  return [...rest, snapshot]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-MAX_HISTORY);
}

/**
 * Stars gained per 30 days, from the snapshot closest to 30 days before the
 * latest one (and at least 14 days before it). Null without such a snapshot.
 */
export function starGrowth(history: readonly Snapshot[]): number | null {
  const latest = history[history.length - 1];
  if (latest?.signals.githubStars === undefined) return null;
  let best: { days: number; stars: number } | null = null;
  for (const entry of history.slice(0, -1)) {
    const stars = entry.signals.githubStars;
    if (stars === undefined) continue;
    const days = daysBetween(entry.date, latest.date);
    if (days < MIN_GROWTH_SPAN_DAYS) continue;
    const closer =
      best === null ||
      Math.abs(days - GROWTH_WINDOW_DAYS) <
        Math.abs(best.days - GROWTH_WINDOW_DAYS);
    if (closer) best = { days, stars };
  }
  if (best === null) return null;
  const gained = latest.signals.githubStars - best.stars;
  return Math.round((gained * GROWTH_WINDOW_DAYS) / best.days);
}

export type SignalLevel = "strong" | "moderate" | "none";

export interface SignalFamily {
  family: string;
  level: SignalLevel;
  detail: string;
}

function level(
  value: number | null | undefined,
  moderate: number,
  strong: number,
): SignalLevel {
  if (value === null || value === undefined) return "none";
  if (value >= strong) return "strong";
  return value >= moderate ? "moderate" : "none";
}

function best(...levels: SignalLevel[]): SignalLevel {
  if (levels.includes("strong")) return "strong";
  return levels.includes("moderate") ? "moderate" : "none";
}

const numbers = new Intl.NumberFormat("en-US");

/**
 * The usage signals in the latest snapshot, grouped by where they came from.
 * Stars and star growth are one family, as are likes and downloads, because
 * each pair describes the same audience. A family counts once.
 */
export function signalFamilies(
  state: Pick<CandidateState, "history" | "sources">,
  config: DiscoveryConfig,
): SignalFamily[] {
  const latest = state.history[state.history.length - 1]?.signals ?? {};
  const growth = starGrowth([...state.history]);
  const { moderate, strong } = config;
  const families: SignalFamily[] = [];

  if (latest.githubStars !== undefined) {
    families.push({
      family: "GitHub",
      level: best(
        level(latest.githubStars, moderate.githubStars, strong.githubStars),
        level(growth, moderate.githubStarGrowth, strong.githubStarGrowth),
      ),
      detail:
        `${numbers.format(latest.githubStars)} stars` +
        (growth === null
          ? ""
          : `, ${growth >= 0 ? "+" : ""}${numbers.format(growth)} per 30 days`),
    });
  }
  if (latest.hfLikes !== undefined || latest.hfDownloads !== undefined) {
    families.push({
      family: "Hugging Face",
      level: best(
        level(latest.hfLikes, moderate.hfLikes, strong.hfLikes),
        level(latest.hfDownloads, moderate.hfDownloads, strong.hfDownloads),
      ),
      detail: `${numbers.format(latest.hfLikes ?? 0)} likes, ${numbers.format(latest.hfDownloads ?? 0)} downloads`,
    });
  }
  if (latest.hnPoints !== undefined) {
    families.push({
      family: "Hacker News",
      level: level(latest.hnPoints, moderate.hnPoints, strong.hnPoints),
      detail: `${numbers.format(latest.hnPoints)} points`,
    });
  }
  if (latest.announced === true) {
    families.push({
      family: "Official news feed",
      level: "strong",
      detail: "announced on one of our official feeds",
    });
  }
  const independent = new Set(state.sources.map((link) => link.source)).size;
  if (independent >= 2) {
    families.push({
      family: "Mentions",
      level: independent >= moderate.independentSources ? "moderate" : "none",
      detail: `seen in ${independent} independent sources`,
    });
  }
  return families;
}

export interface RuleResult {
  rule: 1 | 2 | 3 | 4 | 5;
  title: string;
  passed: boolean;
  detail: string;
}

export interface Admission {
  ready: boolean;
  rules: RuleResult[];
  families: SignalFamily[];
  /** Only the homepage check is missing from rule 1. */
  needsHomepageCheck: boolean;
}

export interface AdmissionInput {
  state: CandidateState;
  /** The issue's creation date, which is the first-seen date. */
  firstSeen: string;
  now: Date;
  config: DiscoveryConfig;
  duplicate: Duplicate | null;
  rejectedReason: string | null;
}

function rule1(state: CandidateState): RuleResult & { pending: boolean } {
  const title = "Official website or repository, and someone behind it";
  const hasPlace =
    state.homepage !== null ||
    state.repository !== null ||
    state.announcement !== null;
  if (!hasPlace) {
    return {
      rule: 1,
      title,
      passed: false,
      detail: "no https site or repository",
      pending: false,
    };
  }
  if (state.maintainer === null) {
    return {
      rule: 1,
      title,
      passed: false,
      detail: "no maker named",
      pending: false,
    };
  }
  const check = state.homepageCheck;
  if (state.homepage !== null) {
    if (check === null) {
      return {
        rule: 1,
        title,
        passed: false,
        detail: "homepage not checked yet",
        pending: true,
      };
    }
    if (!check.ok) {
      const status =
        check.status === null ? "no answer" : `HTTP ${check.status}`;
      return {
        rule: 1,
        title,
        passed: false,
        detail: `homepage check failed (${status})`,
        pending: false,
      };
    }
  }
  return {
    rule: 1,
    title,
    passed: true,
    detail: "found; confirm by hand",
    pending: false,
  };
}

/** Applies the five admission rules. Nothing here compares quality. */
export function evaluateAdmission(input: AdmissionInput): Admission {
  const { state, config, now } = input;
  const today = isoDay(now);
  const first = rule1(state);

  const age = daysBetween(input.firstSeen, today);
  const second: RuleResult = {
    rule: 2,
    title: `First seen at least ${config.minAgeDays} days ago`,
    passed: age >= config.minAgeDays,
    detail: `first seen ${input.firstSeen}, ${age} days ago`,
  };

  const families = signalFamilies(state, config);
  const strong = families.filter((family) => family.level === "strong").length;
  const moderate = families.filter(
    (family) => family.level === "moderate",
  ).length;
  const spanDays =
    state.history.length < 2
      ? 0
      : daysBetween(
          state.history[0]!.date,
          state.history[state.history.length - 1]!.date,
        );
  const stale = daysBetween(state.lastSeen, today) > config.maxSignalAgeDays;
  const sustained = spanDays >= Math.floor(config.minAgeDays / 2);
  const enough =
    strong >= config.required.strongSignals ||
    moderate >= config.required.moderateSignals;
  const third: RuleResult = {
    rule: 3,
    title: "Real usage over the period",
    passed: enough && sustained && !stale,
    detail: stale
      ? `signals last refreshed ${state.lastSeen}`
      : !enough
        ? `${strong} strong and ${moderate} moderate signals, needs ${config.required.strongSignals} strong or ${config.required.moderateSignals} moderate`
        : !sustained
          ? `seen over only ${spanDays} days`
          : `${strong} strong and ${moderate} moderate signals over ${spanDays} days`,
  };

  const fourth: RuleResult = {
    rule: 4,
    title: "Not already in the catalogue",
    passed: input.duplicate === null,
    detail:
      input.duplicate === null
        ? "no match on name, alias, domain or repository"
        : `matches ${input.duplicate.toolId} (${input.duplicate.reason})`,
  };

  const fifth: RuleResult = {
    rule: 5,
    title: "Not on the rejected list",
    passed: input.rejectedReason === null,
    detail: input.rejectedReason ?? "not on the list",
  };

  const rules = [first, second, third, fourth, fifth];
  const onlyCheckMissing =
    first.pending && rules.slice(1).every((rule) => rule.passed);
  return {
    ready: rules.every((rule) => rule.passed),
    rules: rules.map(({ rule, title, passed, detail }) => ({
      rule,
      title,
      passed,
      detail,
    })),
    families,
    needsHomepageCheck: onlyCheckMissing,
  };
}

/** The priority used to choose which new candidates get an issue first. */
export function priority(
  signals: Signals,
  sourceCount: number,
  config: DiscoveryConfig,
): number {
  const { moderate, strong } = config;
  let score = sourceCount;
  const add = (value: number | undefined, mod: number, str: number) => {
    if (value === undefined) return;
    if (value >= str) score += 10;
    else if (value >= mod) score += 4;
    else score += 1;
  };
  add(signals.githubStars, moderate.githubStars, strong.githubStars);
  add(signals.hfLikes, moderate.hfLikes, strong.hfLikes);
  add(signals.hnPoints, moderate.hnPoints, strong.hnPoints);
  if (signals.announced === true) score += 10;
  // Among equal levels, the bigger number goes first.
  const peak = Math.max(
    signals.githubStars ?? 0,
    signals.hfLikes ?? 0,
    (signals.hnPoints ?? 0) * 10,
  );
  return score + Math.log10(1 + peak) / 10;
}
