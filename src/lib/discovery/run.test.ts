import { describe, expect, it, vi } from "vitest";
import configJson from "@/data/discovery/config.json";
import { evaluateAdmission } from "./admission";
import { parseConfig } from "./config";
import { buildIndex } from "./match";
import { planRun, type RunContext } from "./run";
import { encodeState, issueTitle, renderBody } from "./state";
import {
  LABELS,
  type CandidateState,
  type ExistingIssue,
  type RawCandidate,
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

function raw(
  name: string,
  overrides: Partial<RawCandidate> = {},
): RawCandidate {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
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
    signals: { githubStars: 500 },
    ...overrides,
  };
}

function stateFor(name: string, overrides: Partial<CandidateState> = {}) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const state: CandidateState = {
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
    jobs: [],
    firstSeen: "2026-08-01",
    lastSeen: "2026-09-26",
    history: [
      { date: "2026-08-01", signals: { githubStars: 400 } },
      { date: "2026-09-26", signals: { githubStars: 600 } },
    ],
    homepageCheck: null,
    ...overrides,
  };
  return state;
}

function issueFor(
  state: CandidateState,
  overrides: Partial<ExistingIssue> = {},
): ExistingIssue {
  const admission = evaluateAdmission({
    state,
    firstSeen: state.firstSeen,
    now: NOW,
    config,
    duplicate: null,
    rejectedReason: null,
  });
  return {
    number: 7,
    state: "open",
    labels: [LABELS.candidate],
    createdAt: `${state.firstSeen}T09:00:00Z`,
    body: renderBody(state, { admission, closest: [], jobNames: new Map() }),
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
    existing: [],
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

describe("new candidates", () => {
  it("opens at most ten issues, strongest first, and defers the rest", async () => {
    const found = Array.from({ length: 15 }, (_, n) =>
      raw(`Tool ${String.fromCharCode(65 + n)}${n}`, {
        signals: { githubStars: 200 + n * 100 },
      }),
    );
    const plan = await planRun(context({ found }));
    expect(plan.create).toHaveLength(10);
    expect(plan.stats.newCandidates).toBe(15);
    expect(plan.stats.deferred).toBe(5);
    const stars = plan.create.map(
      (issue) => issue.state.history[0]!.signals.githubStars!,
    );
    expect(stars).toEqual([...stars].sort((a, b) => b - a));
    expect(Math.min(...stars)).toBe(700);
  });

  it("honours a different limit", async () => {
    const found = Array.from({ length: 6 }, (_, n) => raw(`Thing ${n}x`));
    const plan = await planRun(
      context({ found, config: { ...config, maxNewIssuesPerRun: 3 } }),
    );
    expect(plan.create).toHaveLength(3);
  });

  it("labels new issues tool-candidate only, and never ready", async () => {
    const plan = await planRun(
      context({ found: [raw("Notefox", { signals: { githubStars: 9000 } })] }),
    );
    expect(plan.create[0]!.labels).toEqual([LABELS.candidate]);
    expect(plan.create[0]!.admission.ready).toBe(false);
    expect(plan.create[0]!.title).toBe("Tool candidate: Notefox");
  });

  it("counts duplicates by source and reason and does not open them", async () => {
    const plan = await planRun(
      context({
        found: [
          raw("Cursor"),
          raw("Cursur"),
          raw("Anything", { homepage: "https://docs.cursor.com/" }),
          raw("Cursor Pro Max", { source: "hackernews" }),
          raw("Fresh Idea"),
        ],
      }),
    );
    expect(plan.create.map((issue) => issue.state.name)).toEqual([
      "Fresh Idea",
    ]);
    expect(plan.stats.bySource.github.duplicates).toBe(3);
    expect(plan.stats.bySource.github.duplicateReasons).toEqual({
      name: 1,
      typo: 1,
      domain: 1,
    });
    expect(plan.stats.bySource.hackernews.duplicates).toBe(1);
  });

  it("drops what is on the rejected list", async () => {
    const plan = await planRun(
      context({
        rejected: { names: ["Bad Tool"], domains: ["scam.example"] },
        found: [
          raw("Bad Tool"),
          raw("Other", { homepage: "https://scam.example/" }),
          raw("Good Tool"),
        ],
      }),
    );
    expect(plan.create.map((issue) => issue.state.name)).toEqual(["Good Tool"]);
    expect(plan.stats.bySource.github.rejected).toBe(2);
  });

  it("merges the same tool found in two sources", async () => {
    const plan = await planRun(
      context({
        found: [
          raw("Notefox", { signals: { githubStars: 700 } }),
          raw("Notefox", {
            source: "hackernews",
            repository: "https://github.com/maker/notefox",
            seenUrl: "https://news.ycombinator.com/item?id=5",
            signals: { hnPoints: 80 },
          }),
        ],
      }),
    );
    expect(plan.create).toHaveLength(1);
    const state = plan.create[0]!.state;
    expect(state.sources.map((link) => link.source)).toEqual([
      "github",
      "hackernews",
    ]);
    expect(state.history[0]!.signals).toEqual({
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
    expect(plan.create).toHaveLength(2);
    expect(new Set(plan.create.map((issue) => issue.state.id)).size).toBe(2);
  });

  it("suggests jobs and lists the closest existing tools", async () => {
    const plan = await planRun(context({ found: [raw("Notefox")] }));
    expect(plan.create[0]!.state.jobs).toEqual(["presentation-maker"]);
    expect(plan.create[0]!.body).toContain("`Gamma`");
  });
});

describe("issues as state", () => {
  it("never touches a closed issue, even one labelled rejected", async () => {
    const closed = issueFor(stateFor("Notefox"), {
      state: "closed",
      labels: [LABELS.candidate, LABELS.rejected],
    });
    const plan = await planRun(
      context({ existing: [closed], found: [raw("Notefox")] }),
    );
    expect(plan.create).toHaveLength(0);
    expect(plan.update).toHaveLength(0);
    expect(plan.stats.alreadyKnownClosed).toBe(1);
  });

  it("does not open a second issue for a candidate that has one", async () => {
    const plan = await planRun(
      context({
        existing: [issueFor(stateFor("Notefox"))],
        found: [raw("Notefox", { signals: { githubStars: 650 } })],
      }),
    );
    expect(plan.create).toHaveLength(0);
    expect(plan.update).toHaveLength(1);
    expect(plan.stats.matchedOpen).toBe(1);
  });

  it("edits the body with a new snapshot, and leaves an unchanged body alone", async () => {
    const plan = await planRun(
      context({
        existing: [issueFor(stateFor("Notefox"))],
        found: [raw("Notefox", { signals: { githubStars: 650 } })],
      }),
    );
    const update = plan.update[0]!;
    expect(update.body).toContain("GitHub stars: 650");
    expect(update.body).toContain("Last refreshed | 2026-10-10");
  });

  it("adds ready-for-review when all five rules pass", async () => {
    const check = vi.fn(async (_url: string, date: string) => ({
      date,
      status: 200,
      ok: true,
      redirectHost: null,
    }));
    const state = stateFor("Notefox", {
      homepage: "https://notefox.app/",
      history: [
        { date: "2026-08-01", signals: { githubStars: 700 } },
        { date: "2026-09-26", signals: { githubStars: 1300 } },
      ],
    });
    const plan = await planRun(
      context({
        existing: [issueFor(state, { createdAt: "2026-08-01T09:00:00Z" })],
        found: [raw("Notefox", { signals: { githubStars: 1400 } })],
        checkHomepage: check,
      }),
    );
    const update = plan.update[0]!;
    expect(update.admission?.ready).toBe(true);
    expect(update.labels).toContain(LABELS.ready);
    expect(update.becameReady).toBe(true);
    expect(check).toHaveBeenCalledTimes(1);
    expect(check).toHaveBeenCalledWith("https://notefox.app/", "2026-10-10");
  });

  it("does not check the homepage of a young candidate", async () => {
    const check = vi.fn();
    const state = stateFor("Notefox", { homepage: "https://notefox.app/" });
    await planRun(
      context({
        existing: [issueFor(state, { createdAt: "2026-10-01T09:00:00Z" })],
        found: [raw("Notefox")],
        checkHomepage: check,
      }),
    );
    expect(check).not.toHaveBeenCalled();
  });

  it("does not become ready when the homepage does not answer", async () => {
    const state = stateFor("Notefox", {
      homepage: "https://notefox.app/",
      history: [
        { date: "2026-08-01", signals: { githubStars: 700 } },
        { date: "2026-09-26", signals: { githubStars: 1300 } },
      ],
    });
    const plan = await planRun(
      context({
        existing: [issueFor(state, { createdAt: "2026-08-01T09:00:00Z" })],
        found: [raw("Notefox", { signals: { githubStars: 1400 } })],
        checkHomepage: async (_url, date) => ({
          date,
          status: 404,
          ok: false,
          redirectHost: null,
        }),
      }),
    );
    expect(plan.update[0]!.admission?.ready).toBe(false);
    expect(plan.update[0]!.labels).toBeNull();
  });

  it("removes ready-for-review when the tool has since joined the catalogue", async () => {
    const state = stateFor("Cursor Fresh", {
      id: "cursor-fresh",
      history: [
        { date: "2026-08-01", signals: { githubStars: 700 } },
        { date: "2026-09-26", signals: { githubStars: 1300 } },
      ],
    });
    const plan = await planRun(
      context({
        existing: [
          issueFor(state, {
            createdAt: "2026-08-01T09:00:00Z",
            labels: [LABELS.candidate, LABELS.ready],
          }),
        ],
      }),
    );
    expect(plan.update[0]!.labels).toEqual([LABELS.candidate]);
  });

  it("closes an open issue that was labelled rejected, and does nothing else to it", async () => {
    const plan = await planRun(
      context({
        existing: [
          issueFor(stateFor("Notefox"), {
            labels: [LABELS.candidate, LABELS.rejected],
          }),
        ],
        found: [raw("Notefox")],
      }),
    );
    expect(plan.update).toHaveLength(1);
    expect(plan.update[0]!.close).toBe(true);
    expect(plan.update[0]!.body).toBeNull();
  });

  it("leaves an approved issue alone", async () => {
    const plan = await planRun(
      context({
        existing: [
          issueFor(stateFor("Notefox"), {
            labels: [LABELS.candidate, LABELS.approved],
          }),
        ],
        found: [raw("Notefox")],
      }),
    );
    expect(plan.update).toHaveLength(0);
    expect(plan.create).toHaveLength(0);
  });

  it("ignores an issue whose state block is missing or edited into nonsense", async () => {
    const plan = await planRun(
      context({
        existing: [
          { ...issueFor(stateFor("Notefox")), body: "I edited this by hand" },
          {
            ...issueFor(stateFor("Other")),
            number: 8,
            body: "<!-- whichai-candidate {} -->",
          },
        ],
      }),
    );
    expect(plan.stats.unreadableIssues).toBe(2);
    expect(plan.update).toHaveLength(0);
  });

  it("refreshes an open candidate the searches did not return", async () => {
    const lookup = vi.fn(async () => ({ githubStars: 800 }));
    const plan = await planRun(
      context({
        existing: [issueFor(stateFor("Notefox"))],
        lookup,
      }),
    );
    expect(lookup).toHaveBeenCalledTimes(1);
    expect(plan.stats.refreshed).toBe(1);
    expect(plan.update[0]!.body).toContain("GitHub stars: 800");
  });

  it("limits the number of refresh lookups", async () => {
    const lookup = vi.fn(async () => null);
    const existing = Array.from({ length: 5 }, (_, n) =>
      issueFor(stateFor(`Thing ${n}x`), { number: 10 + n }),
    );
    await planRun(
      context({
        existing,
        lookup,
        config: { ...config, maxRefreshLookups: 2 },
      }),
    );
    expect(lookup).toHaveBeenCalledTimes(2);
  });

  it("survives a failing lookup", async () => {
    const plan = await planRun(
      context({
        existing: [issueFor(stateFor("Notefox"))],
        lookup: async () => {
          throw new Error("boom");
        },
      }),
    );
    expect(plan.update).toHaveLength(1);
  });

  it("makes titles that match the state", async () => {
    const state = stateFor("Notefox");
    const plan = await planRun(
      context({ existing: [issueFor(state)], found: [raw("Notefox")] }),
    );
    expect(plan.update[0]!.title).toBe(issueTitle(state));
    expect(encodeState(state)).toContain("whichai-candidate");
  });
});
