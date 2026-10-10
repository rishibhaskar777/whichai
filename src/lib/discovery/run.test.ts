import { describe, expect, it, vi } from "vitest";
import configJson from "@/data/discovery/config.json";
import { evaluateAdmission } from "./admission";
import { parseConfig } from "./config";
import { buildIndex } from "./match";
import { planRun, type RunContext } from "./run";
import { renderBody } from "./state";
import {
  LABELS,
  type CandidateState,
  type ExistingIssue,
  type RawCandidate,
  type WatchEntry,
  type Watchlist,
} from "./types";

const config = parseConfig(configJson);
const NOW = new Date("2026-10-10T12:00:00Z");

const index = buildIndex(
  [
    {
      id: "cursor",
      name: "Cursor",
      providerId: "anysphere",
      officialUrl: "https://cursor.com",
      officialDomains: ["cursor.com"],
    },
  ],
  [{ id: "anysphere", name: "Anysphere" }],
);

const slugOf = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

function raw(
  name: string,
  overrides: Partial<RawCandidate> = {},
): RawCandidate {
  const slug = slugOf(name);
  return {
    source: "github",
    name,
    description: `${name} turns notes into slides`,
    homepage: null,
    repository: `https://github.com/maker/${slug}`,
    announcement: null,
    maintainer: "maker",
    topics: [],
    kindHint: null,
    seenUrl: `https://github.com/maker/${slug}`,
    signals: { githubStars: 700 },
    ...overrides,
  };
}

/** A tracked candidate old enough and strong enough to be ready. */
function tracked(
  name: string,
  overrides: Partial<WatchEntry> = {},
): WatchEntry {
  const slug = slugOf(name);
  return {
    version: 1,
    id: slug,
    name,
    description: `${name} turns notes into slides`,
    homepage: null,
    repository: `https://github.com/maker/${slug}`,
    announcement: null,
    maintainer: "maker",
    kind: "ai-tool",
    keys: [`repo:github.com/maker/${slug}`, `name:${slug.replace(/-/g, "")}`],
    sources: [{ source: "github", url: `https://github.com/maker/${slug}` }],
    topics: [],
    jobs: ["presentation-maker"],
    firstSeen: "2026-08-01",
    lastSeen: "2026-10-03",
    history: [
      { date: "2026-08-01", signals: { githubStars: 700 } },
      { date: "2026-10-03", signals: { githubStars: 1300 } },
    ],
    homepageCheck: null,
    score: 5,
    lastGrowth: "2026-10-03",
    ...overrides,
  };
}

function watchlist(
  entries: WatchEntry[] = [],
  expired: Watchlist["expired"] = [],
): Watchlist {
  return { version: 1, updated: "2026-10-03", tracked: entries, expired };
}

function issueFor(
  name: string,
  overrides: Partial<ExistingIssue> = {},
): ExistingIssue {
  const entry: Partial<WatchEntry> = { ...tracked(name) };
  delete entry.score;
  delete entry.lastGrowth;
  const candidate = entry as CandidateState;
  const admission = evaluateAdmission({
    state: candidate,
    firstSeen: candidate.firstSeen,
    now: NOW,
    config,
    duplicate: null,
    rejectedReason: null,
  });
  return {
    number: 7,
    state: "open",
    labels: [LABELS.candidate, LABELS.ready],
    createdAt: "2026-09-01T09:00:00Z",
    body: renderBody(candidate, {
      admission,
      closest: [],
      jobNames: new Map(),
    }),
    authorLogin: "github-actions[bot]",
    ...overrides,
  };
}

function context(overrides: Partial<RunContext> = {}): RunContext {
  return {
    now: NOW,
    config,
    rejected: { names: [], domains: [] },
    index,
    jobs: [
      {
        id: "presentation-maker",
        name: "Presentation maker",
        keywords: ["slides", "deck"],
      },
    ],
    tools: [
      {
        id: "gamma",
        name: "Gamma",
        jobs: ["presentation-maker"],
        fitScores: { "presentation-maker": 4 },
      },
    ],
    issues: [],
    watchlist: null,
    found: [],
    checkHomepage: async (_url, date) => ({
      date,
      status: 200,
      ok: true,
      redirectHost: null,
    }),
    ...overrides,
  };
}

