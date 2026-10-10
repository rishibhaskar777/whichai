import { describe, expect, it, vi } from "vitest";
import { createNewsService, mergeItems, REFRESH_INTERVAL_MS } from "./service";
import { createToolMatcher } from "./tool-match";
import type { NewsItem, NewsSource } from "./types";

const START = Date.UTC(2026, 9, 10, 12, 0, 0);
const MINUTE = 60_000;

function source(id: string, domain = `${id}.example`): NewsSource {
  return {
    id,
    name: id.toUpperCase(),
    feedUrl: `https://${domain}/feed.xml`,
    homepage: `https://${domain}/`,
    officialDomains: [domain],
    toolIds: [`${id}-tool`],
    defaultTag: "other",
  };
}

function rss(domain: string, ...stories: [string, string][]): string {
  const items = stories
    .map(
      ([slug, published]) =>
        `<item><title>Story ${slug}</title><link>https://${domain}/${slug}</link><pubDate>${published}</pubDate></item>`,
    )
    .join("");
  return `<rss><channel>${items}</channel></rss>`;
}

function setup(responses: Record<string, string | Error>) {
  const clock = { now: START };
  const warn = vi.fn();
  const fetchText = vi.fn(async (url: string) => {
    const response = responses[url];
    if (response === undefined) throw new Error("unexpected url");
    if (response instanceof Error) throw response;
    return response;
  });
  const service = createNewsService({
    sources: [source("a"), source("b")],
    matchTools: createToolMatcher([]),
    fetchText,
    now: () => clock.now,
    warn,
  });
  return { clock, warn, fetchText, service, responses };
}

const AGO_1H = new Date(START - 60 * MINUTE).toUTCString();
const AGO_2H = new Date(START - 120 * MINUTE).toUTCString();

