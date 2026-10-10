import { loadFiles } from "../src/lib/discovery/files.ts";
import { IssueApi } from "../src/lib/discovery/github-api.ts";
import { checkHomepage } from "../src/lib/discovery/homepage.ts";
import { createJsonClient } from "../src/lib/discovery/http.ts";
import type { SourceResult } from "../src/lib/discovery/http.ts";
import { repositoryKey } from "../src/lib/discovery/identity.ts";
import { planRun, type RunPlan } from "../src/lib/discovery/run.ts";
import {
  fetchGithub,
  lookupRepository,
} from "../src/lib/discovery/sources/github.ts";
import { fetchHackerNews } from "../src/lib/discovery/sources/hackernews.ts";
import {
  fetchHuggingFace,
  lookupItem,
} from "../src/lib/discovery/sources/huggingface.ts";
import { fetchNews } from "../src/lib/discovery/sources/news.ts";
import type {
  CandidateState,
  ExistingIssue,
  RawCandidate,
  Signals,
  SourceName,
  Watchlist,
} from "../src/lib/discovery/types.ts";
import {
  decodeWatchlist,
  fitWatchlist,
} from "../src/lib/discovery/watchlist.ts";

/*
 * Weekly discovery of new AI tools.
 *
 *   npm run discover:dry-run    report what a run would find and do; reads and
 *                               writes no issue, so every candidate looks new
 *   node scripts/discover.ts    the real run (the workflow does this): needs
 *                               GITHUB_REPOSITORY and GITHUB_TOKEN
 *
 * It keeps one watchlist issue up to date and opens an issue of its own for a
 * candidate only when it passes every admission rule. It never writes to the
 * catalogue, pushes a commit or opens a pull request. See
 * docs/TOOL-DISCOVERY.md.
 */

const dryRun = process.argv.includes("--dry-run");
const root = new URL("../", import.meta.url);
const files = loadFiles(root);
const now = new Date();
const today = now.toISOString().slice(0, 10);
const token = process.env.GITHUB_TOKEN || undefined;
const client = createJsonClient();

const WATCHLIST_TITLE = "Discovery watchlist";

function log(line = ""): void {
  process.stdout.write(`${line}\n`);
}

async function collect(): Promise<SourceResult<RawCandidate>[]> {
  return Promise.all([
    fetchGithub(client, files.config, now, token),
    fetchHuggingFace(client, files.config, now),
    fetchHackerNews(client, files.config, now),
    fetchNews(files.newsSources, files.config, now),
  ]);
}

/** Current numbers for a tracked candidate the searches did not return. */
async function lookup(state: CandidateState): Promise<Signals | null> {
  const key = repositoryKey(state.repository);
  if (key === null || state.repository === null) return null;
  if (key.startsWith("github.com/")) {
    const stars = await lookupRepository(
      client,
      key.slice("github.com/".length),
      token,
    );
    return stars === null ? null : { githubStars: stars };
  }
  const item = await lookupItem(client, state.repository);
  if (item === null) return null;
  return {
    hfLikes: item.likes,
    ...(item.downloads === undefined ? {} : { hfDownloads: item.downloads }),
  };
}

function report(results: SourceResult<RawCandidate>[], plan: RunPlan): void {
  log(
    dryRun
      ? "Discovery dry run (no issue is read or written)"
      : "Discovery run",
  );
  log("");
  log("Per source: seen -> kept by its filters -> duplicates, rejected -> new");
  for (const result of results) {
    const stats = plan.stats.bySource[result.source as SourceName];
    const reasons = Object.entries(stats.duplicateReasons)
      .map(([reason, count]) => `${reason} ${count}`)
      .join(", ");
    log(
      `  ${result.source.padEnd(12)} ${result.ok ? "ok     " : "SKIPPED"} ` +
        `seen ${result.seen} -> kept ${stats.produced} -> ` +
        `duplicates ${stats.duplicates}${reasons ? ` (${reasons})` : ""}, ` +
        `rejected ${stats.rejected}, already known ${stats.alreadyKnown} -> ` +
        `new ${stats.fresh}   [${result.requests} requests]`,
    );
    if (result.error !== null) log(`               ${result.error}`);
  }
  const { stats } = plan;
  log("");
  log(`Tracked on the watchlist:       ${stats.tracked}`);
  log(`Newly added this run:           ${stats.newlyAdded}`);
  log(`Expired this run (no growth):   ${stats.expired}`);
  log(`Ready this week (all 5 rules):  ${stats.readyThisWeek}`);
  log(`  issues opened:                ${stats.issuesCreated}`);
  log(`  ready, waiting for next run:  ${stats.readyDeferred}`);
  if (stats.dropped > 0)
    log(`Dropped (now in catalogue or rejected): ${stats.dropped}`);
  if (stats.trimmed > 0)
    log(`Trimmed for size or the tracking limit: ${stats.trimmed}`);
  if (stats.refreshed > 0)
    log(`Refreshed by direct lookup: ${stats.refreshed}`);
  if (stats.unreadableIssues > 0) {
    log(
      `Issues whose state block could not be read: ${stats.unreadableIssues}`,
    );
  }
  if (dryRun) {
    log("");
    log("A dry run starts from an empty watchlist, so nothing can be ready or");
    log(
      "expired yet. A real run carries the watchlist and its 30 day clocks over.",
    );
  }
  const top = [...plan.watchlist.tracked]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  if (top.length > 0) {
    log("");
    log("Top of the watchlist:");
    for (const entry of top) {
      const sources = [...new Set(entry.sources.map((s) => s.source))].join(
        "+",
      );
      log(
        `  ${entry.score.toFixed(1).padStart(5)}  ${entry.name}  [${sources}]`,
      );
    }
  }
  for (const issue of plan.create) {
    log(`Would open an issue: ${issue.title}`);
  }
}