describe("the watchlist", () => {
  it("adds new candidates and opens no issue, however strong", async () => {
    const plan = await planRun(
      context({
        found: [
          raw("Notefox", { signals: { githubStars: 90_000, hnPoints: 900 } }),
        ],
      }),
    );
    expect(plan.create).toHaveLength(0);
    expect(plan.stats.newlyAdded).toBe(1);
    const entry = plan.watchlist.tracked[0]!;
    expect(entry.firstSeen).toBe("2026-10-10");
    expect(entry.lastGrowth).toBe("2026-10-10");
    expect(entry.history).toHaveLength(1);
  });

  it("starts the 30 day clock when a candidate first enters it", async () => {
    const stored = watchlist([
      tracked("Young", { firstSeen: "2026-09-12" }),
      tracked("Old", { firstSeen: "2026-09-10" }),
    ]);
    const plan = await planRun(context({ watchlist: stored }));
    expect(plan.create.map((issue) => issue.state.name)).toEqual(["Old"]);
    expect(plan.statuses.get("young")).toBe("too new");
  });

  it("keeps the first-seen date when a candidate is found again", async () => {
    const plan = await planRun(
      context({
        watchlist: watchlist([tracked("Notefox", { firstSeen: "2026-09-20" })]),
        found: [raw("Notefox", { signals: { githubStars: 1500 } })],
      }),
    );
    const entry = plan.watchlist.tracked[0]!;
    expect(entry.firstSeen).toBe("2026-09-20");
    expect(entry.lastSeen).toBe("2026-10-10");
    expect(entry.history.at(-1)!.signals.githubStars).toBe(1500);
    expect(entry.lastGrowth).toBe("2026-10-10");
    expect(plan.stats.newlyAdded).toBe(0);
  });

  it("merges the same tool found in two sources", async () => {
    const plan = await planRun(
      context({
        found: [
          raw("Notefox"),
          raw("Notefox", {
            source: "hackernews",
            seenUrl: "https://news.ycombinator.com/item?id=5",
            signals: { hnPoints: 80 },
          }),
        ],
      }),
    );
    expect(plan.watchlist.tracked).toHaveLength(1);
    const entry = plan.watchlist.tracked[0]!;
    expect(entry.sources.map((link) => link.source)).toEqual([
      "github",
      "hackernews",
    ]);
    expect(entry.history[0]!.signals).toEqual({
      githubStars: 700,
      hnPoints: 80,
    });
  });

  it("keeps two different things with the same name apart", async () => {
    const plan = await planRun(
      context({
        found: [
          raw("Atlas", { repository: "https://github.com/one/atlas" }),
          raw("Atlas", { repository: "https://github.com/two/atlas" }),
        ],
      }),
    );
    expect(plan.watchlist.tracked).toHaveLength(2);
  });

  it("counts, per source, what is new and what is already known", async () => {
    const plan = await planRun(
      context({
        watchlist: watchlist(
          [tracked("Known")],
          [{ id: "gone", keys: ["name:gone"], until: "2027-01-01" }],
        ),
        issues: [issueFor("Issued", { state: "closed" })],
        found: [
          raw("Fresh One"),
          raw("Fresh Two", { source: "hackernews" }),
          raw("Known"),
          raw("Gone"),
          raw("Issued"),
          raw("Cursor"),
        ],
      }),
    );
    expect(plan.stats.bySource.github).toMatchObject({
      produced: 5,
      fresh: 1,
      alreadyKnown: 3,
      duplicates: 1,
    });
    expect(plan.stats.bySource.hackernews.fresh).toBe(1);
    expect(plan.stats.newlyAdded).toBe(2);
  });

  it("never re-adds an expired candidate until its date, then starts it afresh", async () => {
    const blocked = await planRun(
      context({
        watchlist: watchlist(
          [],
          [{ id: "gone", keys: ["name:gone"], until: "2026-10-11" }],
        ),
        found: [raw("Gone")],
      }),
    );
    expect(blocked.watchlist.tracked).toHaveLength(0);
    expect(blocked.watchlist.expired).toHaveLength(1);

    const allowed = await planRun(
      context({
        watchlist: watchlist(
          [],
          [{ id: "gone", keys: ["name:gone"], until: "2026-10-10" }],
        ),
        found: [raw("Gone")],
      }),
    );
    expect(allowed.watchlist.tracked).toHaveLength(1);
    expect(allowed.watchlist.tracked[0]!.firstSeen).toBe("2026-10-10");
    expect(allowed.watchlist.expired).toHaveLength(0);
  });
});

