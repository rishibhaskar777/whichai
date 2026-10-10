import { describe, expect, it } from "vitest";
import { buildPlan } from "@/lib/engine/build-plan";
import { requestFor } from "@/test/seed";
import { newsItem } from "@/test/news";
import { plansAffectedBy, toolIdsOfPlan } from "./affects-plans";
import {
  hasActiveNewsFilters,
  NEWS_PAGE_SIZE,
  newsHref,
  parseNewsQuery,
  queryNews,
} from "./query";
import { isNewItem, newsForTool, panelItems } from "./select";

const NOW = Date.parse("2026-10-10T12:00:00.000Z");

describe("panelItems", () => {
  it("takes the six newest, at most two from one source", () => {
    const items = [
      ...Array.from({ length: 5 }, (_, i) =>
        newsItem({
          id: `a${i}`,
          url: `https://a.example/${i}`,
          sourceId: "a",
        }),
      ),
      ...Array.from({ length: 6 }, (_, i) =>
        newsItem({
          id: `b${i}`,
          url: `https://b.example/${i}`,
          sourceId: `b${i}`,
        }),
      ),
    ];
    const picked = panelItems(items);
    expect(picked).toHaveLength(6);
    expect(picked.filter((item) => item.sourceId === "a")).toHaveLength(2);
    expect(picked.map((item) => item.id).slice(0, 2)).toEqual(["a0", "a1"]);
  });

  it("returns fewer when there are fewer", () => {
    expect(panelItems([newsItem()])).toHaveLength(1);
    expect(panelItems([])).toEqual([]);
  });
});

describe("isNewItem", () => {
  it("is true under 24 hours old and false from 24 hours on", () => {
    const at = (ms: number) =>
      newsItem({ publishedAt: new Date(NOW - ms).toISOString() });
    expect(isNewItem(at(23 * 3_600_000), NOW)).toBe(true);
    expect(isNewItem(at(24 * 3_600_000), NOW)).toBe(false);
    expect(isNewItem(at(-1000), NOW)).toBe(false);
  });
});

describe("newsForTool", () => {
  it("returns the newest items that name the tool, up to the limit", () => {
    const items = Array.from({ length: 8 }, (_, i) =>
      newsItem({
        id: `n${i}`,
        url: `https://x.example/${i}`,
        toolIds: i % 2 === 0 ? ["cursor"] : ["claude"],
      }),
    );
    expect(newsForTool(items, "cursor").map((item) => item.id)).toEqual([
      "n0",
      "n2",
      "n4",
      "n6",
    ]);
    expect(newsForTool(items, "cursor", 2)).toHaveLength(2);
    expect(newsForTool(items, "unknown")).toEqual([]);
  });
});

describe("parseNewsQuery", () => {
  const sources = ["openai-news", "cursor-changelog"];

  it("reads valid values", () => {
    expect(
      parseNewsQuery(
        { q: "  gpt  5 ", tag: "pricing", source: "openai-news", page: "3" },
        sources,
      ),
    ).toEqual({ q: "gpt 5", tag: "pricing", source: "openai-news", page: 3 });
  });

  it("falls back to defaults for anything unknown", () => {
    expect(
      parseNewsQuery(
        { tag: "nope", source: "<script>", page: "-4", q: ["a", "b"] },
        sources,
      ),
    ).toEqual({ q: "a", tag: null, source: null, page: 1 });
  });

  it("limits the search text", () => {
    expect(parseNewsQuery({ q: "x".repeat(500) }, sources).q).toHaveLength(80);
  });
});

describe("queryNews", () => {
  const items = Array.from({ length: 45 }, (_, i) =>
    newsItem({
      id: `n${i}`,
      url: `https://x.example/${i}`,
      title: i % 3 === 0 ? `Cursor update ${i}` : `Other story ${i}`,
      tag: i % 2 === 0 ? "feature-update" : "pricing",
      sourceId: i % 5 === 0 ? "cursor-changelog" : "openai-news",
      summary: "",
    }),
  );
  const base = { q: "", tag: null, source: null, page: 1 } as const;

  it("paginates", () => {
    const first = queryNews(items, base);
    expect(first.pageItems).toHaveLength(NEWS_PAGE_SIZE);
    expect(first.pageCount).toBe(3);
    const last = queryNews(items, { ...base, page: 3 });
    expect(last.pageItems).toHaveLength(5);
  });

  it("clamps a page past the end", () => {
    expect(queryNews(items, { ...base, page: 99 }).page).toBe(3);
  });

  it("filters by tag, source and search together", () => {
    const result = queryNews(items, {
      q: "cursor",
      tag: "feature-update",
      source: "cursor-changelog",
      page: 1,
    });
    expect(
      result.matches.every(
        (item) =>
          item.title.includes("Cursor") &&
          item.tag === "feature-update" &&
          item.sourceId === "cursor-changelog",
      ),
    ).toBe(true);
    expect(result.matches.length).toBeGreaterThan(0);
  });

  it("searches case-insensitively in title and source name", () => {
    expect(queryNews(items, { ...base, q: "CURSOR UPDATE 3" }).matches[0]).toBe(
      items[3],
    );
    expect(
      queryNews(items, { ...base, q: "example labs" }).matches,
    ).toHaveLength(45);
  });

  it("returns one empty page when nothing matches", () => {
    const result = queryNews(items, { ...base, q: "zzz" });
    expect(result).toMatchObject({ matches: [], pageItems: [], pageCount: 1 });
  });
});

describe("news URLs", () => {
  it("leaves out defaults and keeps filters when paging", () => {
    const query = { q: "gpt", tag: "pricing", source: null, page: 1 } as const;
    expect(newsHref(query)).toBe("/what-changed?q=gpt&tag=pricing");
    expect(newsHref(query, { page: 2 })).toBe(
      "/what-changed?q=gpt&tag=pricing&page=2",
    );
    expect(newsHref({ ...query, q: "", tag: null })).toBe("/what-changed");
    expect(hasActiveNewsFilters(query)).toBe(true);
    expect(
      hasActiveNewsFilters({ q: "", tag: null, source: null, page: 4 }),
    ).toBe(false);
  });
});

describe("Affects your plans", () => {
  const request = requestFor("portfolio website with animations");
  const plan = buildPlan(request.goal, {
    level: request.level,
    budget: null,
    toolsUsed: new Set(),
  });

  it("collects the tools a plan puts forward at every level", () => {
    const ids = toolIdsOfPlan(plan, []);
    for (const level of Object.values(plan.levels)) {
      for (const job of level.jobs) expect(ids.has(job.toolId)).toBe(true);
    }
    expect(ids.size).toBeGreaterThan(2);
  });

  it("includes tools the person said they already use", () => {
    expect(toolIdsOfPlan(plan, ["my-own-tool"]).has("my-own-tool")).toBe(true);
  });

  it("matches an item to the plans that share a tool", () => {
    const [first] = [...toolIdsOfPlan(plan, [])];
    const plans = [
      { id: "p1", title: "Portfolio", toolIds: toolIdsOfPlan(plan, []) },
      { id: "p2", title: "Other", toolIds: new Set(["unrelated"]) },
    ];
    expect(
      plansAffectedBy([first!, "something-else"], plans).map((p) => p.id),
    ).toEqual(["p1"]);
  });

  it("matches nothing for an item with no tools or no plans", () => {
    expect(
      plansAffectedBy([], [{ id: "p", title: "P", toolIds: new Set(["a"]) }]),
    ).toEqual([]);
    expect(plansAffectedBy(["a"], [])).toEqual([]);
  });
});
