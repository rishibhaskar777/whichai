import { readFileSync } from "node:fs";
import { fetchFeedText } from "../src/lib/news/fetch-feed.ts";
import { MAX_AGE_MS, parseFeed } from "../src/lib/news/parse-feed.ts";
import type { NewsSource } from "../src/lib/news/types.ts";

/*
 * Fetches every feed in src/data/news/sources.json the way the site does and
 * reports the ones that fail, return no items, or have gone quiet for more
 * than 60 days. Prints nothing but a summary when all is well.
 *
 *   npm run news:check
 *
 * Exits with 1 when any source has a problem. It changes no data.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

const sources = JSON.parse(
  readFileSync(
    new URL("../src/data/news/sources.json", import.meta.url),
    "utf8",
  ),
) as NewsSource[];

async function check(source: NewsSource): Promise<string | null> {
  let text: string;
  try {
    text = await fetchFeedText(source.feedUrl);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "request failed";
    return `failed: ${reason}`;
  }

  const items = parseFeed(text, source, {
    now: Date.now(),
    matchTools: () => [],
    // Age is judged below, so that "quiet" and "empty" can be told apart.
    maxAgeMs: Number.POSITIVE_INFINITY,
  });
  if (items === null) return "not a feed (the response was not RSS or Atom)";
  const newest = items[0];
  if (newest === undefined) {
    return "no items (empty, undated, or links off the official domains)";
  }
  const age = Date.now() - Date.parse(newest.publishedAt);
  if (age > MAX_AGE_MS) {
    return `newest item is ${Math.floor(age / DAY_MS)} days old (${newest.publishedAt.slice(0, 10)})`;
  }
  return null;
}

const results = await Promise.all(
  sources.map(async (source) => ({ source, problem: await check(source) })),
);
const problems = results.filter((result) => result.problem !== null);

for (const { source, problem } of problems) {
  console.log(`${source.id}  ${source.feedUrl}\n  ${problem}`);
}
console.log(
  `${sources.length - problems.length} of ${sources.length} news sources are healthy.`,
);
process.exitCode = problems.length > 0 ? 1 : 0;
