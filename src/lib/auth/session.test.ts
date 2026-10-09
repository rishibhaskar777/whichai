// @vitest-environment node
import { jwtDecrypt } from "jose";
import { describe, expect, it } from "vitest";
import { getInitials } from "./initials";
import { createCsrfToken, isSameOrigin, verifyCsrfToken } from "./csrf";
import {
  SESSION_MAX_AGE_SECONDS,
  cleanDisplayName,
  decodeSession,
  deriveKey,
  encodeSession,
  sessionCookieName,
  sessionCookieOptions,
} from "./session";
import { encodeTransaction } from "./transaction";

const secret = "s".repeat(43);
const session = {
  provider: "github",
  id: "4242",
  name: "Ada Lovelace",
} as const;
const now = Date.UTC(2026, 9, 9);
const weekMs = SESSION_MAX_AGE_SECONDS * 1000;

describe("session encode and decode", () => {
  it("round-trips the three stored values", async () => {
    const token = await encodeSession(session, secret, now);
    expect(await decodeSession(token, secret, now + 1000)).toEqual(session);
  });

  it("stores only provider, id and name beside the standard claims", async () => {
    const token = await encodeSession(session, secret, now);
    const { payload } = await jwtDecrypt(
      token,
      await deriveKey(secret, "session"),
    );
    expect(Object.keys(payload).sort()).toEqual(
      ["aud", "exp", "iat", "id", "name", "provider"].sort(),
    );
  });

  it("encrypts the contents", async () => {
    const token = await encodeSession(session, secret, now);
    const readable = Buffer.from(
      token.split(".").join(""),
      "base64url",
    ).toString("latin1");
    expect(token).not.toContain("Lovelace");
    expect(readable).not.toContain("Lovelace");
  });

  it("expires after seven days", async () => {
    const token = await encodeSession(session, secret, now);
    expect(await decodeSession(token, secret, now + weekMs - 1000)).toEqual(
      session,
    );
    expect(await decodeSession(token, secret, now + weekMs + 1000)).toBeNull();
  });

  it("rejects a token made with another secret", async () => {
    const token = await encodeSession(session, "x".repeat(43), now);
    expect(await decodeSession(token, secret, now)).toBeNull();
  });

  it("rejects a tampered token", async () => {
    const token = await encodeSession(session, secret, now);
    const tampered = `${token.slice(0, -2)}${token.endsWith("AA") ? "BB" : "AA"}`;
    expect(await decodeSession(tampered, secret, now)).toBeNull();
  });

  it("rejects garbage", async () => {
    expect(await decodeSession("not-a-token", secret, now)).toBeNull();
    expect(await decodeSession("", secret, now)).toBeNull();
  });

  it("does not accept a sign-in transaction as a session", async () => {
    const token = await encodeTransaction(
      { provider: "github", state: "abc", next: "/" },
      secret,
      now,
    );
    expect(await decodeSession(token, secret, now)).toBeNull();
  });
});

describe("session cookie", () => {
  it("is HttpOnly, SameSite=Lax, path / and lasts 7 days", () => {
    expect(sessionCookieOptions(true)).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 604800,
    });
  });

  it("is Secure in production only", () => {
    expect(sessionCookieOptions(true).secure).toBe(true);
    expect(sessionCookieOptions(false).secure).toBe(false);
  });

  it("uses the __Host- prefix in production only", () => {
    expect(sessionCookieName(true)).toBe("__Host-whichai_session");
    expect(sessionCookieName(false)).toBe("whichai_session");
  });
});

describe("display names", () => {
  it("builds initials from the first two words", () => {
    expect(getInitials("Ada Lovelace")).toBe("AL");
    expect(getInitials("ada byron lovelace")).toBe("AB");
    expect(getInitials("madonna")).toBe("M");
    expect(getInitials("  ")).toBe("?");
  });

  it("strips control characters and limits the length", () => {
    expect(cleanDisplayName("A\u0000d‮a  L")).toBe("Ada L");
    expect(cleanDisplayName("x".repeat(200))?.length).toBe(80);
    expect(cleanDisplayName("   ")).toBeNull();
    expect(cleanDisplayName(undefined)).toBeNull();
  });
});

describe("sign-out CSRF token", () => {
  it("accepts the token made for the same session", async () => {
    const token = await createCsrfToken("session-a", secret);
    expect(await verifyCsrfToken(token, "session-a", secret)).toBe(true);
  });

  it("rejects a token from another session, secret or a bad value", async () => {
    const token = await createCsrfToken("session-a", secret);
    expect(await verifyCsrfToken(token, "session-b", secret)).toBe(false);
    expect(await verifyCsrfToken(token, "session-a", "y".repeat(43))).toBe(
      false,
    );
    expect(await verifyCsrfToken("", "session-a", secret)).toBe(false);
    expect(await verifyCsrfToken("%%%", "session-a", secret)).toBe(false);
  });

  it("requires the Origin header to match the site", () => {
    const site = "https://whichai.example";
    expect(isSameOrigin(site, site)).toBe(true);
    expect(isSameOrigin("https://evil.example", site)).toBe(false);
    expect(isSameOrigin("null", site)).toBe(false);
    expect(isSameOrigin(null, site)).toBe(false);
  });
});
