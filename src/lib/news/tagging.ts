import type { NewsTag } from "./types";

interface Rule {
  tag: NewsTag;
  pattern: RegExp;
}

/*
 * Checked in order, first match wins. They read the title and summary only,
 * so a rule is a hint and the source's default tag is the fallback.
 */
const RULES: readonly Rule[] = [
  {
    tag: "pricing",
    pattern:
      /\b(pricing|prices?|plans?|subscriptions?|free tier|free plan|credits?|rate limits?|usage limits?|billing|paid)\b/i,
  },
  {
    tag: "policy",
    pattern:
      /\b(policy|policies|terms of (service|use)|privacy|data (retention|use|protection)|regulation|compliance|ai act|safeguards?|responsible)\b/i,
  },
  {
    tag: "new-model",
    pattern:
      /\b(gpt-?\d[\w.-]*|o[1-9](-\w+)?|gemini[ -]?\d[\w.-]*|claude[ -](opus|sonnet|haiku|\d)[\w.-]*|llama[ -]?\d[\w.-]*|gemma[ -]?\d[\w.-]*|qwen ?\d[\w.-]*|flux[ .-]?\d[\w.-]*|mistral (large|medium|small|nemo)|(new|latest|open|open-weights?) models?|model (release|family|card)|stable diffusion \d[\w.-]*|sora ?\d?)\b/i,
  },
  {
    tag: "research",
    pattern:
      /\b(research|paper|study|studies|benchmark|findings|preprint|dataset|evaluation|interpretability)\b/i,
  },
  {
    tag: "new-tool",
    pattern:
      /\b(introducing|introduces|launch(es|ed|ing)?|announcing|unveil(s|ed|ing)?|meet|now in (beta|preview)|available today|new app|new agent)\b/i,
  },
  {
    tag: "feature-update",
    pattern:
      /\b(updates?|updated|improv\w+|now (supports?|available|lets?)|adds?|added|support for|new features?|changelog|release notes|version \d|v\d+\.\d+|\d+\.\d+\.\d+)\b/i,
  },
];

export interface TagInput {
  title: string;
  summary: string;
  defaultTag: NewsTag;
}

/**
 * The title carries most of the signal. The summary is only read for the
 * strong tags (pricing, policy, model), and not for sources whose default
 * already says what they publish, because a research blog's summaries talk
 * about "models" without releasing any.
 */
export function tagItem({ title, summary, defaultTag }: TagInput): NewsTag {
  for (const { tag, pattern } of RULES) {
    if (pattern.test(title)) return tag;
  }
  if (defaultTag === "research" || defaultTag === "feature-update") {
    return defaultTag;
  }
  for (const { tag, pattern } of RULES) {
    const strong = tag === "pricing" || tag === "policy" || tag === "new-model";
    if (strong && pattern.test(summary)) return tag;
  }
  return defaultTag;
}
