import { describe, expect, it } from "vitest";
import { catalogue } from "@/data/catalogue";
import sourcesData from "@/data/news/sources.json";
import { isOnToolDomain } from "@/lib/catalogue/links";
import { parseSources, newsSourceSchema } from "./sources";

describe("sources.json", () => {
  const sources = parseSources(sourcesData);
  const toolIds = new Set(catalogue.tools.map((tool) => tool.id));

  it("lists between 15 and 40 sources", () => {
    expect(sources.length).toBeGreaterThanOrEqual(15);
    expect(sources.length).toBeLessThanOrEqual(40);
  });

  it("only names tools that exist in the catalogue", () => {
    for (const source of sources) {
      for (const toolId of source.toolIds) {
        expect(toolIds.has(toolId), `${source.id}: ${toolId}`).toBe(true);
      }
    }
  });

  it("uses https feeds and homepages on the source's own domains", () => {
    for (const source of sources) {
      expect(new URL(source.feedUrl).protocol).toBe("https:");
      expect(isOnToolDomain(source.feedUrl, source.officialDomains)).toBe(true);
      expect(isOnToolDomain(source.homepage, source.officialDomains)).toBe(
        true,
      );
    }
  });

  it("has no query tracking or credentials in feed addresses", () => {
    for (const source of sources) {
      const url = new URL(source.feedUrl);
      expect(url.username).toBe("");
      expect(url.hash).toBe("");
    }
  });
});

describe("newsSourceSchema", () => {
  const valid = {
    id: "example",
    name: "Example",
    feedUrl: "https://example.com/feed.xml",
    homepage: "https://example.com/",
    officialDomains: ["example.com"],
    toolIds: [],
    defaultTag: "other",
  };

  it("accepts a well-formed source", () => {
    expect(newsSourceSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects http feeds", () => {
    expect(
      newsSourceSchema.safeParse({
        ...valid,
        feedUrl: "http://example.com/feed.xml",
      }).success,
    ).toBe(false);
  });

  it("rejects a feed outside the official domains", () => {
    expect(
      newsSourceSchema.safeParse({
        ...valid,
        feedUrl: "https://aggregator.example.net/example.xml",
      }).success,
    ).toBe(false);
  });

  it("rejects unknown fields and unknown tags", () => {
    expect(newsSourceSchema.safeParse({ ...valid, extra: true }).success).toBe(
      false,
    );
    expect(
      newsSourceSchema.safeParse({ ...valid, defaultTag: "rumour" }).success,
    ).toBe(false);
  });

  it("rejects duplicate ids and feeds", () => {
    expect(() => parseSources([valid, valid])).toThrow();
    expect(() => parseSources([valid, { ...valid, id: "other" }])).toThrow();
  });
});
