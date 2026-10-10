import { describe, expect, it } from "vitest";
import configJson from "@/data/discovery/config.json";
import { parseConfig } from "./config";
import type { WatchEntry, Watchlist } from "./types";
import {
  decodeWatchlist,
  emptyWatchlist,
  encodeWatchlist,
  fitWatchlist,
  isExpiredNow,
} from "./watchlist";

const config = parseConfig(configJson);

function entry(n: number, overrides: Partial<WatchEntry> = {}): WatchEntry {
  return {
    version: 1,
    id: `tool-${n}`,
    name: `Tool ${n}`,
    description: "Turns notes into slides",
    homepage: `https://tool${n}.example.dev/`,
    repository: `https://github.com/maker/tool-${n}`,
    announcement: null,
    maintainer: "maker",
    kind: "ai-tool",
    keys: [`repo:github.com/maker/tool-${n}`, `site:tool${n}.example.dev`],
    sources: [
      { source: "github", url: `https://github.com/maker/tool-${n}` },
      {
        source: "hackernews",
        url: `https://news.ycombinator.com/item?id=${50000000 + n}`,
      },
    ],
    topics: [],
    jobs: ["presentation-maker"],
    firstSeen: "2026-09-01",
    lastSeen: "2026-10-08",
    history: [
      { date: "2026-09-01", signals: { githubStars: 500 + n } },
      {
        date: "2026-10-08",
        signals: { githubStars: 900 + n, hnPoints: 120, announced: true },
      },
    ],
    homepageCheck: {
      date: "2026-10-08",
      status: 200,
      ok: true,
      redirectHost: null,
    },
    score: 10 + n / 100,
    lastGrowth: "2026-10-08",
    ...overrides,
  };
}

function list(
  entries: WatchEntry[],
  expired: Watchlist["expired"] = [],
): Watchlist {
  return { version: 1, updated: "2026-10-10", tracked: entries, expired };
}

const view = {
  config,
  today: "2026-10-10",
  statuses: new Map<string, string>(),
  counts: { added: 3, expired: 1, ready: 0, promoted: 0 },
};

describe("the hidden block", () => {
  it("round-trips every tracked field", () => {
    const original = list(
      [entry(1), entry(2)],
      [{ id: "old-thing", keys: ["name:oldthing"], until: "2027-01-01" }],
    );
    expect(decodeWatchlist(encodeWatchlist(original))).toEqual(original);
  });

  it("cannot be ended early by text inside it", () => {
    const hostile = list([
      entry(1, { description: "--> <!-- whichai-watchlist {} --> <b>x</b>" }),
    ]);
    const block = encodeWatchlist(hostile);
    const inner = block.slice("<!-- ".length, -" -->".length);
    expect(inner).not.toMatch(/[<>]/);
    expect(inner).not.toContain("--");
    expect(decodeWatchlist(`text\n${block}`)?.tracked[0]?.description).toBe(
      hostile.tracked[0]!.description,
    );
  });

  it("uses the last block in a body", () => {
    const fake = encodeWatchlist(list([entry(9, { name: "Fake" })]));
    const real = encodeWatchlist(list([entry(1)]));
    expect(decodeWatchlist(`${fake}\ntext\n${real}`)?.tracked[0]?.id).toBe(
      "tool-1",
    );
  });

  it.each([
    ["no block", "just text"],
    ["broken json", "<!-- whichai-watchlist {oops -->"],
    ["no end", "<!-- whichai-watchlist {}"],
    [
      "wrong version",
      '<!-- whichai-watchlist {"v":2,"u":"2026-10-10","t":[],"x":[]} -->',
    ],
    [
      "an extra field",
      '<!-- whichai-watchlist {"v":1,"u":"2026-10-10","t":[],"x":[],"admin":1} -->',
    ],
    [
      "a source address that is not https",
      encodeWatchlist(
        list([
          entry(1, {
            sources: [{ source: "github", url: "http://evil.example/" }],
          }),
        ]),
      ),
    ],
  ])("returns null for %s", (_label, body) => {
    expect(decodeWatchlist(body)).toBeNull();
  });

  it("drops an address that is not https instead of trusting it", () => {
    const edited = encodeWatchlist(list([entry(1)])).replace(
      "https://tool1.example.dev/",
      "http://tool1.example.dev/",
    );
    expect(decodeWatchlist(edited)?.tracked[0]?.homepage).toBeNull();
  });
});

