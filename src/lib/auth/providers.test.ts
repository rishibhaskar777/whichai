// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SCOPES,
  completeSignIn,
  createAuthorizationRequest,
} from "./providers";
import {
  decodeTransaction,
  encodeTransaction,
  stateMatches,
} from "./transaction";

const credentials = { clientId: "client-id", clientSecret: "client-secret" };
const origin = "https://whichai.example";
const secret = "s".repeat(43);

afterEach(() => vi.unstubAllGlobals());

describe("authorization requests", () => {
  it("asks Google for the basic scopes with PKCE (S256) and a state", () => {
    const request = createAuthorizationRequest("google", credentials, origin);
    const params = request.url.searchParams;
    expect(request.url.origin).toBe("https://accounts.google.com");
    expect(params.get("response_type")).toBe("code");
    expect(params.get("scope")).toBe("openid profile email");
    expect(params.get("state")).toBe(request.state);
    expect(params.get("code_challenge_method")).toBe("S256");
    expect(params.get("code_challenge")).toBeTruthy();
    expect(request.codeVerifier).toBeTruthy();
    expect(params.get("redirect_uri")).toBe(
      `${origin}/api/auth/callback/google`,
    );
  });

  it("asks GitHub for the minimum scopes and a state", () => {
    const request = createAuthorizationRequest("github", credentials, origin);
    const params = request.url.searchParams;
    expect(request.url.origin).toBe("https://github.com");
    expect(params.get("scope")).toBe("read:user user:email");
    expect(params.get("state")).toBe(request.state);
    expect(params.get("redirect_uri")).toBe(
      `${origin}/api/auth/callback/github`,
    );
  });

  it("issues a new unpredictable state and verifier each time", () => {
    const first = createAuthorizationRequest("google", credentials, origin);
    const second = createAuthorizationRequest("google", credentials, origin);
    expect(first.state).not.toBe(second.state);
    expect(first.codeVerifier).not.toBe(second.codeVerifier);
    expect(first.state.length).toBeGreaterThanOrEqual(20);
  });

  it("requests nothing beyond the documented scopes", () => {
    expect(SCOPES.google).toEqual(["openid", "profile", "email"]);
    expect(SCOPES.github).toEqual(["read:user", "user:email"]);
  });
});

describe("state and verifier verification", () => {
  it("matches only an identical state", () => {
    expect(stateMatches("abc123", "abc123")).toBe(true);
    expect(stateMatches("abc123", "abc124")).toBe(false);
    expect(stateMatches("abc123", "abc12")).toBe(false);
    expect(stateMatches("abc123", "")).toBe(false);
  });

  it("round-trips the state and verifier through the transaction cookie", async () => {
    const transaction = {
      provider: "google",
      state: "state-value",
      codeVerifier: "verifier-value",
      next: "/projects",
    } as const;
    const token = await encodeTransaction(transaction, secret, 0);
    expect(await decodeTransaction(token, secret, 1000)).toEqual(transaction);
  });

  it("expires the transaction after ten minutes", async () => {
    const token = await encodeTransaction(
      { provider: "github", state: "s", next: "/" },
      secret,
      0,
    );
    expect(await decodeTransaction(token, secret, 9 * 60_000)).not.toBeNull();
    expect(await decodeTransaction(token, secret, 11 * 60_000)).toBeNull();
  });

  it("rejects a transaction made with another secret", async () => {
    const token = await encodeTransaction(
      { provider: "github", state: "s", next: "/" },
      "y".repeat(43),
      0,
    );
    expect(await decodeTransaction(token, secret, 0)).toBeNull();
  });

  it("sends the code verifier with the Google token request", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ error: "invalid_grant" }, { status: 400 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      completeSignIn("google", credentials, origin, "code", "verifier-value"),
    ).rejects.toThrow();
    const request = (fetchMock.mock.calls[0] as unknown as [Request])[0];
    expect(await request.text()).toContain("code_verifier=verifier-value");
  });

  it("refuses to complete a Google sign-in without a verifier", async () => {
    await expect(
      completeSignIn("google", credentials, origin, "code", undefined),
    ).rejects.toThrow();
  });
});

describe("profiles", () => {
  it("keeps only provider, id and name from a GitHub sign-in", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          Response.json({ access_token: "test-access-token", token_type: "bearer" }),
        )
        .mockResolvedValueOnce(
          Response.json({
            id: 99,
            login: "ada",
            name: "Ada Lovelace",
            email: "ada@example.com",
            avatar_url: "https://avatars.example/ada.png",
          }),
        ),
    );
    const result = await completeSignIn(
      "github",
      credentials,
      origin,
      "code",
      undefined,
    );
    expect(result).toEqual({
      provider: "github",
      id: "99",
      name: "Ada Lovelace",
    });
  });

  it("uses the GitHub login when there is no display name", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          Response.json({ access_token: "t", token_type: "bearer" }),
        )
        .mockResolvedValueOnce(
          Response.json({ id: 7, login: "ada", name: null }),
        ),
    );
    const result = await completeSignIn(
      "github",
      credentials,
      origin,
      "code",
      undefined,
    );
    expect(result.name).toBe("ada");
  });

  it("reads the name from the Google ID token", async () => {
    const encode = (value: object) =>
      Buffer.from(JSON.stringify(value)).toString("base64url");
    const idToken = `${encode({ alg: "none" })}.${encode({ sub: "1234", name: "Ada L", email: "a@b.c" })}.sig`;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        Response.json({
          access_token: "t",
          token_type: "Bearer",
          id_token: idToken,
        }),
      ),
    );
    const result = await completeSignIn(
      "google",
      credentials,
      origin,
      "code",
      "verifier",
    );
    expect(result).toEqual({ provider: "google", id: "1234", name: "Ada L" });
  });
});
