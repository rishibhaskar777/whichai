import { describe, expect, it } from "vitest";
import { COMMON_PASSWORD_COUNT, isCommonPassword } from "./common-passwords";

describe("common passwords", () => {
  it("holds at least the thousand most common", () => {
    expect(COMMON_PASSWORD_COUNT).toBeGreaterThanOrEqual(1000);
  });

  it("matches ignoring case and leaves other passwords alone", () => {
    expect(isCommonPassword("Password123")).toBe(true);
    expect(isCommonPassword("12345678")).toBe(true);
    expect(isCommonPassword("violet-lantern-ocean")).toBe(false);
  });
});
