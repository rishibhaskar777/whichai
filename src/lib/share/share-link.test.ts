import { describe, expect, it } from "vitest";
import { requestFor } from "@/test/seed";
import {
  MAX_FRAGMENT_LENGTH,
  buildShareUrl,
  decodePlanRequest,
  encodePlanRequest,
} from "./share-link";

const REQUEST = requestFor("portfolio website with animations", {
  level: "polished",
  budget: "under-1000",
  toolsUsed: ["chatgpt", "vercel"],
});

function encodeJson(value: unknown): string {
  return btoa(JSON.stringify(value))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

describe("share links", () => {
  it("round-trips a plan request", () => {
    const encoded = encodePlanRequest(REQUEST);
    expect(encoded).not.toBeNull();
    expect(decodePlanRequest(encoded ?? "")).toEqual({
      ok: true,
      request: REQUEST,
    });
  });

  it("accepts a leading # and keeps non-Latin text intact", () => {
    const request = {
      ...REQUEST,
      goal: {
        ...REQUEST.goal,
        chips: [
          { id: "goal:x", label: "पोर्टफ़ोलियो ✓", kind: "goal" as const },
        ],
      },
    };
    const encoded = encodePlanRequest(request) ?? "";
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodePlanRequest(`#${encoded}`)).toEqual({ ok: true, request });
  });

  it("puts the request after the # and never in the query", () => {
    const url = buildShareUrl("https://whichai.example", REQUEST) ?? "";
    const parsed = new URL(url);
    expect(parsed.pathname).toBe("/plan");
    expect(parsed.search).toBe("");
    expect(parsed.hash.length).toBeGreaterThan(10);
  });

  it("holds only the request fields, no goal text", () => {
    const encoded = encodePlanRequest(REQUEST) ?? "";
    const json = atob(encoded.replace(/-/g, "+").replace(/_/g, "/"));
    expect(Object.keys(JSON.parse(json)).sort()).toEqual([
      "budget",
      "goal",
      "level",
      "toolsUsed",
    ]);
  });

  it("refuses to encode a request that would not fit", () => {
    const chip = {
      id: "x".repeat(60),
      label: "y".repeat(60),
      kind: "feature" as const,
    };
    const huge = {
      ...REQUEST,
      goal: { ...REQUEST.goal, chips: Array(20).fill(chip) },
      toolsUsed: Array(40).fill("x".repeat(60)),
    };
    expect(encodePlanRequest(huge)).toBeNull();
    expect(buildShareUrl("https://whichai.example", huge)).toBeNull();
  });

  it("rejects fragments larger than 4 KB before decoding", () => {
    expect(decodePlanRequest("a".repeat(MAX_FRAGMENT_LENGTH + 1))).toEqual({
      ok: false,
      error: "too-large",
    });
  });

  it("rejects text that is not base64url", () => {
    for (const bad of ["", "not valid!", "%7B%7D", "a b", "<script>"]) {
      expect(decodePlanRequest(bad)).toEqual({ ok: false, error: "malformed" });
    }
  });

  it("rejects base64url that is not JSON", () => {
    expect(decodePlanRequest(encodeJson("hello").slice(0, 6))).toEqual({
      ok: false,
      error: "malformed",
    });
  });

  it("rejects JSON of the wrong shape", () => {
    expect(decodePlanRequest(encodeJson({ hello: "world" }))).toEqual({
      ok: false,
      error: "invalid",
    });
    expect(decodePlanRequest(encodeJson([1, 2, 3]))).toEqual({
      ok: false,
      error: "invalid",
    });
  });

  it("rejects unknown fields, unknown goals and bad values", () => {
    for (const bad of [
      { ...REQUEST, extra: true },
      { ...REQUEST, level: "expert" },
      { ...REQUEST, budget: "free" },
      { ...REQUEST, goal: { ...REQUEST.goal, goalType: "world-domination" } },
      { ...REQUEST, goal: { ...REQUEST.goal, extra: 1 } },
      { ...REQUEST, toolsUsed: Array(41).fill("a") },
    ]) {
      expect(decodePlanRequest(encodeJson(bad))).toEqual({
        ok: false,
        error: "invalid",
      });
    }
  });
});