describe("expiry", () => {
  it("expires a candidate with no growth for 90 days and blocks it for 180", async () => {
    const stale = tracked("Quiet", { lastGrowth: "2026-07-10" });
    const plan = await planRun(context({ watchlist: watchlist([stale]) }));
    expect(plan.watchlist.tracked).toHaveLength(0);
    expect(plan.stats.expired).toBe(1);
    expect(plan.watchlist.expired).toEqual([
      { id: "quiet", keys: stale.keys.slice(0, 2), until: "2027-04-08" },
    ]);
  });

  it("keeps a candidate at 89 days", async () => {
    const plan = await planRun(
      context({
        watchlist: watchlist([tracked("Quiet", { lastGrowth: "2026-07-13" })]),
      }),
    );
    expect(plan.stats.expired).toBe(0);
  });

  it("counts growth seen in this run", async () => {
    const plan = await planRun(
      context({
        watchlist: watchlist([
          tracked("Quiet", {
            lastGrowth: "2026-06-01",
            history: [{ date: "2026-10-03", signals: { githubStars: 800 } }],
          }),
        ]),
        found: [raw("Quiet", { signals: { githubStars: 850 } })],
      }),
    );
    expect(plan.stats.expired).toBe(0);
    expect(plan.watchlist.tracked[0]!.lastGrowth).toBe("2026-10-10");
  });

  it("does not count a lower number as growth", async () => {
    const plan = await planRun(
      context({
        watchlist: watchlist([
          tracked("Quiet", {
            lastGrowth: "2026-06-01",
            history: [{ date: "2026-10-03", signals: { githubStars: 800 } }],
          }),
        ]),
        found: [raw("Quiet", { signals: { githubStars: 790 } })],
      }),
    );
    expect(plan.stats.expired).toBe(1);
  });
});

describe("individual issues", () => {
  it("opens one for a candidate that passes all five rules, and removes it from the watchlist", async () => {
    const check = vi.fn(async (_url: string, date: string) => ({
      date,
      status: 200,
      ok: true,
      redirectHost: null,
    }));
    const plan = await planRun(
      context({
        watchlist: watchlist([
          tracked("Notefox", { homepage: "https://notefox.app/" }),
        ]),
        checkHomepage: check,
      }),
    );
    expect(plan.create).toHaveLength(1);
    const issue = plan.create[0]!;
    expect(issue.labels).toEqual([LABELS.candidate, LABELS.ready]);
    expect(issue.title).toBe("Tool candidate: Notefox");
    expect(issue.admission.ready).toBe(true);
    expect(issue.body).toContain("- [x] 2. First seen at least 30 days ago");
    expect(plan.watchlist.tracked).toHaveLength(0);
    expect(check).toHaveBeenCalledTimes(1);
  });

  it("does not check a homepage while another rule fails", async () => {
    const check = vi.fn();
    await planRun(
      context({
        watchlist: watchlist([
          tracked("Young", {
            homepage: "https://young.example/",
            firstSeen: "2026-10-01",
          }),
        ]),
        checkHomepage: check,
      }),
    );
    expect(check).not.toHaveBeenCalled();
  });

  it("keeps a candidate whose homepage does not answer on the watchlist", async () => {
    const plan = await planRun(
      context({
        watchlist: watchlist([
          tracked("Notefox", { homepage: "https://notefox.app/" }),
        ]),
        checkHomepage: async (_url, date) => ({
          date,
          status: 404,
          ok: false,
          redirectHost: null,
        }),
      }),
    );
    expect(plan.create).toHaveLength(0);
    expect(plan.watchlist.tracked).toHaveLength(1);
    expect(plan.watchlist.tracked[0]!.homepageCheck?.ok).toBe(false);
  });

  it("opens at most five a run, highest score first, and keeps the rest", async () => {
    const entries = Array.from({ length: 8 }, (_, n) =>
      tracked(`Tool ${String.fromCharCode(65 + n)}`, { score: n + 1 }),
    );
    const plan = await planRun(context({ watchlist: watchlist(entries) }));
    expect(plan.create).toHaveLength(5);
    expect(plan.create.map((issue) => issue.entry.score)).toEqual([
      8, 7, 6, 5, 4,
    ]);
    expect(plan.stats.readyThisWeek).toBe(8);
    expect(plan.stats.readyDeferred).toBe(3);
    expect(plan.watchlist.tracked.map((entry) => entry.score)).toEqual([
      3, 2, 1,
    ]);
  });

  it("does not add a candidate that already has an issue, open or closed", async () => {
    const plan = await planRun(
      context({
        issues: [
          issueFor("Open One"),
          issueFor("Closed One", { number: 8, state: "closed" }),
        ],
        found: [raw("Open One"), raw("Closed One")],
      }),
    );
    expect(plan.watchlist.tracked).toHaveLength(0);
    expect(plan.create).toHaveLength(0);
  });

  it("closes an open issue labelled rejected and touches no other", async () => {
    const plan = await planRun(
      context({
        issues: [
          issueFor("Rejected One", {
            number: 11,
            labels: [LABELS.candidate, LABELS.ready, LABELS.rejected],
          }),
          issueFor("Approved One", {
            number: 12,
            labels: [LABELS.candidate, LABELS.approved],
          }),
          issueFor("Plain One", { number: 13 }),
        ],
      }),
    );
    expect(plan.close.map((item) => item.number)).toEqual([11]);
  });

  it("counts an issue whose state block is unreadable and ignores it", async () => {
    const plan = await planRun(
      context({
        issues: [{ ...issueFor("Edited"), body: "I rewrote this by hand" }],
        found: [raw("Edited")],
      }),
    );
    expect(plan.stats.unreadableIssues).toBe(1);
    expect(plan.stats.newlyAdded).toBe(1);
  });
});

