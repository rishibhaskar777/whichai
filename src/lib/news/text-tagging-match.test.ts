import { describe, expect, it } from "vitest";
import { tagItem } from "./tagging";
import { decodeEntities, toPlainText, truncate } from "./text";
import { createToolMatcher } from "./tool-match";
import type { NewsTag } from "./types";

describe("toPlainText", () => {
  it("removes tags, scripts and styles and keeps the words", () => {
    expect(
      toPlainText(
        "<p>One <b>two</b></p><script>x()</script><style>a{}</style>three",
      ),
    ).toBe("One two three");
  });

  it("drops an unclosed script block and everything after it", () => {
    expect(toPlainText("Before <script>alert(1) and then more")).toBe("Before");
  });

  it("treats CDATA as raw and other text as escaped", () => {
    expect(toPlainText("<![CDATA[a &amp; b]]> &lt;i&gt;c&lt;/i&gt;")).toBe(
      "a & b c",
    );
  });

  it("collapses whitespace and control characters", () => {
    expect(toPlainText("  a \n\t b\u0000c  ")).toBe("a b c");
  });

  it("only reads the start of a huge input", () => {
    const started = performance.now();
    expect(toPlainText("<p>x</p>".repeat(100_000)).length).toBeLessThan(10_000);
    expect(performance.now() - started).toBeLessThan(500);
  });
});

describe("decodeEntities", () => {
  it("decodes named, decimal and hex references", () => {
    expect(decodeEntities("&amp; &lt; &#65; &#x42; &hellip;")).toBe(
      "& < A B …",
    );
  });

  it("leaves unknown names and out-of-range numbers alone or empty", () => {
    expect(decodeEntities("&nope; &#0; &#55296;")).toBe("&nope;  ");
  });
});

describe("truncate", () => {
  it("returns short text unchanged", () => {
    expect(truncate("short", 160)).toBe("short");
  });

  it("cuts at a word and adds an ellipsis within the limit", () => {
    const result = truncate("alpha beta gamma delta epsilon", 20);
    expect(result).toBe("alpha beta gamma…");
    expect(Array.from(result).length).toBeLessThanOrEqual(20);
  });

  it("does not split an emoji", () => {
    const result = truncate("\u{1F600}".repeat(30), 10);
    expect(Array.from(result)).toHaveLength(10);
  });
});

describe("tagItem", () => {
  const tag = (title: string, defaultTag: NewsTag = "other", summary = "") =>
    tagItem({ title, summary, defaultTag });

  it("finds pricing and plan changes", () => {
    expect(tag("New pricing for the Pro plan")).toBe("pricing");
    expect(tag("Usage limits are changing")).toBe("pricing");
  });

  it("finds policy changes", () => {
    expect(tag("Updating our privacy policy")).toBe("policy");
  });

  it("finds new models", () => {
    expect(tag("Introducing GPT-5.1")).toBe("new-model");
    expect(tag("Gemini 4 Argon is here")).toBe("new-model");
    expect(tag("Mistral Large 4 is out")).toBe("new-model");
  });

  it("finds research", () => {
    expect(tag("A new paper on interpretability")).toBe("research");
  });

  it("finds new tools", () => {
    expect(tag("Introducing Brand Kit")).toBe("new-tool");
    expect(tag("Meet the new agent builder")).toBe("new-tool");
  });

  it("finds feature updates", () => {
    expect(tag("Voice mode now supports 12 languages")).toBe("feature-update");
    expect(tag("v2.1.296")).toBe("feature-update");
  });

  it("falls back to the source default", () => {
    expect(tag("Quarterly thoughts", "research")).toBe("research");
    expect(tag("Quarterly thoughts", "feature-update")).toBe("feature-update");
    expect(tag("Quarterly thoughts")).toBe("other");
  });

  it("reads a summary only for strong tags and not for research feeds", () => {
    expect(tag("Our news", "other", "Details on the new pricing")).toBe(
      "pricing",
    );
    expect(tag("Our news", "other", "We are launching a thing")).toBe("other");
    expect(tag("Our news", "research", "Details on the new pricing")).toBe(
      "research",
    );
  });

  it("lets a title keyword beat a release feed's default", () => {
    expect(tag("Pricing update", "feature-update")).toBe("pricing");
  });
});

describe("createToolMatcher", () => {
  const match = createToolMatcher([
    { id: "cursor", name: "Cursor" },
    { id: "claude", name: "Claude" },
    { id: "claude-code", name: "Claude Code" },
    { id: "make-com", name: "Make" },
    { id: "nextjs", name: "Next.js" },
    { id: "gpt", name: "GPT4All" },
    { id: "hindi", name: "भाषा" },
  ]);

  it("matches whole words with the catalogue's spelling", () => {
    expect(match("Cursor adds remote agents")).toEqual(["cursor"]);
    expect(match("Using Next.js with Claude Code")).toEqual([
      "claude",
      "claude-code",
      "nextjs",
    ]);
  });

  it("does not match inside other words or in another case", () => {
    expect(match("Cursors and cursor position")).toEqual([]);
    expect(match("Claudeville")).toEqual([]);
  });

  it("never matches names that are common words", () => {
    expect(match("Make it faster")).toEqual([]);
  });

  it("handles names in other scripts", () => {
    expect(match("नई भाषा मॉडल")).toEqual(["hindi"]);
  });

  it("treats regex characters in names as text", () => {
    const odd = createToolMatcher([{ id: "odd", name: "C++ (beta)" }]);
    expect(odd("Using C++ (beta) today")).toEqual(["odd"]);
    expect(odd("C beta")).toEqual([]);
  });
});
