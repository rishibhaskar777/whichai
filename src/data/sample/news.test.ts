import { describe, expect, it } from "vitest";
import { sampleNews } from "./news";

describe("sampleNews", () => {
  it("has five items", () => {
    expect(sampleNews).toHaveLength(5);
  });

  it("gives every item the fields the panel renders", () => {
    for (const item of sampleNews) {
      expect(item.id).toBeTruthy();
      expect(item.source).toBeTruthy();
      expect(item.summary).toBeTruthy();
      expect(item.tag).toBeTruthy();
      expect(item.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(item.date))).toBe(false);
    }
  });

  it("uses unique ids", () => {
    const ids = sampleNews.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("links only to https URLs", () => {
    for (const item of sampleNews) {
      expect(new URL(item.url).protocol).toBe("https:");
    }
  });

  it("labels every summary as a sample", () => {
    for (const item of sampleNews) {
      expect(item.summary).toMatch(/^Sample entry/);
    }
  });
});