describe("names that start with a listed tool's name", () => {
  it("is a new candidate, shown next to the listed tool, when the maker is someone else", async () => {
    const plan = await planRun(
      context({
        watchlist: watchlist([
          tracked("Cursor Studio", {
            homepage: "https://cursor-studio.example.dev/",
            maintainer: "stranger",
            keys: ["name:cursorstudio"],
          }),
        ]),
      }),
    );
    expect(plan.stats.dropped).toBe(0);
    expect(plan.create).toHaveLength(1);
    expect(plan.create[0]!.body).toContain(
      "`Cursor` (similar name, not the same tool)",
    );
  });

  it("is dropped as the listed tool when its maker is the tool's provider", async () => {
    const plan = await planRun(
      context({
        watchlist: watchlist([
          tracked("Cursor Studio", { maintainer: "Anysphere" }),
        ]),
        found: [raw("Cursor Cloud", { maintainer: "Anysphere" })],
      }),
    );
    expect(plan.create).toHaveLength(0);
    expect(plan.stats.dropped).toBe(1);
    expect(plan.stats.bySource.github.duplicates).toBe(1);
  });
});

describe("what leaves the watchlist", () => {
  it("drops a candidate that has joined the catalogue", async () => {
    const plan = await planRun(
      context({ watchlist: watchlist([tracked("Cursor")]) }),
    );
    expect(plan.stats.dropped).toBe(1);
    expect(plan.watchlist.tracked).toHaveLength(0);
  });

  it("drops a candidate that was rejected since", async () => {
    const plan = await planRun(
      context({
        watchlist: watchlist([tracked("Bad Tool")]),
        rejected: { names: ["Bad Tool"], domains: [] },
      }),
    );
    expect(plan.stats.dropped).toBe(1);
  });

  it("keeps at most the configured number, highest score first", async () => {
    const entries = Array.from({ length: 6 }, (_, n) =>
      tracked(`Thing ${n}x`, { score: n, firstSeen: "2026-10-09" }),
    );
    const plan = await planRun(
      context({
        watchlist: watchlist(entries),
        config: {
          ...config,
          watchlist: { ...config.watchlist, maxTracked: 4 },
        },
      }),
    );
    expect(plan.watchlist.tracked.map((entry) => entry.score)).toEqual([
      5, 4, 3, 2,
    ]);
    expect(plan.stats.trimmed).toBe(2);
  });
});

describe("refreshing what the searches did not return", () => {
  it("looks up a tracked candidate and records a new snapshot", async () => {
    const lookup = vi.fn(async () => ({ githubStars: 2000 }));
    const plan = await planRun(
      context({
        watchlist: watchlist([tracked("Notefox", { firstSeen: "2026-10-01" })]),
        lookup,
      }),
    );
    expect(lookup).toHaveBeenCalledTimes(1);
    expect(plan.stats.refreshed).toBe(1);
    const entry = plan.watchlist.tracked[0]!;
    expect(entry.history.at(-1)!.signals.githubStars).toBe(2000);
    expect(entry.lastGrowth).toBe("2026-10-10");
  });

  it("limits the number of lookups and survives a failing one", async () => {
    const entries = Array.from({ length: 5 }, (_, n) =>
      tracked(`Thing ${n}x`, { firstSeen: "2026-10-01" }),
    );
    const lookup = vi.fn(async () => {
      throw new Error("boom");
    });
    const plan = await planRun(
      context({
        watchlist: watchlist(entries),
        lookup,
        config: { ...config, maxRefreshLookups: 2 },
      }),
    );
    expect(lookup).toHaveBeenCalledTimes(2);
    expect(plan.watchlist.tracked).toHaveLength(5);
  });
});
