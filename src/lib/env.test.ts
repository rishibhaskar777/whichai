import { describe, expect, it, vi } from "vitest";
import { authSetupWarning, parseAuthEnv, parseEnv } from "./env";

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

describe("parseAuthEnv", () => {
  const secret = "a".repeat(43);
  const google = { GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "shh" };
  const github = { GITHUB_CLIENT_ID: "id", GITHUB_CLIENT_SECRET: "shh" };

  it("returns null when nothing is configured", () => {
    expect(parseAuthEnv({})).toBeNull();
  });

  it("returns null when the secret is missing", () => {
    expect(parseAuthEnv({ ...google })).toBeNull();
  });

  it("returns null and names the variable when the secret is too short", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(parseAuthEnv({ AUTH_SECRET: "short", ...google })).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("AUTH_SECRET"));
    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining("short"));
    warn.mockRestore();
  });

  it("enables only providers that have both an id and a secret", () => {
    const auth = parseAuthEnv({
      AUTH_SECRET: secret,
      ...google,
      GITHUB_CLIENT_ID: "id",
    });
    expect(auth?.providers.google).toEqual({
      clientId: "id",
      clientSecret: "shh",
    });
    expect(auth?.providers.github).toBeUndefined();
  });

  it("treats blank values as missing", () => {
    expect(
      parseAuthEnv({ AUTH_SECRET: secret, GOOGLE_CLIENT_ID: "  ", ...github }),
    ).toMatchObject({ providers: { github: expect.any(Object) } });
  });

  it("returns null when no provider is complete", () => {
    expect(parseAuthEnv({ AUTH_SECRET: secret })).toBeNull();
  });
});

describe("authSetupWarning", () => {
  const secret = "a".repeat(43);

  it("is null when both providers are ready", () => {
    expect(
      authSetupWarning({
        AUTH_SECRET: secret,
        GOOGLE_CLIENT_ID: "i",
        GOOGLE_CLIENT_SECRET: "s",
        GITHUB_CLIENT_ID: "i",
        GITHUB_CLIENT_SECRET: "s",
      }),
    ).toBeNull();
  });

  it("names the missing variables and no values", () => {
    const warning = authSetupWarning({
      AUTH_SECRET: secret,
      GOOGLE_CLIENT_ID: "my-id-value",
      GOOGLE_CLIENT_SECRET: "my-secret-value",
    });
    expect(warning).toContain("GitHub");
    expect(warning).toContain("GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET");
    expect(warning).not.toContain("AUTH_SECRET");
    expect(warning).not.toContain("my-");
  });

  it("asks for AUTH_SECRET when nothing is set", () => {
    expect(authSetupWarning({})).toContain("AUTH_SECRET");
  });
});
