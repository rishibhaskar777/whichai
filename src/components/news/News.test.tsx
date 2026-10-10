import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NewsPanel } from "@/components/news-panel/NewsPanel";
import { buildPlan } from "@/lib/engine/build-plan";
import { createI18n } from "@/lib/i18n/translate";
import { toolIdsOfPlan } from "@/lib/news/affects-plans";
import { parseNewsQuery } from "@/lib/news/query";
import type { NewsSnapshot } from "@/lib/news/service";
import { createMemoryBackend } from "@/lib/storage/backend";
import { headingViolations, seriousViolations } from "@/test/axe";
import { NOW, newsItem, panelNewsFixture } from "@/test/news";
import { planNamed, seed } from "@/test/seed";
import { AppProviders } from "@/test/wrappers";
import { NewsEntry } from "./NewsEntry";
import { PlanToolsProvider } from "./PlanToolsProvider";
import { WhatChanged } from "./WhatChanged";

vi.mock("next/navigation", async () =>
  (await import("@/test/navigation")).navigationMock("/what-changed"),
);

const i18n = createI18n("en");
const now = Date.parse(NOW);

function renderPanel(news = panelNewsFixture) {
  return render(
    <AppProviders>
      <NewsPanel
        news={news}
        choice="open"
        expanded
        onToggle={() => undefined}
      />
    </AppProviders>,
  );
}

