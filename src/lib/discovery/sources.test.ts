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
import {
  fetchHuggingFace,
  isDerivative,
  parseList,
  selectTop,
} from "./sources/huggingface";
import { fetchNews, toCandidate } from "./sources/news";
import type { NewsItem, NewsSource } from "../news/types";

const config = parseConfig(configJson);
const NOW = new Date("2026-10-10T12:00:00Z");

describe("GitHub", () => {
  const { seen, kept } = parseSearch(githubFixture, config, NOW);
  const names = kept.map((entry) => entry.name);

  it("extracts candidates with their stars and maker", () => {
    const magpie = kept.find((entry) => entry.name === "magpie")!;
    expect(magpie.maintainer).toBe("yetone");
    expect(magpie.signals.githubStars).toBe(1450);
    expect(magpie.repository).toBe("https://github.com/yetone/magpie");
    expect(magpie.homepage).toBe("https://magpie.example.dev/");
    expect(magpie.kindHint).toBe("cli");
  });

  it("counts what it saw before filtering", () => {
    expect(seen).toBe(13);
    expect(kept.length).toBeLessThan(seen);
  });

  it("keeps only the tools", () => {
    expect(names).toEqual(["magpie", "plain-tool", "hostile"]);
  });

  it.each([
    ["forked-thing", "a fork"],
    ["old-project", "an archived repository"],
    ["awesome-llm-apps", "an awesome list"],
    ["llm-course", "a course"],
    ["my-dotfiles", "dotfiles"],
    ["attention-code", "a paper"],
    ["tiny-app", "too few stars"],
    ["slow-burn", "stars that arrive too slowly"],
    ["mystery", "no homepage and no user-facing word"],
  ])("leaves out %s (%s)", (name) => {
    expect(names).not.toContain(name);
  });

  it("accepts a description that names a tool when there is no homepage", () => {
    const plain = kept.find((entry) => entry.name === "plain-tool")!;
    expect(plain.homepage).toBeNull();
  });

  it("does not count the repository page as a homepage", () => {
    const stricter = {
      ...config,
      github: { ...config.github, toolWords: ["zzz"] },
    };
    const result = parseSearch(githubFixture, stricter, NOW);
    expect(result.kept.map((entry) => entry.name)).toEqual(["magpie"]);
  });

  it("uses the thresholds in the configuration", () => {
    const loose = {
      ...config,
      github: { ...config.github, minStars: 100, minStarsPerDay: 0 },
    };
    const result = parseSearch(githubFixture, loose, NOW);
    expect(result.kept.map((entry) => entry.name)).toContain("tiny-app");
    expect(result.kept.map((entry) => entry.name)).toContain("slow-burn");
  });

  it("keeps hostile text out of the cleaned candidate", () => {
    const hostile = kept.find((entry) => entry.name === "hostile")!;
    const clean = cleanCandidate(hostile)!;
    expect(clean.homepage).toBeNull();
    expect(clean.description).not.toMatch(/[<>`\n‮]/);
  });

  it("returns nothing for a response that is not a search result", () => {
    expect(parseSearch({ message: "rate limited" }, config, NOW).kept).toEqual(
      [],
    );
    expect(parseSearch(null, config, NOW).seen).toBe(0);
  });

  it("builds a search for recent, starred repositories of one topic", () => {
    const url = new URL(searchUrl("llm", "2026-06-12", config));
    expect(url.origin).toBe("https://api.github.com");
    expect(url.searchParams.get("q")).toBe(
      "topic:llm created:>2026-06-12 stars:>=500",
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
    expect(result.seen).toBe(13 * config.github.topics.length);
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
        if (calls > 1) {
          throw new SourceError("rate limited or refused (HTTP 403)");
        }
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
  const models = parseList(modelsFixture, "model", config, NOW);
  const modelIds = models.kept.map((entry) => entry.repository);

  it("keeps recent, liked and downloaded original models", () => {
    expect(models.seen).toBe(13);
    expect(modelIds).toEqual([
      "https://huggingface.co/google/embeddinggemma-2",
      "https://huggingface.co/Qwen/Qwen4",
      "https://huggingface.co/person/hot-model",
      "https://huggingface.co/person/warm-model",
    ]);
    const first = models.kept[0]!;
    expect(first.maintainer).toBe("google");
    expect(first.signals).toEqual({ hfLikes: 1459, hfDownloads: 45605 });
    expect(first.kindHint).toBe("model");
  });

  it.each([
    ["fan/qwen-finetune", ["base_model:finetune:Qwen/Qwen4"]],
    ["fan/qwen-quantised", ["gguf"]],
    ["fan/mergekit-blend", ["mergekit"]],
    ["fan/qwen-4-awq", []],
    ["fan/model-ft", []],
    ["fan/model-LoRA", []],
  ])("recognises %s as a derivative", (id, tags) => {
    expect(isDerivative({ id, tags }, config)).toBe(true);
  });

  it("does not treat an original as a derivative", () => {
    expect(
      isDerivative(
        { id: "google/embeddinggemma-2", tags: ["transformers"] },
        config,
      ),
    ).toBe(false);
  });

  it("needs downloads for a model, not for a Space", () => {
    const spaces = parseList(spacesFixture, "space", config, NOW);
    expect(spaces.kept.map((entry) => entry.name)).toEqual([
      "deepsite",
      "studio",
    ]);
    expect(spaces.kept[0]!.repository).toBe(
      "https://huggingface.co/spaces/enzostvs/deepsite",
    );
  });

  it("skips a list that is not a list", () => {
    expect(parseList({ error: "x" }, "model", config, NOW).kept).toEqual([]);
  });

  it("prefers official organisations and keeps a person's account only when very liked", () => {
    const official = new Set(["google", "Qwen"]);
    const top = selectTop(models.kept, official, config);
    expect(top.map((entry) => entry.name)).toEqual([
      "Qwen4",
      "embeddinggemma-2",
      "hot-model",
    ]);
  });

  it("keeps only the top few", () => {
    const small = {
      ...config,
      huggingface: { ...config.huggingface, keepTop: 1 },
    };
    const top = selectTop(models.kept, new Set(["google", "Qwen"]), small);
    expect(top.map((entry) => entry.name)).toEqual(["Qwen4"]);
  });

  it("asks for the lists and the organisations, and survives failures", async () => {
    const urls: string[] = [];
    const client: JsonClient = {
      async getJson(url) {
        urls.push(url);
        const path = new URL(url).pathname;
        if (path === "/api/models") return modelsFixture;
        if (path === "/api/spaces") throw new SourceError("HTTP 500");
        if (path === "/api/organizations/google/overview") {
          return { isVerified: true };
        }
        if (path === "/api/organizations/Qwen/overview") {
          return { isVerified: false, plan: "team" };
        }
        throw new SourceError("HTTP 404");
      },
    };
    const result = await fetchHuggingFace(client, config, NOW);
    expect(result.ok).toBe(true);
    expect(result.error).toContain("spaces");
    expect(result.items.map((entry) => entry.name)).toEqual([
      "Qwen4",
      "embeddinggemma-2",
      "hot-model",
    ]);
    expect(urls.filter((url) => url.includes("/organizations/"))).toHaveLength(
      3,
    );
  });
});

describe("Hacker News", () => {
  const { seen, kept } = parseHits(hackerNewsFixture, config);

  it("reads Show HN posts and their points", () => {
    const notefox = kept.find((entry) => entry.name === "Notefox")!;
    expect(notefox.description).toBe("turn meeting notes into slides");
    expect(notefox.homepage).toBe("https://notefox.app/");
    expect(notefox.signals.hnPoints).toBe(120);
    expect(notefox.maintainer).toBe("maker1");
    expect(notefox.seenUrl).toBe(
      "https://news.ycombinator.com/item?id=50030001",
    );
  });

  it("uses the repository for a post that names none", () => {
    const arrow = kept.find(
      (entry) => entry.name === "big-arrow-on-the-screen",
    )!;
    expect(arrow.repository).toBe(
      "https://github.com/franzenzenhofer/big-arrow-on-the-screen",
    );
    expect(arrow.homepage).toBeNull();
  });

  it("keeps only posts above the points and comments thresholds with an external https link", () => {
    expect(seen).toBe(10);
    expect(kept.map((entry) => entry.name)).toEqual([
      "big-arrow-on-the-screen",
      "Notefox",
    ]);
  });

  it.each([
    ["Ask HN: What AI tools do you use?", "an Ask HN post"],
    ["Quiet", "too few points"],
    ["Lonely", "too few comments"],
    ["Insecure", "a link that is not https"],
    ["Discussion", "a link back to Hacker News"],
    ["A study of agent loops", "a paper"],
    ["Ask me anything", "no external link"],
  ])("leaves out %s (%s)", (name) => {
    expect(kept.map((entry) => entry.name)).not.toContain(name);
  });

  it("filters by points, comments and age in the query", () => {
    const url = new URL(hackerNewsUrl("AI", NOW, config));
    expect(url.hostname).toBe("hn.algolia.com");
    expect(url.searchParams.get("tags")).toBe("show_hn");
    const filters = url.searchParams.get("numericFilters")!;
    expect(filters).toContain("points>=100");
    expect(filters).toContain("num_comments>=20");
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
    expect(result.seen).toBeGreaterThan(0);
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
