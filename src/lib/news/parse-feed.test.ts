import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  MAX_FEED_CHARS,
  parseFeed,
  SUMMARY_LENGTH,
  TITLE_LENGTH,
} from "./parse-feed";
import { createToolMatcher } from "./tool-match";
import type { NewsSource } from "./types";

const NOW = Date.UTC(2026, 9, 10, 12, 0, 0);

function fixture(name: string): string {
  return readFileSync(
    resolve(process.cwd(), "src/lib/news/fixtures", name),
    "utf8",
  );
}

const source: NewsSource = {
  id: "example",
  name: "Example Labs",
  feedUrl: "https://example.com/feed.xml",
  homepage: "https://example.com/news",
  officialDomains: ["example.com"],
  toolIds: ["example-tool"],
  defaultTag: "other",
};

const releases: NewsSource = {
  ...source,
  id: "example-releases",
  feedUrl: "https://example.com/org/tool/releases.atom",
  officialDomains: ["example.com/org"],
  defaultTag: "feature-update",
};

const matchTools = createToolMatcher([
  { id: "example-model", name: "Example Model" },
]);

function parse(xml: string, from: NewsSource = source) {
  return parseFeed(xml, from, { now: NOW, matchTools });
}

describe("parseFeed: RSS 2.0", () => {
  const items = parse(fixture("rss2.xml"))!;

  it("returns items newest first and drops those older than 60 days", () => {
    expect(items.map((item) => item.title)).toEqual([
      "Introducing Example Model 2",
      "Same story, different headline",
      "A very long summary",
      "Pricing update: new plans for teams",
    ]);
  });

  it("strips HTML from a CDATA description", () => {
    expect(items[0]?.summary).toBe(
      "Example Model 2 is faster and cheaper. Read the details.",
    );
  });

  it("decodes an entity-encoded description once, then strips it", () => {
    const pricing = items.find((item) => item.title.startsWith("Pricing"));
    expect(pricing?.summary).toBe("Teams & individuals get new plans.");
  });

  it("trims long summaries to 160 characters at a word boundary", () => {
    const long = items.find((item) => item.title === "A very long summary")!;
    expect(long.summary.length).toBeLessThanOrEqual(SUMMARY_LENGTH);
    expect(long.summary.endsWith("…")).toBe(true);
    expect(long.summary).not.toMatch(/ …$/);
  });

  it("reads dc:date, drops the fragment and keeps the source fields", () => {
    const duplicate = items[1]!;
    expect(duplicate.url).toBe("https://example.com/news/example-model-2");
    expect(duplicate.sourceId).toBe("example");
    expect(duplicate.sourceName).toBe("Example Labs");
    expect(
      items.find((item) => item.title === "A very long summary")?.publishedAt,
    ).toBe("2026-10-09T12:00:00.000Z");
  });

  it("attaches the source's tools and any catalogue tool named in the title", () => {
    expect(items[0]?.toolIds).toEqual(["example-tool", "example-model"]);
    expect(items[2]?.toolIds).toEqual(["example-tool"]);
  });

  it("tags from the title and falls back to the source default", () => {
    expect(items[0]?.tag).toBe("new-tool");
    expect(items.find((i) => i.title.startsWith("Pricing"))?.tag).toBe(
      "pricing",
    );
    expect(items[2]?.tag).toBe("other");
  });
});

describe("parseFeed: Atom", () => {
  const items = parse(fixture("atom.xml"), releases)!;

  it("uses the alternate link and not the self link", () => {
    expect(items.map((item) => item.url)).toEqual([
      "https://example.com/org/tool/releases/tag/v2.0.0",
      "https://example.com/org/tool/releases/tag/v1.9.0",
    ]);
  });

  it("skips pre-releases in a releases feed", () => {
    expect(items.some((item) => item.title.includes("rc.1"))).toBe(false);
  });

  it("keeps pre-releases in other feeds", () => {
    const all = parse(fixture("atom.xml"), {
      ...releases,
      feedUrl: "https://example.com/org/tool/feed.atom",
    })!;
    expect(all).toHaveLength(3);
  });

  it("strips escaped HTML from titles and content", () => {
    expect(items[1]?.title).toBe("Version 1.9.0");
    expect(items[0]?.summary).toBe("What's changed Added a new export option");
  });

  it("prefers published over updated", () => {
    expect(items[1]?.publishedAt).toBe("2026-09-20T06:00:00.000Z");
  });
});

