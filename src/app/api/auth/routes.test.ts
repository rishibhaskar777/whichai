// @vitest-environment node
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCsrfToken } from "@/lib/auth/csrf";
import {
  decodeSession,
  encodeSession,
  sessionCookieName,
} from "@/lib/auth/session";
import {
  encodeTransaction,
  transactionCookieName,
} from "@/lib/auth/transaction";
import { GET as callback } from "./callback/[provider]/route";
import { POST as signOut } from "./sign-out/route";
import { GET as signIn } from "./sign-in/[provider]/route";

const secret = "s".repeat(43);
const siteOrigin = "https://whichai.example";
const configured = {
  secret,
  siteOrigin,
  providers: {
    google: { clientId: "gid", clientSecret: "gsecret" },
    github: { clientId: "hid", clientSecret: "hsecret" },
  },
};

const state = vi.hoisted(() => ({
  config: null as unknown,
  production: false,
}));

vi.mock("@/lib/auth/config", () => ({
  getAuthConfig: () => state.config,
  isProduction: () => state.production,
}));

vi.mock("@/lib/auth/providers", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/auth/providers")>()),
  completeSignIn: vi.fn(async () => ({
    provider: "github",
    id: "99",
    name: "Ada Lovelace",
  })),
}));

let counter = 0;
function freshIp() {
  counter += 1;
  return `10.0.0.${counter}`;
}

function request(
  path: string,
  init: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  } = {},
) {
  return new NextRequest(`${siteOrigin}${path}`, {
    method: init.method ?? "GET",
    ...(init.body === undefined ? {} : { body: init.body }),
    headers: { "x-forwarded-for": freshIp(), ...init.headers },
  });
}

const ctx = (provider: string) => ({ params: Promise.resolve({ provider }) });

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", siteOrigin);
  state.config = configured;
  state.production = false;
});

describe("sign-in route", () => {
  it("sends a missing-config request to the sign-in page, not an error page", async () => {
    state.config = null;
    const response = await signIn(
      request("/api/auth/sign-in/google"),
      ctx("google"),
    );
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      `${siteOrigin}/sign-in?error=not-configured`,
    );
  });

  it("treats a provider without credentials as not configured", async () => {
    state.config = {
      ...configured,
      providers: { github: configured.providers.github },
    };
    const response = await signIn(
      request("/api/auth/sign-in/google"),
      ctx("google"),
    );
    expect(response.headers.get("location")).toContain("error=not-configured");
  });

  it("rejects unknown providers", async () => {
    const response = await signIn(
      request("/api/auth/sign-in/facebook"),
      ctx("facebook"),
    );
    expect(response.headers.get("location")).toContain("error=not-configured");
  });

  it("redirects to Google with PKCE and sets a short-lived transaction cookie", async () => {
    const response = await signIn(
      request("/api/auth/sign-in/google?next=/projects"),
      ctx("google"),
    );
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.origin).toBe("https://accounts.google.com");
    expect(location.searchParams.get("code_challenge_method")).toBe("S256");
    expect(location.searchParams.get("state")).toBeTruthy();

    const cookie = response.cookies.get(transactionCookieName(false));
    expect(cookie).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("marks the transaction cookie Secure and __Host- prefixed in production", async () => {
    state.production = true;
    const response = await signIn(
      request("/api/auth/sign-in/github"),
      ctx("github"),
    );
    expect(response.cookies.get("__Host-whichai_oauth")).toMatchObject({
      secure: true,
      httpOnly: true,
    });
  });

  it("ignores a next value outside the allowlist", async () => {
    const response = await signIn(
      request("/api/auth/sign-in/github?next=https://evil.example"),
      ctx("github"),
    );
    const cookie = response.cookies.get(transactionCookieName(false))?.value;
    expect(cookie).toBeTruthy();
    const { decodeTransaction } = await import("@/lib/auth/transaction");
    expect((await decodeTransaction(cookie ?? "", secret))?.next).toBe("/");
  });

  it("limits repeated requests from one address", async () => {
    const headers = { "x-forwarded-for": "203.0.113.9" };
    const statuses: string[] = [];
    for (let index = 0; index < 22; index += 1) {
      const response = await signIn(
        new NextRequest(`${siteOrigin}/api/auth/sign-in/github`, { headers }),
        ctx("github"),
      );
      statuses.push(response.headers.get("location") ?? "");
    }
    expect(statuses[0]).toContain("github.com");
    expect(statuses[21]).toContain("error=rate-limited");
  });
});

