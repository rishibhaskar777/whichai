import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./redirect";

describe("safeRedirectPath", () => {
  it("allows listed same-origin paths", () => {
    expect(safeRedirectPath("/projects")).toBe("/projects");
    expect(safeRedirectPath("/privacy")).toBe("/privacy");
    expect(safeRedirectPath("/")).toBe("/");
  });

  it("keeps only the pathname", () => {
    expect(safeRedirectPath("/tool-library?x=1#top")).toBe("/tool-library");
  });

  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "\\\\evil.example",
    "javascript:alert(1)",
    "/unknown",
    "/projects/../../etc",
    "/api/auth/sign-out",
    "projects",
    "",
  ])("falls back to the home page for %j", (input) => {
    expect(safeRedirectPath(input)).toBe("/");
  });

  it("falls back for missing input", () => {
    expect(safeRedirectPath(null)).toBe("/");
    expect(safeRedirectPath(undefined)).toBe("/");
  });
});
