import { describe, expect, it } from "vitest";
import configJson from "@/data/discovery/config.json";
import {
  appendSnapshot,
  evaluateAdmission,
  mergeSignals,
  priority,
  signalFamilies,
  starGrowth,
} from "./admission";
import { parseConfig } from "./config";
import type { CandidateState, Signals, Snapshot } from "./types";

const config = parseConfig(configJson);
const NOW = new Date("2026-10-10T12:00:00Z");

function state(overrides: Partial<CandidateState> = {}): CandidateState {
  return {
    version: 1,
    id: "foo",
    name: "Foo",
    description: "A tool",
    homepage: null,
    repository: "https://github.com/maker/foo",
    announcement: null,
    maintainer: "maker",
    kind: "ai-tool",
    keys: ["name:foo"],
    sources: [{ source: "github", url: "https://github.com/maker/foo" }],
    topics: [],
    jobs: [],
    firstSeen: "2026-08-01",
    lastSeen: "2026-10-08",
    history: [
      { date: "2026-08-01", signals: { githubStars: 900 } },
      { date: "2026-10-08", signals: { githubStars: 1200 } },
    ],
    homepageCheck: null,
    ...overrides,
  };
}

function evaluate(
  candidate: CandidateState,
  extra: { firstSeen?: string; duplicate?: boolean; rejected?: string } = {},
) {
  return evaluateAdmission({
    state: candidate,
    firstSeen: extra.firstSeen ?? "2026-08-01",
    now: NOW,
    config,
    duplicate: extra.duplicate ? { toolId: "x", reason: "name" } : null,
    rejectedReason: extra.rejected ?? null,
  });
}

const rule = (result: ReturnType<typeof evaluate>, n: number) =>
  result.rules.find((entry) => entry.rule === n)!;

describe("the 30 day rule", () => {
  it("fails at 29 days and passes at 30", () => {
    const young = evaluate(state(), { firstSeen: "2026-09-11" });
    const old = evaluate(state(), { firstSeen: "2026-09-10" });
    expect(rule(young, 2).passed).toBe(false);
    expect(rule(old, 2).passed).toBe(true);
  });

  it("is configurable", () => {
    const strict = { ...config, minAgeDays: 60 };
    const result = evaluateAdmission({
      state: state(),
      firstSeen: "2026-09-01",
      now: NOW,
      config: strict,
      duplicate: null,
      rejectedReason: null,
    });
    expect(result.rules[1]!.passed).toBe(false);
  });
});

describe("signal thresholds", () => {
  function usage(latest: Signals, extra: Partial<CandidateState> = {}) {
    return state({
      history: [
        { date: "2026-08-01", signals: latest },
        { date: "2026-10-08", signals: latest },
      ],
      ...extra,
    });
  }

  it("passes with one strong signal", () => {
    expect(rule(evaluate(usage({ githubStars: 1000 })), 3).passed).toBe(true);
    expect(rule(evaluate(usage({ hnPoints: 150 })), 3).passed).toBe(true);
    expect(rule(evaluate(usage({ announced: true })), 3).passed).toBe(true);
  });

  it("fails with one moderate signal", () => {
    expect(rule(evaluate(usage({ githubStars: 999 })), 3).passed).toBe(false);
  });

  it("passes with two moderate signals from different places", () => {
    const result = evaluate(usage({ githubStars: 400, hnPoints: 60 }));
    expect(rule(result, 3).passed).toBe(true);
  });

  it("does not count stars and star growth twice", () => {
    const families = signalFamilies(usage({ githubStars: 400 }), config);
    expect(families.filter((f) => f.family === "GitHub")).toHaveLength(1);
  });

  it("counts mentions in two independent sources as moderate", () => {
    const candidate = usage(
      { githubStars: 400 },
      {
        sources: [
          { source: "github", url: "https://github.com/maker/foo" },
          {
            source: "hackernews",
            url: "https://news.ycombinator.com/item?id=1",
          },
        ],
      },
    );
    const mentions = signalFamilies(candidate, config).find(
      (family) => family.family === "Mentions",
    );
    expect(mentions?.level).toBe("moderate");
    expect(rule(evaluate(candidate), 3).passed).toBe(true);
  });

  it("fails when signals are older than the limit", () => {
    const stale = usage({ githubStars: 5000 }, { lastSeen: "2026-09-01" });
    expect(rule(evaluate(stale), 3).passed).toBe(false);
  });

  it("fails when the candidate was seen over too short a span", () => {
    const brief = state({
      history: [{ date: "2026-10-08", signals: { githubStars: 5000 } }],
    });
    expect(rule(evaluate(brief), 3).passed).toBe(false);
  });
});