describe("callback route", () => {
  async function callbackRequest(options: {
    stateParam?: string;
    code?: string | null;
    extra?: string;
    next?: string;
    provider?: "google" | "github";
    cookie?: string | null;
  }) {
    const provider = options.provider ?? "github";
    const token =
      options.cookie === undefined
        ? await encodeTransaction(
            {
              provider,
              state: "expected-state",
              codeVerifier: "verifier",
              next: options.next ?? "/projects",
            },
            secret,
          )
        : options.cookie;
    const params = new URLSearchParams();
    if (options.code !== null) params.set("code", options.code ?? "the-code");
    params.set("state", options.stateParam ?? "expected-state");
    const headers: Record<string, string> = {};
    if (token) headers.cookie = `${transactionCookieName(false)}=${token}`;
    return callback(
      request(
        `/api/auth/callback/${provider}?${params}${options.extra ?? ""}`,
        {
          headers,
        },
      ),
      ctx(provider),
    );
  }

  it("creates a session cookie and returns to the allowlisted page", async () => {
    const response = await callbackRequest({});
    expect(response.headers.get("location")).toBe(`${siteOrigin}/projects`);
    const session = response.cookies.get(sessionCookieName(false));
    expect(session).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 604800,
    });
    expect(await decodeSession(session?.value ?? "", secret)).toEqual({
      provider: "github",
      id: "99",
      name: "Ada Lovelace",
    });
    expect(response.cookies.get(transactionCookieName(false))?.maxAge).toBe(0);
  });

  it("sets the Secure flag on the session cookie in production", async () => {
    state.production = true;
    const token = await encodeTransaction(
      { provider: "github", state: "expected-state", next: "/" },
      secret,
    );
    const response = await callback(
      request("/api/auth/callback/github?code=c&state=expected-state", {
        headers: { cookie: `__Host-whichai_oauth=${token}` },
      }),
      ctx("github"),
    );
    expect(response.cookies.get("__Host-whichai_session")).toMatchObject({
      secure: true,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  });

  it("refuses a state that does not match", async () => {
    const response = await callbackRequest({ stateParam: "forged" });
    expect(response.headers.get("location")).toContain("error=failed");
    expect(response.cookies.get(sessionCookieName(false))).toBeUndefined();
  });

  it("refuses a callback with no transaction cookie", async () => {
    const response = await callbackRequest({ cookie: null });
    expect(response.headers.get("location")).toContain("error=failed");
    expect(response.cookies.get(sessionCookieName(false))).toBeUndefined();
  });

  it("refuses a transaction started for another provider", async () => {
    const token = await encodeTransaction(
      { provider: "google", state: "expected-state", next: "/" },
      secret,
    );
    const response = await callbackRequest({ cookie: token });
    expect(response.headers.get("location")).toContain("error=failed");
  });

  it("refuses a callback without a code", async () => {
    const response = await callbackRequest({ code: null });
    expect(response.headers.get("location")).toContain("error=failed");
  });

  it("reports a cancelled sign-in generically", async () => {
    const response = await callbackRequest({ extra: "&error=access_denied" });
    expect(response.headers.get("location")).toContain("error=denied");
  });

  it("never redirects to a path outside the allowlist", async () => {
    const response = await callbackRequest({ next: "//evil.example" });
    expect(response.headers.get("location")).toBe(`${siteOrigin}/`);
  });

  it("returns a generic failure when the provider exchange throws", async () => {
    const { completeSignIn } = await import("@/lib/auth/providers");
    vi.mocked(completeSignIn).mockRejectedValueOnce(new Error("token abc123"));
    const response = await callbackRequest({});
    const location = response.headers.get("location") ?? "";
    expect(location).toContain("error=failed");
    expect(location).not.toContain("abc123");
    expect(response.cookies.get(sessionCookieName(false))).toBeUndefined();
  });

  it("reports missing configuration without throwing", async () => {
    state.config = null;
    const response = await callbackRequest({});
    expect(response.headers.get("location")).toContain("error=not-configured");
  });
});

describe("sign-out route", () => {
  async function signOutRequest(options: {
    origin?: string | null;
    csrf?: string | null;
    withSession?: boolean;
  }) {
    const sessionToken = await encodeSession(
      { provider: "github", id: "99", name: "Ada" },
      secret,
    );
    const csrf =
      options.csrf === undefined
        ? await createCsrfToken(sessionToken, secret)
        : options.csrf;
    const headers: Record<string, string> = {
      "content-type": "application/x-www-form-urlencoded",
    };
    if (options.origin !== null) headers.origin = options.origin ?? siteOrigin;
    if (options.withSession !== false) {
      headers.cookie = `${sessionCookieName(false)}=${sessionToken}`;
    }
    return signOut(
      request("/api/auth/sign-out", {
        method: "POST",
        headers,
        body: csrf === null ? "" : new URLSearchParams({ csrf }).toString(),
      }),
    );
  }

  it("clears the session cookie when the token and origin are right", async () => {
    const response = await signOutRequest({});
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(`${siteOrigin}/`);
    expect(response.cookies.get(sessionCookieName(false))).toMatchObject({
      value: "",
      maxAge: 0,
    });
  });

  it("refuses a request without the CSRF token", async () => {
    const response = await signOutRequest({ csrf: null });
    expect(response.status).toBe(403);
    expect(response.cookies.get(sessionCookieName(false))).toBeUndefined();
  });

  it("refuses a wrong CSRF token", async () => {
    expect((await signOutRequest({ csrf: "AAAA" })).status).toBe(403);
  });

  it("refuses a request from another origin", async () => {
    expect(
      (await signOutRequest({ origin: "https://evil.example" })).status,
    ).toBe(403);
  });

  it("refuses a request with no Origin header", async () => {
    expect((await signOutRequest({ origin: null })).status).toBe(403);
  });

  it("refuses a request with no session", async () => {
    expect((await signOutRequest({ withSession: false })).status).toBe(403);
  });

  it("is not available as GET", async () => {
    const routes = await import("./sign-out/route");
    expect("GET" in routes).toBe(false);
  });
});