describe("the visible part", () => {
  it("shows the top 20 by score with names in code spans", () => {
    const entries = Array.from({ length: 30 }, (_, n) =>
      entry(n, { score: n, name: n === 29 ? "@everyone `#1`" : `Tool ${n}` }),
    );
    const { body } = fitWatchlist(list(entries), view);
    const rows = body.split("\n").filter((line) => /^\| \d+ \|/.test(line));
    expect(rows).toHaveLength(config.watchlist.summaryRows);
    expect(rows[0]).toMatch(/^\| 1 \| `@everyone '#1'` \|/);
    expect(body).not.toContain("| `Tool 3` |");
  });

  it("keeps candidate text out of mentions, references and links", () => {
    const { body } = fitWatchlist(
      list([entry(1, { name: "@octocat #12 [x](https://evil.example)" })]),
      view,
    );
    const visible = body
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/`[^`\n]*`/g, "");
    expect(visible).not.toMatch(/@\w/);
    expect(visible).not.toMatch(/#\d/);
    expect(visible).not.toMatch(/\]\(/);
  });

  it("states this run's counts and says it is edited, not commented on", () => {
    const { body } = fitWatchlist(list([entry(1)]), view);
    expect(body).toContain("3 added, 1 expired, 0 ready, 0 given an issue");
    expect(body).toContain("edited in place");
  });
});

describe("the size limit", () => {
  it("holds a full watchlist of typical entries without trimming", () => {
    const entries = Array.from(
      { length: config.watchlist.maxTracked },
      (_, n) => entry(n),
    );
    const rendered = fitWatchlist(list(entries), view);
    expect(rendered.trimmed).toBe(0);
    expect(rendered.body.length).toBeLessThan(config.watchlist.maxBodyChars);
    expect(rendered.body.length).toBeLessThan(65536);
  });

  it("drops the lowest scores first when entries are unusually large", () => {
    const long = "x".repeat(180);
    const entries = Array.from({ length: 100 }, (_, n) =>
      entry(n, {
        score: n,
        homepage: `https://example.com/${long}`,
        repository: `https://example.com/${long}`,
        announcement: `https://example.com/${long}`,
        sources: [
          { source: "github", url: `https://example.com/${long}` },
          { source: "hackernews", url: `https://example.com/${long}` },
          { source: "news", url: `https://example.com/${long}` },
        ],
        keys: [long.slice(0, 100), long.slice(0, 100), long.slice(0, 100)],
      }),
    );
    const rendered = fitWatchlist(list(entries), view);
    expect(rendered.body.length).toBeLessThanOrEqual(
      config.watchlist.maxBodyChars,
    );
    expect(rendered.trimmed).toBeGreaterThan(0);
    const kept = rendered.watchlist.tracked.map((item) => item.score);
    expect(Math.min(...kept)).toBeGreaterThan(0);
    expect(kept).toContain(99);
    expect(decodeWatchlist(rendered.body)?.tracked.length).toBe(
      rendered.watchlist.tracked.length,
    );
  });

  it("trims the expired list too when it alone is too long", () => {
    const expired = Array.from({ length: 900 }, (_, n) => ({
      id: `gone-${n}`,
      keys: [`repo:github.com/maker/${"y".repeat(100)}-${n}`],
      until: `2027-01-${String((n % 28) + 1).padStart(2, "0")}`,
    }));
    const small = {
      ...view,
      config: {
        ...config,
        watchlist: { ...config.watchlist, maxBodyChars: 8000 },
      },
    };
    const rendered = fitWatchlist(list([], expired), small);
    expect(rendered.body.length).toBeLessThanOrEqual(8000);
    expect(rendered.watchlist.expired.length).toBeLessThan(900);
  });
});

describe("the expired list", () => {
  it("blocks re-adding until the date, then lets go", () => {
    const gone = { id: "x", keys: [], until: "2027-04-09" };
    expect(isExpiredNow(gone, "2026-10-10")).toBe(true);
    expect(isExpiredNow(gone, "2027-04-09")).toBe(false);
  });

  it("starts empty", () => {
    expect(emptyWatchlist("2026-10-10")).toEqual({
      version: 1,
      updated: "2026-10-10",
      tracked: [],
      expired: [],
    });
  });
});