async function readState(api: IssueApi): Promise<{
  issues: ExistingIssue[];
  watchlist: Watchlist | null;
  watchlistIssue: ExistingIssue | null;
}> {
  const issues = await api.listCandidates();
  const watchlistIssue = await api.findWatchlist();
  const watchlist =
    watchlistIssue === null ? null : decodeWatchlist(watchlistIssue.body);
  if (watchlistIssue !== null && watchlist === null) {
    throw new Error(
      `Issue ${watchlistIssue.number} is labelled as the watchlist but its state block cannot be read. Fix or close it; nothing was changed.`,
    );
  }
  return { issues, watchlist, watchlistIssue };
}

async function main(): Promise<number> {
  const results = await collect();
  const found = results.flatMap((result) => result.items);

  let api: IssueApi | null = null;
  let state: Awaited<ReturnType<typeof readState>> = {
    issues: [],
    watchlist: null,
    watchlistIssue: null,
  };
  if (!dryRun) {
    const repo = process.env.GITHUB_REPOSITORY;
    if (!repo || !token) {
      throw new Error(
        "GITHUB_REPOSITORY and GITHUB_TOKEN are required for a real run.",
      );
    }
    api = new IssueApi(repo, token);
    await api.ensureLabels();
    state = await readState(api);
  }

  const plan = await planRun({
    now,
    config: files.config,
    rejected: files.rejected,
    index: files.index,
    jobs: files.jobs,
    tools: files.toolInfos,
    issues: state.issues,
    watchlist: state.watchlist,
    found,
    checkHomepage: (url, date) => checkHomepage(url, date),
    lookup: dryRun ? async () => null : lookup,
  });

  if (api !== null) {
    const watchlist = {
      ...plan.watchlist,
      tracked: [...plan.watchlist.tracked],
    };
    let created = 0;
    for (const issue of plan.create) {
      try {
        await api.createIssue(issue.title, issue.body, issue.labels);
        created += 1;
      } catch (error) {
        // Keep the candidate on the watchlist so it is tried again next run.
        watchlist.tracked.push(issue.entry);
        process.stderr.write(
          `Could not open "${issue.title}": ${error instanceof Error ? error.message : "failed"}\n`,
        );
      }
    }
    plan.stats.issuesCreated = created;

    for (const closing of plan.close) {
      await api.updateIssue(closing.number, { close: true });
    }

    const rendered = fitWatchlist(watchlist, {
      config: files.config,
      today,
      statuses: plan.statuses,
      counts: {
        added: plan.stats.newlyAdded,
        expired: plan.stats.expired,
        ready: plan.stats.readyThisWeek,
        promoted: created,
      },
    });
    plan.stats.trimmed += rendered.trimmed;
    plan.watchlist = rendered.watchlist;
    plan.stats.tracked = rendered.watchlist.tracked.length;

    if (state.watchlistIssue === null) {
      const made = await api.createIssue(WATCHLIST_TITLE, rendered.body, [
        "discovery-watchlist",
      ]);
      await api.pinIssue(made.nodeId).catch(() => {
        log("The watchlist could not be pinned by the job. Pin it by hand.");
      });
    } else if (state.watchlistIssue.body !== rendered.body) {
      await api.updateIssue(state.watchlistIssue.number, {
        body: rendered.body,
      });
    }
  }

  report(results, plan);
  const anySource = results.some((result) => result.ok);
  if (!anySource) log("\nEvery source failed; nothing was found this run.");
  return anySource ? 0 : 1;
}

process.exitCode = await main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : "Discovery failed."}\n`,
  );
  return 1;
});