describe("starGrowth", () => {
  const at = (date: string, githubStars: number): Snapshot => ({
    date,
    signals: { githubStars },
  });

  it("is stars gained per 30 days", () => {
    expect(starGrowth([at("2026-09-10", 100), at("2026-10-10", 700)])).toBe(
      600,
    );
    expect(starGrowth([at("2026-08-31", 100), at("2026-10-10", 500)])).toBe(
      300,
    );
  });

  it("needs a baseline at least 14 days old", () => {
    expect(
      starGrowth([at("2026-10-01", 100), at("2026-10-10", 700)]),
    ).toBeNull();
  });

  it("can make a small project count as strong", () => {
    const candidate = state({
      history: [at("2026-09-10", 100), at("2026-10-08", 700)],
    });
    const github = signalFamilies(candidate, config).find(
      (family) => family.family === "GitHub",
    );
    expect(github?.level).toBe("strong");
  });
});

describe("rule 1, a real place and someone behind it", () => {
  it("fails without a maker", () => {
    expect(rule(evaluate(state({ maintainer: null })), 1).passed).toBe(false);
  });

  it("fails without any address", () => {
    const empty = state({ repository: null, homepage: null });
    expect(rule(evaluate(empty), 1).passed).toBe(false);
  });

  it("needs the homepage check when there is a homepage", () => {
    const candidate = state({ homepage: "https://foo.example/" });
    const result = evaluate(candidate);
    expect(rule(result, 1).passed).toBe(false);
    expect(result.needsHomepageCheck).toBe(true);
  });

  it("does not ask for a check while another rule fails", () => {
    const candidate = state({ homepage: "https://foo.example/" });
    const result = evaluate(candidate, { duplicate: true });
    expect(result.needsHomepageCheck).toBe(false);
  });

  it("fails when the homepage does not answer", () => {
    const candidate = state({
      homepage: "https://foo.example/",
      homepageCheck: {
        date: "2026-10-10",
        status: 404,
        ok: false,
        redirectHost: null,
      },
    });
    expect(rule(evaluate(candidate), 1).passed).toBe(false);
  });

  it("passes with a homepage that answered", () => {
    const candidate = state({
      homepage: "https://foo.example/",
      homepageCheck: {
        date: "2026-10-10",
        status: 200,
        ok: true,
        redirectHost: null,
      },
    });
    expect(evaluate(candidate).ready).toBe(true);
  });

  it("accepts an official announcement as the place", () => {
    const candidate = state({
      repository: null,
      announcement: "https://openai.com/index/foo",
      maintainer: "OpenAI",
    });
    expect(rule(evaluate(candidate), 1).passed).toBe(true);
  });
});

describe("rules 4 and 5", () => {
  it("fails when the tool is in the catalogue", () => {
    const result = evaluate(state(), { duplicate: true });
    expect(rule(result, 4).passed).toBe(false);
    expect(result.ready).toBe(false);
  });

  it("fails when the tool is on the rejected list", () => {
    const result = evaluate(state(), { rejected: "name matches Foo" });
    expect(rule(result, 5).passed).toBe(false);
    expect(result.ready).toBe(false);
  });
});

it("is ready only when all five rules pass", () => {
  const result = evaluate(state());
  expect(result.rules.every((entry) => entry.passed)).toBe(true);
  expect(result.ready).toBe(true);
});

describe("history", () => {
  it("keeps one snapshot per day, oldest first, at most 6", () => {
    let history: Snapshot[] = [];
    for (let day = 1; day <= 25; day += 1) {
      const date = `2026-09-${String(day).padStart(2, "0")}`;
      history = appendSnapshot(history, { date, signals: { hnPoints: day } });
    }
    history = appendSnapshot(history, {
      date: "2026-09-25",
      signals: { hnPoints: 999 },
    });
    expect(history).toHaveLength(6);
    expect(history[0]!.date).toBe("2026-09-20");
    expect(history.at(-1)!.signals.hnPoints).toBe(999);
  });

  it("merges signals by keeping the largest number", () => {
    expect(
      mergeSignals(
        { githubStars: 10, hnPoints: 5 },
        { githubStars: 3, hfLikes: 2 },
      ),
    ).toEqual({ githubStars: 10, hnPoints: 5, hfLikes: 2 });
  });
});

describe("priority", () => {
  it("puts stronger signals first and uses the size as a tie-break", () => {
    const strongBig = priority({ githubStars: 9000 }, 1, config);
    const strongSmall = priority({ githubStars: 1200 }, 1, config);
    const moderate = priority({ githubStars: 400 }, 1, config);
    expect(strongBig).toBeGreaterThan(strongSmall);
    expect(strongSmall).toBeGreaterThan(moderate);
  });
});