describe("parseFeed: bad input", () => {
  it("returns what it can from malformed XML", () => {
    const items = parse(fixture("malformed.xml"))!;
    expect(items.map((item) => item.title)).toEqual(["First complete item"]);
    expect(items[0]?.summary).toBe("Fine so far");
  });

  it("returns null for text that is not a feed", () => {
    expect(
      parse("<!doctype html><html><body>Sign in</body></html>"),
    ).toBeNull();
    expect(parse("")).toBeNull();
  });

  it("returns an empty list for a feed with no items", () => {
    expect(parse('<rss version="2.0"><channel></channel></rss>')).toEqual([]);
  });

  describe("hostile feed", () => {
    const items = parse(fixture("hostile.xml"))!;

    it("keeps only the safe items", () => {
      expect(items.map((item) => item.url)).toEqual([
        "https://example.com/news/safe",
        "https://www.example.com/news/survivor",
      ]);
    });

    it("renders titles and summaries as plain text", () => {
      expect(items[0]?.title).toBe("Safe headline");
      expect(items[0]?.summary).toBe("Visible text &secret; &lol2;");
      for (const item of items) {
        expect(`${item.title} ${item.summary}`).not.toMatch(/[<>]|script/i);
      }
    });

    it("never resolves entities declared in a DTD", () => {
      expect(JSON.stringify(items)).not.toContain("lollol");
      expect(JSON.stringify(items)).not.toContain("passwd");
    });

    it("decodes valid numeric references and leaves invalid ones as text", () => {
      expect(items[1]?.title).toBe(
        "Survivor with 😀 emoji and &#xFFFFFFF; bad reference",
      );
    });
  });

  it("limits titles to 200 characters", () => {
    const long = "word ".repeat(100);
    const xml = `<rss><channel><item><title>${long}</title><link>https://example.com/a</link><pubDate>Fri, 09 Oct 2026 10:00:00 GMT</pubDate></item></channel></rss>`;
    expect(parse(xml)![0]!.title.length).toBeLessThanOrEqual(TITLE_LENGTH);
  });
});

describe("parseFeed: very large feeds", () => {
  it("parses thousands of entries quickly and keeps the newest 30", () => {
    const entry = (index: number) =>
      `<item><title>Story ${index}</title><link>https://example.com/n/${index}</link><pubDate>${new Date(
        NOW - index * 60_000,
      ).toUTCString()}</pubDate><description>${"filler ".repeat(40)}</description></item>`;
    const xml = `<rss><channel>${Array.from({ length: 6000 }, (_, i) =>
      entry(i + 1),
    ).join("")}</channel></rss>`;
    expect(xml.length).toBeGreaterThan(1_000_000);

    const started = performance.now();
    const items = parse(xml)!;
    expect(performance.now() - started).toBeLessThan(2000);
    expect(items).toHaveLength(30);
    expect(items[0]?.title).toBe("Story 1");
  });

  it("does not slow down on thousands of unclosed elements", () => {
    const xml = `<rss><channel>${"<item><title>x".repeat(20_000)}</channel></rss>`;
    const started = performance.now();
    expect(parse(xml) ?? []).toEqual([]);
    expect(performance.now() - started).toBeLessThan(1000);
  });
});

function feedWith(inner: string, extra = ""): string {
  return `<rss version="2.0" ${extra}><channel>${inner}</channel></rss>`;
}

const DATE = "<pubDate>Fri, 09 Oct 2026 10:00:00 GMT</pubDate>";

function one(entryInner: string, extra = "") {
  return parse(feedWith(`<item>${entryInner}${DATE}</item>`, extra))?.[0];
}