describe("NewsPanel", () => {
  it("shows the source note and the last update, not a sample label", () => {
    renderPanel();
    expect(
      screen.getByText(
        "Headlines from official sources, updated about every 30 minutes",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Last updated 20 minutes ago")).toBeInTheDocument();
    expect(screen.queryByText("Sample content")).not.toBeInTheDocument();
  });

  it("shows source, relative time, a linked title and the tag", () => {
    renderPanel();
    const first = screen.getAllByRole("article")[0]!;
    expect(within(first).getByText("Example Labs")).toBeInTheDocument();
    expect(within(first).getByText("2 hours ago")).toBeInTheDocument();
    const link = within(first).getByRole("link", {
      name: /Introducing a new model/,
    });
    expect(link).toHaveAttribute("href", "https://example.com/news/one");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(within(first).getByText("New model")).toBeInTheDocument();
  });

  it("marks only items under 24 hours old as New", () => {
    renderPanel();
    const [recent, older] = screen.getAllByRole("article");
    expect(within(recent!).getByText("New")).toBeInTheDocument();
    expect(within(older!).queryByText("New")).not.toBeInTheDocument();
  });

  it("renders headlines as text, never as markup", () => {
    renderPanel({
      ...panelNewsFixture,
      items: [newsItem({ title: "<img src=x onerror=alert(1)> Hello" })],
    });
    expect(document.querySelector("img")).toBeNull();
    expect(screen.getByText(/<img src=x/)).toBeInTheDocument();
  });

  it("says news is unavailable and when it last worked", () => {
    renderPanel({ ...panelNewsFixture, items: [], allFailed: true });
    expect(
      screen.getByText("News is temporarily unavailable"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Last successful update: 20 minutes ago"),
    ).toBeInTheDocument();
  });

  it("says no update has succeeded when none has", () => {
    renderPanel({
      items: [],
      now: NOW,
      lastUpdated: null,
      allFailed: true,
    });
    expect(
      screen.getByText("No update has succeeded yet."),
    ).toBeInTheDocument();
  });

  it("keeps showing the last good items while a refresh is failing", () => {
    renderPanel({ ...panelNewsFixture, allFailed: true });
    expect(
      screen.getByText("News is temporarily unavailable"),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(2);
  });

  it("links to the full page", () => {
    renderPanel();
    expect(
      screen.getByRole("link", { name: "See all updates" }),
    ).toHaveAttribute("href", "/what-changed");
  });

  it("has no serious accessibility violations", async () => {
    const { container } = renderPanel();
    expect(await seriousViolations(container)).toEqual([]);
  });
});

describe("relative time in Hindi", () => {
  it("uses the user's language", () => {
    const hindi = createI18n("hi");
    expect(hindi.formatRelative("2026-10-10T10:00:00.000Z", now)).toMatch(/2/);
    expect(hindi.formatRelative("2026-10-10T10:00:00.000Z", now)).not.toBe(
      i18n.formatRelative("2026-10-10T10:00:00.000Z", now),
    );
    expect(hindi.t("news.unavailable")).not.toBe(i18n.t("news.unavailable"));
  });
});

describe("Affects your plans", () => {
  const saved = planNamed("My portfolio");
  const { goal, level, budget } = saved.planRequest;
  const usedTool = [
    ...toolIdsOfPlan(
      buildPlan(goal, { level, budget, toolsUsed: new Set() }),
      [],
    ),
  ][0]!;

  async function renderEntry(toolIds: string[], plans = [saved]) {
    const backend = createMemoryBackend();
    await seed(backend, { plans });
    render(
      <AppProviders backend={backend}>
        <PlanToolsProvider>
          <NewsEntry item={newsItem({ toolIds })} now={now} i18n={i18n} />
        </PlanToolsProvider>
      </AppProviders>,
    );
  }

  it("appears when a saved plan uses one of the item's tools", async () => {
    await renderEntry(["unrelated", usedTool]);
    expect(
      await screen.findByText("Affects your plans", undefined, {
        timeout: 3000,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/My portfolio/)).toBeInTheDocument();
  });

  it("stays hidden when no saved plan uses the item's tools", async () => {
    await renderEntry(["a-tool-in-no-plan"]);
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(screen.queryByText("Affects your plans")).not.toBeInTheDocument();
  });

  it("stays hidden when nothing is saved", async () => {
    await renderEntry([usedTool], []);
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(screen.queryByText("Affects your plans")).not.toBeInTheDocument();
  });
});

describe("WhatChanged", () => {
  const items = Array.from({ length: 45 }, (_, index) =>
    newsItem({
      id: `n${index}`,
      url: `https://example.com/news/${index}`,
      title: `Headline number ${index}`,
      publishedAt: new Date(now - index * 3_600_000).toISOString(),
      sourceId: index % 2 ? "alpha" : "beta",
      sourceName: index % 2 ? "Alpha" : "Beta",
      tag: index % 2 ? "pricing" : "feature-update",
    }),
  );
  const snapshot: NewsSnapshot = {
    items,
    generatedAt: NOW,
    lastUpdated: "2026-10-10T11:50:00.000Z",
    allFailed: false,
    sources: [
      { id: "alpha", name: "Alpha" },
      { id: "beta", name: "Beta" },
    ],
  };

  function renderPage(
    params: Record<string, string> = {},
    data: NewsSnapshot = snapshot,
  ) {
    const query = parseNewsQuery(
      params,
      data.sources.map((source) => source.id),
    );
    return render(
      <AppProviders>
        <WhatChanged snapshot={data} query={query} i18n={i18n} />
      </AppProviders>,
    );
  }

  it("lists the first page with a count and filters", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { level: 1, name: "What Changed" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(20);
    expect(screen.getByText("45 updates")).toBeInTheDocument();
    expect(screen.getByLabelText("Type")).toBeInTheDocument();
    expect(screen.getByLabelText("Source")).toBeInTheDocument();
    expect(screen.getByLabelText("Search headlines")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
  });

  it("is a plain GET form so filters live in the URL", () => {
    renderPage();
    const form = screen.getByRole("search", { name: "Filter updates" });
    expect(form).toHaveAttribute("method", "get");
    expect(form).toHaveAttribute("action", "/what-changed");
  });

  it("applies filters from the URL and keeps them in the pager", () => {
    renderPage({ tag: "pricing", source: "alpha", q: "number 1" });
    const articles = screen.getAllByRole("article");
    expect(articles.length).toBeGreaterThan(0);
    for (const article of articles) {
      expect(within(article).getByText("Pricing or plan")).toBeInTheDocument();
    }
    expect(screen.getByLabelText("Type")).toHaveValue("pricing");
    expect(screen.getByLabelText("Source")).toHaveValue("alpha");
    expect(screen.getByLabelText("Search headlines")).toHaveValue("number 1");
    expect(screen.getByRole("link", { name: "Clear filters" })).toHaveAttribute(
      "href",
      "/what-changed",
    );
  });

  it("links the next page with the current filters", () => {
    renderPage({ tag: "feature-update" });
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute(
      "href",
      "/what-changed?tag=feature-update&page=2",
    );
  });

  it("shows an empty state for a search with no matches", () => {
    renderPage({ q: "zzzz" });
    expect(
      screen.getByRole("heading", { name: "No updates match" }),
    ).toBeInTheDocument();
  });

  it("shows the unavailable state with the last successful update", () => {
    renderPage(
      {},
      {
        ...snapshot,
        items: [],
        allFailed: true,
        lastUpdated: snapshot.lastUpdated,
      },
    );
    expect(
      screen.getByText("News is temporarily unavailable"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Last successful update: 10 minutes ago"),
    ).toBeInTheDocument();
  });

  it("has no serious accessibility violations", async () => {
    const { container } = renderPage();
    expect(await seriousViolations(container)).toEqual([]);
  });

  it("keeps headings in order under the page title", async () => {
    const { container } = renderPage();
    expect(await headingViolations(container)).toEqual([]);
  });

  it("has no serious accessibility violations in the unavailable state", async () => {
    const { container } = renderPage(
      {},
      { ...snapshot, items: [], allFailed: true },
    );
    expect(await seriousViolations(container)).toEqual([]);
  });
});
