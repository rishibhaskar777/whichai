import {
  GitHub,
  Google,
  decodeIdToken,
  generateCodeVerifier,
  generateState,
} from "arctic";
import { z } from "zod";
import type { ProviderId } from "@/lib/env";
import { cleanDisplayName, type SessionData } from "./session";

export interface ProviderCredentials {
  clientId: string;
  clientSecret: string;
}

/* The minimum each provider needs to tell us who signed in. Nothing else is requested. */
export const SCOPES: Readonly<Record<ProviderId, readonly string[]>> = {
  google: ["openid", "profile", "email"],
  github: ["read:user", "user:email"],
};

const PROFILE_TIMEOUT_MS = 8000;

export function isProviderId(value: string): value is ProviderId {
  return value === "google" || value === "github";
}

export function callbackUrl(siteOrigin: string, provider: ProviderId): string {
  return `${siteOrigin}/api/auth/callback/${provider}`;
}

export interface AuthorizationRequest {
  url: URL;
  state: string;
  /* The GitHub flow in arctic has no PKCE, so only Google gets a verifier. */
  codeVerifier?: string;
}

export function createAuthorizationRequest(
  provider: ProviderId,
  credentials: ProviderCredentials,
  siteOrigin: string,
): AuthorizationRequest {
  const { clientId, clientSecret } = credentials;
  const redirectUri = callbackUrl(siteOrigin, provider);
  const state = generateState();
  const scopes = [...SCOPES[provider]];

  if (provider === "google") {
    const codeVerifier = generateCodeVerifier();
    const url = new Google(
      clientId,
      clientSecret,
      redirectUri,
    ).createAuthorizationURL(state, codeVerifier, scopes);
    return { url, state, codeVerifier };
  }

  const url = new GitHub(
    clientId,
    clientSecret,
    redirectUri,
  ).createAuthorizationURL(state, scopes);
  return { url, state };
}

const googleClaimsSchema = z.object({
  sub: z.string().min(1).max(64),
  name: z.string().optional(),
  given_name: z.string().optional(),
});

const githubUserSchema = z.object({
  id: z.number().int().positive(),
  login: z.string().min(1),
  name: z.string().nullish(),
});

/*
 * Exchanges the code for tokens and reduces the result to the three values we
 * keep. The tokens, email and avatar are dropped here and never leave this
 * function. Throws on any failure; callers must not show the message.
 */
export async function completeSignIn(
  provider: ProviderId,
  credentials: ProviderCredentials,
  siteOrigin: string,
  code: string,
  codeVerifier: string | undefined,
): Promise<SessionData> {
  const { clientId, clientSecret } = credentials;
  const redirectUri = callbackUrl(siteOrigin, provider);

  if (provider === "google") {
    if (!codeVerifier) throw new Error("Missing code verifier");
    const tokens = await new Google(
      clientId,
      clientSecret,
      redirectUri,
    ).validateAuthorizationCode(code, codeVerifier);
    /*
     * The ID token arrives directly from Google's token endpoint over TLS, so
     * reading its claims without checking the signature is allowed by OpenID
     * Connect Core, section 3.1.3.7.
     */
    const claims = googleClaimsSchema.parse(decodeIdToken(tokens.idToken()));
    return buildSession(
      "google",
      claims.sub,
      claims.name ?? claims.given_name,
      "Google user",
    );
  }

  const tokens = await new GitHub(
    clientId,
    clientSecret,
    redirectUri,
  ).validateAuthorizationCode(code);
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokens.accessToken()}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "WhichAI",
    },
    signal: AbortSignal.timeout(PROFILE_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error("GitHub profile request failed");
  const user = githubUserSchema.parse(await response.json());
  return buildSession(
    "github",
    String(user.id),
    user.name ?? user.login,
    "GitHub user",
  );
}

function buildSession(
  provider: ProviderId,
  id: string,
  rawName: string | undefined,
  fallbackName: string,
): SessionData {
  return { provider, id, name: cleanDisplayName(rawName) ?? fallbackName };
}
