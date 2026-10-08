export type NewsTag = "Model" | "Pricing" | "Tool" | "Policy" | "Research";

export interface NewsItem {
  id: string;
  source: string;
  date: string;
  summary: string;
  tag: NewsTag;
  url: string;
}

/*
 * Sample content only. These entries show how the news panel will look;
 * they are not real announcements. Links go to each source's public news page.
 */
export const sampleNews: readonly NewsItem[] = [
  {
    id: "sample-model-release",
    source: "OpenAI",
    date: "2026-01-15",
    summary: "Sample entry: how a new model release note will be summarised.",
    tag: "Model",
    url: "https://openai.com/news/",
  },
  {
    id: "sample-pricing-change",
    source: "Anthropic",
    date: "2026-01-12",
    summary: "Sample entry: how a plan or pricing change will be shown.",
    tag: "Pricing",
    url: "https://www.anthropic.com/news",
  },
  {
    id: "sample-tool-update",
    source: "Google",
    date: "2026-01-09",
    summary: "Sample entry: how a feature added to an existing tool appears.",
    tag: "Tool",
    url: "https://blog.google/technology/ai/",
  },
  {
    id: "sample-policy-note",
    source: "Mistral AI",
    date: "2026-01-05",
    summary: "Sample entry: how a usage or data policy update is flagged.",
    tag: "Policy",
    url: "https://mistral.ai/news/",
  },
  {
    id: "sample-research-post",
    source: "Meta AI",
    date: "2026-01-02",
    summary: "Sample entry: how a research post is summarised in one line.",
    tag: "Research",
    url: "https://ai.meta.com/blog/",
  },
];
