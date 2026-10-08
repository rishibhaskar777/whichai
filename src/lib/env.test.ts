import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

describe("parseEnv", () => {
  it("accepts a valid site URL", () => {
    expect(parseEnv({ NEXT_PUBLIC_SITE_URL: "https://example.com" })).toEqual({
      NEXT_PUBLIC_SITE_URL: "https://example.com",
    });
  });

  it("fails with a clear message when the variable is missing", () => {
    expect(() => parseEnv({})).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it("rejects values that are not http(s) URLs", () => {
    expect(() => parseEnv({ NEXT_PUBLIC_SITE_URL: "not a url" })).toThrow(
      /Invalid environment variables/,
    );
    expect(() =>
      parseEnv({ NEXT_PUBLIC_SITE_URL: "javascript:alert(1)" }),
    ).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });
});