describe("parseFeed: CDATA, namespaces and entities", () => {
  it("reads CDATA in titles, links and descriptions as raw text", () => {
    const item = one(
      "<title><![CDATA[Fish & chips <i>today</i>]]></title><link><![CDATA[https://example.com/a?x=1&y=2]]></link><description><![CDATA[<p>Hello &amp; welcome</p>]]></description>",
    );
    expect(item?.title).toBe("Fish & chips today");
    expect(item?.url).toBe("https://example.com/a?x=1&y=2");
    expect(item?.summary).toBe("Hello & welcome");
  });

  it("joins text and CDATA parts of one element", () => {
    const item = one(
      "<title>Before <![CDATA[<b>after</b>]]></title><link>https://example.com/a</link>",
    );
    expect(item?.title).toBe("Before after");
  });

  it("reads namespaced elements and ignores same-named ones from other namespaces", () => {
    const xml = feedWith(
      `<item><title>Namespaced</title><atom:link href="https://example.org/self" rel="self"/><link>https://example.com/ns</link><dc:date>2026-10-09T12:00:00Z</dc:date><content:encoded><![CDATA[<p>Full text here</p>]]></content:encoded></item>`,
      'xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/"',
    );
    const item = parse(xml)?.[0];
    expect(item?.url).toBe("https://example.com/ns");
    expect(item?.publishedAt).toBe("2026-10-09T12:00:00.000Z");
    expect(item?.summary).toBe("Full text here");
  });

  it("decodes numeric references, decimal and hex", () => {
    const item = one(
      "<title>Caf&#233; &#x2014; &#8220;quoted&#8221; &#128640;</title><link>https://example.com/n</link>",
    );
    expect(item?.title).toBe("Café — “quoted” 🚀");
  });

  it("decodes standard and common HTML entities in titles", () => {
    const item = one(
      "<title>Tom &amp; Jerry&apos;s &quot;live&quot; &nbsp;it&rsquo;s here&hellip;</title><link>https://example.com/h</link>",
    );
    expect(item?.title).toBe('Tom & Jerry\'s "live" it’s here…');
  });

  it("strips markup that only appears once entities are decoded", () => {
    const item = one(
      "<title>&lt;b&gt;Bold&lt;/b&gt; &lt;script&gt;alert(1)&lt;/script&gt;claim</title><link>https://example.com/m</link>",
    );
    expect(item?.title).toBe("Bold claim");
  });

  it("leaves unknown entities as text and never expands declared ones", () => {
    const xml =
      '<?xml version="1.0"?><!DOCTYPE rss [<!ENTITY x "EXPANDED">]>' +
      feedWith(
        `<item><title>Value &x; &unknown;</title><link>https://example.com/e</link>${DATE}</item>`,
      );
    expect(parse(xml)?.[0]?.title).toBe("Value &x; &unknown;");
  });

  it("reads Atom links through their attributes in either order", () => {
    const xml = `<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>A</title><link href="https://example.com/org/tool/releases/tag/a" rel="alternate"/><updated>2026-10-09T10:00:00Z</updated></entry></feed>`;
    expect(parse(xml, releases)?.[0]?.url).toBe(
      "https://example.com/org/tool/releases/tag/a",
    );
  });
});

describe("parseFeed: limits", () => {
  it("ignores text past the size limit before parsing", () => {
    const entry = (slug: string) =>
      `<item><title>${slug}</title><link>https://example.com/${slug}</link>${DATE}</item>`;
    const padding = `<!-- ${"x".repeat(MAX_FEED_CHARS)} -->`;
    const xml = feedWith(entry("kept") + padding + entry("beyond"));
    const items = parse(xml) ?? [];
    expect(items.map((item) => item.title)).toEqual(["kept"]);
  });

  it("keeps the complete entries of a feed that was cut off", () => {
    const entry = (slug: string) =>
      `<item><title>${slug}</title><link>https://example.com/${slug}</link>${DATE}</item>`;
    const xml = `<rss><channel>${entry("one")}${entry("two")}<item><title>thr`;
    expect(parse(xml)?.map((item) => item.title)).toEqual(["one", "two"]);
  });

  it("refuses very deep nesting", () => {
    expect(parse(`<rss>${"<a>".repeat(5000)}`)).toBeNull();
  });
});
