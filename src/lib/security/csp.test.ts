import { describe, expect, it } from "vitest";
import { buildCsp, createNonce } from "./csp";

function directive(csp: string, name: string): string | undefined {
  return csp.split("; ").find((part) => part.startsWith(`${name} `));
}

describe("buildCsp (production)", () => {
  const csp = buildCsp({ nonce: "abc123", isDevelopment: false });

  it("allows scripts only from self with the nonce and strict-dynamic", () => {
    expect(directive(csp, "script-src")).toBe(
      "script-src 'self' 'nonce-abc123' 'strict-dynamic'",
    );
  });

  it("limits styles to same-origin stylesheets", () => {
    expect(directive(csp, "style-src")).toBe("style-src 'self'");
  });

  it("never allows unsafe-inline or unsafe-eval", () => {
    expect(csp).not.toContain("unsafe-inline");
    expect(csp).not.toContain("unsafe-eval");
  });

  it("locks down framing, objects, base URI and forms", () => {
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
  });

  it("restricts images, fonts and connections to self", () => {
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("img-src 'self' data:");
    expect(csp).toContain("font-src 'self'");
    expect(directive(csp, "connect-src")).toBe("connect-src 'self'");
  });

  it("upgrades insecure requests", () => {
    expect(csp).toContain("upgrade-insecure-requests");
  });
});

describe("buildCsp (development)", () => {
  const csp = buildCsp({ nonce: "abc123", isDevelopment: true });

  it("relaxes only what the dev server needs", () => {
    expect(directive(csp, "script-src")).toContain("'unsafe-eval'");
    expect(directive(csp, "style-src")).toContain("'unsafe-inline'");
    expect(directive(csp, "connect-src")).toContain("ws:");
    expect(csp).not.toContain("upgrade-insecure-requests");
  });

  it("keeps the strict directives", () => {
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
  });
});

describe("createNonce", () => {
  it("returns a different base64 value each time", () => {
    const first = createNonce();
    const second = createNonce();
    expect(first).not.toBe(second);
    expect(first).toMatch(/^[A-Za-z0-9+/=]+$/);
  });
});
