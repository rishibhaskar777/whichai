import { describe, expect, it } from "vitest";
import configJson from "@/data/discovery/config.json";
import githubFixture from "./fixtures/github-search.json";
import hackerNewsFixture from "./fixtures/hackernews.json";
import modelsFixture from "./fixtures/huggingface-models.json";
import spacesFixture from "./fixtures/huggingface-spaces.json";
import { cleanCandidate } from "./clean";
import { parseConfig } from "./config";
import { SourceError, type JsonClient } from "./http";
import { fromAnnouncement, fromShowHn } from "./names";
import { fetchGithub, parseSearch, searchUrl } from "./sources/github";
import {
  fetchHackerNews,
  parseHits,
  searchUrl as hackerNewsUrl,
} from "./sources/hackernews";
import { fetchHuggingFace, parseList } from "./sources/huggingface";
import { fetchNews, toCandidate } from "./sources/news";
import type { NewsItem, NewsSource } from "../news/types";

const config = parseConfig(configJson);
const NOW = new Date("2026-10-10T12:00:00Z");

describe("GitHub", () => {
  const found = parseSearch(githubFixture);
  const names = found.map((entry) => entry.name);

  it("extracts candidates with their stars and maker", () => {
    const magpie = found.find((entry) => entry.name === "magpie")!;
    expect(magpie.maintainer).toBe("yetone");
    expect(magpie.signals.githubStars).toBe(1450);
    expect(magpie.repository).toBe("https://github.com/yetone/magpie");
    expect(magpie.homepage).toBe("https://magpie.example.dev");
    expect(magpie.kindHint).toBe("cli");
  });

  it("skips forks, archived repositories, lists and malformed items", () => {
    expect(names).not.toContain("forked-thing");
    expect(names).not.toContain("old-project");
    expect(names).not.toContain("awesome-llm-apps");
    expect(found).toHaveLength(3);
  });

  it("tolerates a missing description and an empty homepage", () => {
    const plain = found.find((entry) => entry.name === "plain-tool")!;
    expect(plain.description).toBe("");
    expect(cleanCandidate(plain)?.homepage).toBeNull();
  });

  it("keeps hostile text out of the cleaned candidate", () => {
    const hostile = found.find((entry) => entry.name === "hostile")!;
    const clean = cleanCandidate(hostile)!;
    expect(clean.homepage).toBeNull();
    expect(clean.description).not.toMatch(/[<>`\n‮]/);
  });

  it("returns nothing for a response that is not a search result", () => {
    expect(parseSearch({ message: "rate limited" })).toEqual([]);
    expect(parseSearch(null)).toEqual([]);
  });

  it("builds a search for recent, starred repositories of one topic", () => {
    const url = new URL(searchUrl("llm", "2026-06-12", config));
    expect(url.origin).toBe("https://api.github.com");
    expect(url.searchParams.get("q")).toBe(
      "topic:llm created:>2026-06-12 stars:>=100",
    );
    expect(url.searchParams.get("sort")).toBe("stars");
  });

  it("sends the token to api.github.com only and one query per topic", async () => {
    const calls: { url: string; headers: Record<string, string> }[] = [];
    const client: JsonClient = {
      async getJson(url, headers = {}) {
        calls.push({ url, headers });
        return githubFixture;
      },
    };
    const result = await fetchGithub(client, config, NOW, "secret-token");
    expect(result.ok).toBe(true);
    expect(calls).toHaveLength(config.github.topics.length);
    for (const call of calls) {
      expect(new URL(call.url).hostname).toBe("api.github.com");
      expect(call.headers.authorization).toBe("Bearer secret-token");
    }
  });

  it("works without a token", async () => {
    const headers: Record<string, string>[] = [];
    const client: JsonClient = {
      async getJson(_url, sent = {}) {
        headers.push(sent);
        return githubFixture;
      },
    };
    await fetchGithub(client, config, NOW);
    expect(headers.every((entry) => entry.authorization === undefined)).toBe(
      true,
    );
  });

  it("is skipped, keeping earlier results, when the API refuses", async () => {
    let calls = 0;
    const client: JsonClient = {
      async getJson() {
        calls += 1;
        if (calls > 1)
          throw new SourceError("rate limited or refused (HTTP 403)");
        return githubFixture;
      },
    };
    const result = await fetchGithub(client, config, NOW);
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.error).toContain("403");
  });

  it("reports failure when the first request fails", async () => {
    const client: JsonClient = {
      async getJson() {
        throw new SourceError("HTTP 500");
      },
    };
    const result = await fetchGithub(client, config, NOW);
    expect(result.ok).toBe(false);
    expect(result.items).toEqual([]);
  });
});

describe("Hugging Face", () => {
  it("keeps new, liked, original models", () => {
    const found = parseList(modelsFixture, "model", config, NOW);
    expect(found.map((entry) => entry.name)).toEqual(["embeddinggemma-2"]);
    const model = found[0]!;
    expect(model.maintainer).toBe("google");
    expect(model.signals).toEqual({ hfLikes: 1459, hfDownloads: 45605 });
    expect(model.kindHint).toBe("model");
    expect(model.repository).toBe(
      "https://huggingface.co/google/embeddinggemma-2",
    );
  });

  it("drops fine-tunes, quantisations, private, old and unliked items", () => {
    const found = parseList(modelsFixture, "model", config, NOW);
    expect(found).toHaveLength(1);
  });

  it("reads Spaces with their own address", () => {
    const found = parseList(spacesFixture, "space", config, NOW);
    expect(found).toHaveLength(1);
    expect(found[0]!.repository).toBe(
      "https://huggingface.co/spaces/enzostvs/deepsite",
    );
    expect(found[0]!.signals.hfLikes).toBe(616);
  });

  it("skips a list that is not a list", () => {
    expect(parseList({ error: "x" }, "model", config, NOW)).toEqual([]);
  });

  it("asks for the models and the spaces, and survives one failing", async () => {
    const urls: string[] = [];
    const client: JsonClient = {
      async getJson(url) {
        urls.push(url);
        if (url.includes("/spaces")) throw new SourceError("HTTP 500");
        return modelsFixture;
      },
    };
    const result = await fetchHuggingFace(client, config, NOW);
    expect(urls).toHaveLength(2);
    expect(result.ok).toBe(true);
    expect(result.items).toHaveLength(1);
    expect(result.error).toContain("spaces");
  });
});

describe("Hacker News", () => {
  const found = parseHits(hackerNewsFixture);

  it("reads Show HN posts and their points", () => {
    const notefox = found.find((entry) => entry.name === "Notefox")!;
    expect(notefox.description).toBe("turn meeting notes into slides");
    expect(notefox.homepage).toBe("https://notefox.app/");
    expect(notefox.signals.hnPoints).toBe(120);
    expect(notefox.maintainer).toBe("maker1");
    expect(notefox.seenUrl).toBe(
      "https://news.ycombinator.com/item?id=50030001",
    );
  });

  it("uses the repository for a post that names none", () => {
    const arrow = found.find(
      (entry) => entry.name === "big-arrow-on-the-screen",
    )!;
    expect(arrow.repository).toBe(
      "https://github.com/franzenzenhofer/big-arrow-on-the-screen",
    );
    expect(arrow.homepage).toBeNull();
  });

  it("drops papers and malformed hits, and a post with no address is unusable", () => {
    expect(found.map((entry) => entry.name)).not.toContain(
      "A study of agent loops",
    );
    const noAddress = found.find((entry) => entry.name === "Ask me anything");
    expect(noAddress).toBeDefined();
    expect(cleanCandidate(noAddress!)).toBeNull();
    expect(found.some((entry) => entry.seenUrl.endsWith("not-a-number"))).toBe(
      false,
    );
  });

  it("filters by points and age in the query", () => {
    const url = new URL(hackerNewsUrl("AI", NOW, config));
    expect(url.hostname).toBe("hn.algolia.com");
    expect(url.searchParams.get("tags")).toBe("show_hn");
    expect(url.searchParams.get("numericFilters")).toContain("points>=30");
  });

  it("is skipped when the API fails", async () => {
    const client: JsonClient = {
      async getJson() {
        throw new SourceError("HTTP 503");
      },
    };
    const result = await fetchHackerNews(client, config, NOW);
    expect(result.ok).toBe(false);
  });
});

describe("official news feeds", () => {
  const source: NewsSource = {
    id: "example-blog",
    name: "Example blog",
    feedUrl: "https://example.com/feed.xml",
    homepage: "https://example.com/blog",
    officialDomains: ["example.com"],
    toolIds: [],
    defaultTag: "other",
  };
  const item = (title: string): NewsItem => ({
    id: "1",
    title,
    url: "https://example.com/blog/post",
    publishedAt: "2026-10-05T00:00:00.000Z",
    sourceId: source.id,
    sourceName: source.name,
    summary: "A short summary.",
    tag: "other",
    toolIds: [],
  });

  it("turns a launch headline into a candidate by the source's company", () => {
    const candidate = toCandidate(
      item("Introducing Lumo: notes that think"),
      source,
    )!;
    expect(candidate.name).toBe("Lumo");
    expect(candidate.maintainer).toBe("Example blog");
    expect(candidate.announcement).toBe("https://example.com/blog/post");
    expect(candidate.signals.announced).toBe(true);
  });

  it("ignores a headline that names no product", () => {
    expect(toCandidate(item("Our approach to safety"), source)).toBeNull();
  });

  it("reads a real feed through the site's feed reader", async () => {
    const feed = `<?xml version="1.0"?><rss version="2.0"><channel><title>Example</title>
      <item><title>Introducing Lumo</title><link>https://example.com/blog/lumo</link>
      <pubDate>Mon, 05 Oct 2026 10:00:00 GMT</pubDate><description>Notes.</description></item>
      <item><title>Introducing Old Thing</title><link>https://example.com/blog/old</link>
      <pubDate>Mon, 01 Jun 2026 10:00:00 GMT</pubDate></item>
      <item><title>Introducing Elsewhere</title><link>https://other.example/blog/x</link>
      <pubDate>Mon, 05 Oct 2026 10:00:00 GMT</pubDate></item>
      </channel></rss>`;
    const fetchImpl = (async () =>
      new Response(feed, { status: 200 })) as unknown as typeof fetch;
    const result = await fetchNews([source], config, NOW, fetchImpl);
    expect(result.ok).toBe(true);
    expect(result.items.map((entry) => entry.name)).toEqual(["Lumo"]);
  });

  it("skips a failing feed and keeps the others", async () => {
    const second = {
      ...source,
      id: "second",
      feedUrl: "https://example.com/two.xml",
    };
    const fetchImpl = (async (url: string) =>
      url.endsWith("two.xml")
        ? new Response("nope", { status: 500 })
        : new Response(
            `<rss version="2.0"><channel><item><title>Introducing Lumo</title>
             <link>https://example.com/blog/lumo</link>
             <pubDate>Mon, 05 Oct 2026 10:00:00 GMT</pubDate></item></channel></rss>`,
            { status: 200 },
          )) as unknown as typeof fetch;
    const result = await fetchNews([source, second], config, NOW, fetchImpl);
    expect(result.ok).toBe(true);
    expect(result.items).toHaveLength(1);
    expect(result.error).toContain("second: HTTP 500");
  });
});

describe("names from titles", () => {
  it.each([
    ["Show HN: Foo – turns notes into slides", null, "Foo"],
    ["Show HN: Foo: turns notes into slides", null, "Foo"],
    ["Show HN: Foo | notes to slides", null, "Foo"],
    [
      "Show HN: I made a thing for reading faster",
      "https://readfast.app/",
      "readfast",
    ],
    [
      "Show HN: I made a thing that does stuff",
      "https://github.com/maker/stuffer",
      "stuffer",
    ],
  ])("Show HN %j", (title, url, name) => {
    expect(fromShowHn(title, url)?.name).toBe(name);
  });

  it.each([
    ["Introducing Claude Opus 4.5, our most capable model", "Claude Opus 4.5"],
    ["Introducing the new Gemini app", "Gemini app"],
    ["Announcing Foo for teams", "Foo"],
    ["Foo is now available in the API", "Foo"],
    ["Meet Notebook", "Notebook"],
    ["How we think about safety", null],
    [
      "Introducing our long and rambling plans for the future of everything",
      null,
    ],
  ])("announcement %j", (title, name) => {
    expect(fromAnnouncement(title)).toBe(name);
  });
});
