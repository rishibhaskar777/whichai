import { describe, expect, it } from "vitest";
import { parseGlow } from "./aurora-colour";

describe("parseGlow", () => {
  it("reads the minified #rrggbbaa form", () => {
    const glow = parseGlow("#4f5bd508");
    expect(glow).toMatchObject({ red: 79, green: 91, blue: 213 });
    expect(glow?.alpha).toBeCloseTo(8 / 255);
  });

  it("reads the source rgb() form with a slash alpha", () => {
    expect(parseGlow("rgb(139 150 255 / 0.048)")).toEqual({
      red: 139,
      green: 150,
      blue: 255,
      alpha: 0.048,
    });
  });

  it("reads comma-separated rgba()", () => {
    expect(parseGlow(" rgba(56, 140, 255, 0.5) ")).toEqual({
      red: 56,
      green: 140,
      blue: 255,
      alpha: 0.5,
    });
  });

  it("reads short and opaque hex", () => {
    expect(parseGlow("#fff")).toEqual({
      red: 255,
      green: 255,
      blue: 255,
      alpha: 1,
    });
    expect(parseGlow("#0a0a0c")).toMatchObject({
      red: 10,
      green: 10,
      blue: 12,
    });
  });

  it("returns null for anything else", () => {
    expect(parseGlow("")).toBeNull();
    expect(parseGlow("blue")).toBeNull();
    expect(parseGlow("rgb(a b c)")).toBeNull();
  });
});
