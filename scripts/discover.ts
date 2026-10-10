import { loadFiles } from "../src/lib/discovery/files.ts";
import { IssueApi } from "../src/lib/discovery/github-api.ts";
import { checkHomepage } from "../src/lib/discovery/homepage.ts";
import { createJsonClient } from "../src/lib/discovery/http.ts";
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
import { repositoryKey } from "../src/lib/discovery/identity.ts";
import type {
  CandidateState,
  RawCandidate,
  Signals,
  SourceName,
} from "../src/lib/discovery/types.ts";
import type { SourceResult } from "../src/lib/discovery/http.ts";

/*
 * Weekly discovery of new AI tools.
 *
 *   npm run discover:dry-run    report what a run would find and do; touches
 *                               no issue and writes nothing
 *   node scripts/discover.ts    the real run (the workflow does this): needs
 *                               GITHUB_REPOSITORY and GITHUB_TOKEN
 *
 * It only creates and edits issues. It never writes to the catalogue, pushes a
 * commit or opens a pull request. See docs/TOOL-DISCOVERY.md.
 */

const dryRun = process.argv.includes("--dry-run");
const root = new URL("../", import.meta.url);
const files = loadFiles(root);
const now = new Date();
const token = process.env.GITHUB_TOKEN || undefined;
const client = createJsonClient();

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

/** Current numbers for a candidate the searches did not return this week. */
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
  for (const result of results) {
    const stats = plan.stats.bySource[result.source as SourceName];
    const reasons = Object.entries(stats.duplicateReasons)
      .map(([reason, count]) => `${reason} ${count}`)
      .join(", ");
    log(
      `${result.source.padEnd(12)} ${result.ok ? "ok     " : "SKIPPED"} ` +
        `produced ${stats.produced}, unusable ${stats.invalid}, ` +
        `duplicates ${stats.duplicates}${reasons ? ` (${reasons})` : ""}, ` +
        `rejected ${stats.rejected}, requests ${result.requests}`,
    );
    if (result.error !== null) log(`             ${result.error}`);
  }
  const { stats } = plan;
  log("");
  log(`After merging the same tool from several sources: ${stats.merged}`);
  log(`Already tracked by a closed issue: ${stats.alreadyKnownClosed}`);
  log(`Already tracked by an open issue: ${stats.matchedOpen}`);
  log(`New candidates: ${stats.newCandidates}`);
  log(
    `  issues ${dryRun ? "that would be" : ""} opened now: ${stats.createdNow}`,
  );
  log(`  left for a later run (limit): ${stats.deferred}`);
  log(`Open candidates refreshed by lookup: ${stats.refreshed}`);
  log(`Open candidates now ready for review: ${stats.readyNow}`);
  if (stats.unreadableIssues > 0) {
    log(
      `Issues whose state block could not be read: ${stats.unreadableIssues}`,
    );
  }
  if (plan.create.length > 0) {
    log("");
    log("New issues:");
    for (const issue of plan.create) {
      const signals = issue.state.history[0]?.signals ?? {};
      const summary = Object.entries(signals)
        .map(([key, value]) => `${key}=${String(value)}`)
        .join(" ");
      log(
        `  - ${issue.title}  [${[...new Set(issue.state.sources.map((s) => s.source))].join("+")}] ${summary}`,
      );
    }
  }
  const ready = plan.update.filter((update) => update.becameReady);
  if (ready.length > 0) {
    log("");
    log("Newly ready for review:");
    for (const update of ready)
      log(`  - issue ${update.number}: ${update.title}`);
  }
}

async function main(): Promise<number> {
  const results = await collect();
  const found = results.flatMap((result) => result.items);

  let api: IssueApi | null = null;
  let existing: Awaited<ReturnType<IssueApi["listCandidates"]>> = [];
  if (!dryRun) {
    const repo = process.env.GITHUB_REPOSITORY;
    if (!repo || !token) {
      throw new Error(
        "GITHUB_REPOSITORY and GITHUB_TOKEN are required for a real run.",
      );
    }
    api = new IssueApi(repo, token);
    await api.ensureLabels();
    existing = await api.listCandidates();
  }

  const plan = await planRun({
    now,
    config: files.config,
    rejected: files.rejected,
    index: files.index,
    jobs: files.jobs,
    tools: files.toolInfos,
    existing,
    found,
    checkHomepage: (url, today) => checkHomepage(url, today),
    lookup: dryRun ? async () => null : lookup,
  });
  report(results, plan);

  if (api !== null) {
    for (const issue of plan.create) {
      await api.createIssue(issue.title, issue.body, issue.labels);
    }
    for (const update of plan.update) {
      if (update.body === null && update.labels === null && !update.close)
        continue;
      await api.updateIssue(update.number, {
        ...(update.body === null ? {} : { body: update.body }),
        ...(update.labels === null ? {} : { labels: update.labels }),
        ...(update.close ? { close: true } : {}),
      });
    }
  }

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
