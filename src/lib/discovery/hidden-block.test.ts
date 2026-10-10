import { describe, expect, it } from "vitest";
import {
  countOccurrences,
  escapeJsonForComment,
  hasTagStart,
  readBlock,
  removeBetween,
  writeBlock,
} from "./hidden-block";

describe("the hidden block", () => {
  it("writes and reads one block", () => {
    const body = `text\n${writeBlock("marker", '{"a":1}')}`;
    expect(readBlock(body, "marker")).toBe('{"a":1}');
  });

  it("uses the last block and ignores other markers", () => {
    const body = `${writeBlock("marker", '{"a":1}')}\n${writeBlock("marker", '{"a":2}')}\n${writeBlock("other", "{}")}`;
    expect(readBlock(body, "marker")).toBe('{"a":2}');
    expect(readBlock("no block", "marker")).toBeNull();
    expect(readBlock("<!-- marker {", "marker")).toBeNull();
  });

  it("escapes everything that could end the comment", () => {
    const escaped = escapeJsonForComment('{"x":"--> <b> ---- y"}');
    expect(escaped).not.toContain("<");
    expect(escaped).not.toContain(">");
    expect(escaped).not.toContain("--");
  });
});

describe("string helpers", () => {
  it("removes delimited stretches, and an unclosed one to the end", () => {
    expect(removeBetween("a<!-- x -->b<!-- y -->c", "<!--", "-->")).toBe("abc");
    expect(removeBetween("a<!-- never closed", "<!--", "-->")).toBe("a");
    expect(removeBetween("nothing here", "<!--", "-->")).toBe("nothing here");
  });

  it("counts non-overlapping occurrences", () => {
    expect(countOccurrences("aaaa", "aa")).toBe(2);
    expect(countOccurrences("abc", "")).toBe(0);
  });

  it("finds a tag start", () => {
    expect(hasTagStart("a <b> c")).toBe(true);
    expect(hasTagStart("1 < 2 and 3 <")).toBe(false);
  });
});
