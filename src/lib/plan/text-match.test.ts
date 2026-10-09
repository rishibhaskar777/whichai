import { describe, expect, it } from "vitest";
import {
  editDistance,
  findPhrase,
  scorePhrases,
  tokenize,
  wordsMatch,
} from "./text-match";

describe("tokenize", () => {
  it("lowercases, splits on punctuation and drops filler words", () => {
    expect(tokenize("Make a Study-Plan, for MY exams!")).toEqual([
      "make",
      "study",
      "plan",
      "exams",
    ]);
  });

  it("returns nothing for symbols, emoji and blank text", () => {
    expect(tokenize("")).toEqual([]);
    expect(tokenize("?!  😀")).toEqual([]);
  });

  it("keeps letters from other scripts", () => {
    expect(tokenize("वेबसाइट बनाओ")).toHaveLength(2);
  });
});

describe("editDistance", () => {
  it.each([
    ["same", "same", 0],
    ["", "abc", 3],
    ["abc", "", 3],
    ["study", "studdy", 1],
    ["study", "stduy", 1],
    ["portfolio", "porfolio", 1],
    ["kitten", "sitting", 3],
    ["resume", "resumee", 1],
  ])("%s to %s is %i", (a, b, expected) => {
    expect(editDistance(a, b)).toBe(expected);
  });
});

describe("wordsMatch", () => {
  it("accepts the same word and simple plurals", () => {
    expect(wordsMatch("video", "video")).toBe(true);
    expect(wordsMatch("videos", "video")).toBe(true);
    expect(wordsMatch("video", "videos")).toBe(true);
  });

  it("accepts a typo in a longer word, and tolerates more in very long words", () => {
    expect(wordsMatch("studdy", "study")).toBe(true);
    expect(wordsMatch("porfolio", "portfolio")).toBe(true);
    expect(wordsMatch("presentaton", "presentation")).toBe(true);
    expect(wordsMatch("presntatin", "presentation")).toBe(true);
  });

  it("does not guess at short words", () => {
    expect(wordsMatch("sit", "site")).toBe(false);
    expect(wordsMatch("exan", "exam")).toBe(false);
    expect(wordsMatch("cat", "car")).toBe(false);
  });

  it("requires the first letter to match", () => {
    expect(wordsMatch("tudy", "study")).toBe(false);
    expect(wordsMatch("slide", "glide")).toBe(false);
  });

  it("rejects words that are too far apart", () => {
    expect(wordsMatch("studio", "study")).toBe(false);
    expect(wordsMatch("bathroom", "portfolio")).toBe(false);
  });
});

describe("findPhrase and scorePhrases", () => {
  it("finds a phrase and reports where it starts", () => {
    expect(findPhrase(["make", "a", "cv"], ["cv"])).toBe(2);
    expect(findPhrase(["cover", "letter", "help"], ["cover", "letter"])).toBe(
      0,
    );
    expect(findPhrase(["cover", "help", "letter"], ["cover", "letter"])).toBe(
      -1,
    );
    expect(findPhrase(["anything"], [])).toBe(-1);
  });

  it("matches a phrase with a typo in one word", () => {
    expect(findPhrase(tokenize("slide dek"), tokenize("slide deck"))).toBe(-1);
    expect(findPhrase(tokenize("slidde deck"), tokenize("slide deck"))).toBe(0);
  });

  it("scores longer phrases higher and remembers the earliest hit", () => {
    const tokens = tokenize("make a short video for youtube");
    const result = scorePhrases(tokens, ["short video", "youtube", "reel"]);
    expect(result.score).toBe(3);
    expect(result.firstIndex).toBe(1);
  });

  it("scores zero when nothing matches", () => {
    expect(scorePhrases(["hello"], ["video"]).score).toBe(0);
  });
});