describe("createNewsService", () => {
  it("fetches every feed once and merges the items newest first", async () => {
    const { service, fetchText } = setup({
      "https://a.example/feed.xml": rss("a.example", ["one", AGO_2H]),
      "https://b.example/feed.xml": rss("b.example", ["two", AGO_1H]),
    });
    const snapshot = await service.get();
    expect(fetchText).toHaveBeenCalledTimes(2);
    expect(snapshot.items.map((item) => item.title)).toEqual([
      "Story two",
      "Story one",
    ]);
    expect(snapshot.allFailed).toBe(false);
    expect(snapshot.lastUpdated).toBe(new Date(START).toISOString());
    expect(snapshot.sources).toEqual([
      { id: "a", name: "A" },
      { id: "b", name: "B" },
    ]);
  });

  it("serves from the cache for 30 minutes", async () => {
    const { service, fetchText, clock } = setup({
      "https://a.example/feed.xml": rss("a.example", ["one", AGO_1H]),
      "https://b.example/feed.xml": rss("b.example", ["two", AGO_2H]),
    });
    await service.get();
    clock.now += REFRESH_INTERVAL_MS - 1;
    await service.get();
    expect(fetchText).toHaveBeenCalledTimes(2);
  });

  it("refreshes in the background after 30 minutes and answers at once", async () => {
    const { service, fetchText, clock, responses } = setup({
      "https://a.example/feed.xml": rss("a.example", ["one", AGO_1H]),
      "https://b.example/feed.xml": rss("b.example", ["two", AGO_2H]),
    });
    await service.get();
    responses["https://a.example/feed.xml"] = rss(
      "a.example",
      ["fresh", new Date(START).toUTCString()],
      ["one", AGO_1H],
    );
    clock.now += REFRESH_INTERVAL_MS;

    const stale = await service.get();
    expect(stale.items.map((item) => item.title)).not.toContain("Story fresh");
    expect(fetchText).toHaveBeenCalledTimes(4);

    await Promise.resolve();
    await Promise.resolve();
    const fresh = await service.get();
    expect(fresh.items.map((item) => item.title)).toContain("Story fresh");
  });

  it("shares one refresh between concurrent callers", async () => {
    const { service, fetchText } = setup({
      "https://a.example/feed.xml": rss("a.example", ["one", AGO_1H]),
      "https://b.example/feed.xml": rss("b.example", ["two", AGO_2H]),
    });
    await Promise.all([service.get(), service.get(), service.get()]);
    expect(fetchText).toHaveBeenCalledTimes(2);
  });

  it("keeps a failing feed's last good items and warns once", async () => {
    const { service, clock, responses, warn } = setup({
      "https://a.example/feed.xml": rss("a.example", ["one", AGO_1H]),
      "https://b.example/feed.xml": rss("b.example", ["two", AGO_2H]),
    });
    await service.get();

    responses["https://a.example/feed.xml"] = new Error("HTTP 503");
    for (let round = 0; round < 3; round += 1) {
      clock.now += REFRESH_INTERVAL_MS;
      await service.get();
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    const snapshot = await service.get();
    expect(snapshot.items.map((item) => item.title)).toContain("Story one");
    expect(snapshot.allFailed).toBe(false);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain("a: HTTP 503");
  });

  it("treats a page that is not a feed as a failure", async () => {
    const { service, warn } = setup({
      "https://a.example/feed.xml": "<html>Please sign in</html>",
      "https://b.example/feed.xml": rss("b.example", ["two", AGO_2H]),
    });
    const snapshot = await service.get();
    expect(snapshot.items).toHaveLength(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("not a feed"));
  });

  it("reports every feed failing without throwing", async () => {
    const { service } = setup({
      "https://a.example/feed.xml": new Error("timeout"),
      "https://b.example/feed.xml": new Error("timeout"),
    });
    const snapshot = await service.get();
    expect(snapshot.items).toEqual([]);
    expect(snapshot.allFailed).toBe(true);
    expect(snapshot.lastUpdated).toBeNull();
  });

  it("keeps the last successful time after everything starts failing", async () => {
    const { service, clock, responses } = setup({
      "https://a.example/feed.xml": rss("a.example", ["one", AGO_1H]),
      "https://b.example/feed.xml": rss("b.example", ["two", AGO_2H]),
    });
    await service.get();
    responses["https://a.example/feed.xml"] = new Error("down");
    responses["https://b.example/feed.xml"] = new Error("down");
    clock.now += REFRESH_INTERVAL_MS;
    await service.get();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const snapshot = await service.get();
    expect(snapshot.allFailed).toBe(true);
    expect(snapshot.lastUpdated).toBe(new Date(START).toISOString());
    expect(snapshot.items).toHaveLength(2);
  });

  it("ages old items out of the cache without a refetch", async () => {
    const { service, clock } = setup({
      "https://a.example/feed.xml": rss("a.example", ["one", AGO_1H]),
      "https://b.example/feed.xml": rss("b.example", ["two", AGO_2H]),
    });
    await service.get();
    clock.now += 61 * 24 * 60 * MINUTE;
    const snapshot = await service.get();
    expect(snapshot.items).toEqual([]);
  });
});

describe("mergeItems", () => {
  const item = (url: string, publishedAt: string): NewsItem => ({
    id: url,
    title: url,
    url,
    publishedAt,
    sourceId: "s",
    sourceName: "S",
    summary: "",
    tag: "other",
    toolIds: [],
  });

  it("de-duplicates by link, keeping the first and sorting newest first", () => {
    const merged = mergeItems(
      [
        [
          item("https://x.example/1", "2026-10-09T00:00:00Z"),
          item("https://x.example/2", "2026-10-10T00:00:00Z"),
        ],
        [item("https://x.example/1", "2026-10-08T00:00:00Z")],
      ],
      START,
    );
    expect(merged.map((entry) => entry.url)).toEqual([
      "https://x.example/2",
      "https://x.example/1",
    ]);
    expect(merged[1]?.publishedAt).toBe("2026-10-09T00:00:00Z");
  });

  it("drops future-dated and expired items", () => {
    const merged = mergeItems(
      [
        [
          item("https://x.example/future", "2026-10-11T00:00:00Z"),
          item("https://x.example/old", "2026-07-01T00:00:00Z"),
          item("https://x.example/ok", "2026-10-09T00:00:00Z"),
        ],
      ],
      START,
    );
    expect(merged.map((entry) => entry.url)).toEqual(["https://x.example/ok"]);
  });
});
