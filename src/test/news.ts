import type { NewsItem, PanelNews } from "@/lib/news/types";

export const NOW = "2026-10-10T12:00:00.000Z";

export function newsItem(overrides: Partial<NewsItem> = {}): NewsItem {
  return {
    id: "item-1",
    title: "Introducing a new model",
    url: "https://example.com/news/one",
    publishedAt: "2026-10-10T10:00:00.000Z",
    sourceId: "example",
    sourceName: "Example Labs",
    summary: "A short summary.",
    tag: "new-model",
    toolIds: [],
    ...overrides,
  };
}

/** Test data, not real headlines. */
export const panelNewsFixture: PanelNews = {
  items: [
    newsItem(),
    newsItem({
      id: "item-2",
      title: "Pricing changes for teams",
      url: "https://example.com/news/two",
      publishedAt: "2026-10-08T09:00:00.000Z",
      sourceName: "Sample Tools",
      sourceId: "sample",
      tag: "pricing",
    }),
  ],
  now: NOW,
  lastUpdated: "2026-10-10T11:40:00.000Z",
  allFailed: false,
};
