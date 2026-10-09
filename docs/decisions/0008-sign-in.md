# 0008: Sign-in with Google and GitHub

Status: accepted

## Context

People want to sign in so that, later, their plans can follow them. Phase 4a adds only the sign-in itself. Plans still live in the browser ([0006](0006-zero-cost.md)).

The [zero-cost rule](0006-zero-cost.md) rules out a database, a hosted auth service (Clerk, Auth0, Supabase Auth, Firebase Auth), email and SMS. Google OAuth and GitHub OAuth are free, need no billing account for basic sign-in, and let us keep nothing on the server: the session is a cookie.

## Options compared

Checked on 2026-10-09 against Next.js 16.4 and React 19.3.

|                           | A. Auth.js (`next-auth`)                                                                                                    | B. `arctic` and `jose`                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Release                   | `4.24.15` is stable but written for the Pages Router. `5.0.0-beta.32` is the App Router version and is still a beta         | `arctic` 3.7.0, `jose` 6.2.12, both stable                              |
| Next.js 16                | v4 and v5 beta both list Next 16 in their peer ranges                                                                       | No peer dependencies                                                    |
| Footprint                 | v5 brings `@auth/core`, `oauth4webapi`, `preact` and `jose`, plus optional peers for email and passkeys that we do not use  | `arctic` has three small dependencies; `jose` has none                  |
| Fit with the requirements | Needs overrides for the cookie contents, redirect rules, CSRF, rate limiting and the CSP, and adds its own pages and routes | Each requirement is a few lines of our own code with a direct unit test |
| Licence                   | ISC                                                                                                                         | MIT                                                                     |

## Decision

Use option B. `arctic` builds the authorization URLs and exchanges the code for tokens. `jose` encrypts the session cookie. Everything else is about 300 lines in `src/lib/auth/`, so every security step is visible and tested.

Auth.js v5 has stayed in beta, v4 does not fit the App Router, and we would have replaced most of its behaviour anyway.

## How it works

1. `GET /api/auth/sign-in/{google|github}?next=/path` checks the rate limit and the configuration, creates a random `state` (and, for Google, a PKCE code verifier), stores them in a short-lived encrypted cookie and redirects to the provider.
2. The provider redirects to `GET /api/auth/callback/{provider}`. The callback checks the rate limit, decrypts the cookie, checks the provider matches, compares `state` in constant time, and exchanges the code (sending the code verifier for Google). Any failure sends the person to `/sign-in?error=...` with a generic message and logs nothing.
3. The callback reduces the result to provider, provider user id and display name, sets the session cookie, deletes the transaction cookie and redirects to the allowlisted page.
4. `POST /api/auth/sign-out` clears the cookie. It needs a same-origin `Origin` header and a CSRF token.

### Scopes

Google: `openid profile email`. GitHub: `read:user user:email`. Nothing else is requested. The email scopes are required by the brief but the code never reads or stores the email, the avatar or any token. The [privacy page](../../src/app/privacy/page.tsx) says so.

### PKCE and state

- `state` is random (arctic `generateState`), stored in the transaction cookie and compared on the callback.
- Google uses PKCE with S256. The verifier lives only in the encrypted transaction cookie and is sent with the token request.
- **GitHub: state only, no PKCE.** `arctic`'s GitHub provider has no PKCE support (checked in its source, version 3.7.0). Authorization code interception is still limited by the client secret, the `state` check and the exact redirect URI registered with GitHub. If GitHub support is later added to `arctic`, or we write the GitHub request ourselves, PKCE should be added.

### Session cookie

- Name `whichai_session` (`__Host-whichai_session` in production, which browsers only accept when Secure, Path=/ and no Domain).
- `HttpOnly`, `Secure` in production, `SameSite=Lax`, `Path=/`, 7 days.
- The value is a JWE (`alg: dir`, `enc: A256GCM`), so it is encrypted and tamper-evident. Contents: provider, provider user id and display name, plus the standard `aud`, `iat` and `exp`. No email, token or avatar.
- Keys are derived from `AUTH_SECRET` with SHA-256 and a purpose label (`session`, `oauth`, `csrf`), so a token for one purpose is rejected for another. `AUTH_SECRET` must be at least 43 characters (32 bytes in base64) or sign-in is switched off.

### Redirects

After sign-in the target comes from an exact allowlist of paths (`src/lib/auth/redirect.ts`). Anything else, including absolute URLs, `//host`, backslashes and unknown paths, becomes `/`. Redirect URLs are built from `NEXT_PUBLIC_SITE_URL`, never from the `Host` header.

### Sign-out and CSRF

Sign-out is a `POST` form. The server renders a hidden token that is an HMAC of the session cookie, so it is bound to one sign-in. The route also requires an `Origin` header equal to the site origin. A missing, foreign or `null` origin, a missing token or a wrong token returns 403. A `GET` returns 405. The form works without JavaScript.

### Content Security Policy

No change. The sign-in buttons are plain links, and a link navigation to another site is not governed by `form-action`. `form-action 'self'` still covers the sign-out form. No third-party script or image is allowed, and the account circle shows initials so `img-src` stays `'self' data:`.

### Rate limiting

`src/lib/auth/rate-limit.ts` is a fixed-window counter in process memory: 20 requests a minute per client address for each of sign-in, callback and sign-out. Limits:

- It is per server instance. On a serverless host each instance counts separately and a restart resets the counts.
- The address comes from `x-forwarded-for`, which a client can forge when the app is not behind a proxy that sets it. It slows casual abuse, not a determined one.
- The map is capped at 10,000 keys and is cleared if it fills.

A shared limiter needs storage and is out of scope under the zero-cost rule.

### Missing configuration

All five variables are optional and validated with Zod in `src/lib/env.ts`. If `AUTH_SECRET` or a provider's pair is missing or malformed, that part of sign-in is off. The build and the app still work, the popup shows "Sign-in is not configured on this server", and the routes redirect to `/sign-in?error=not-configured`. Warnings name variables, never values.

### Logging

Nothing in the sign-in code logs. Errors from providers are caught and replaced with a generic message.

## Consequences

- Stateless means no server-side revocation. Signing out deletes the cookie on that browser. A stolen cookie works until it expires (7 days) or `AUTH_SECRET` is changed, which signs everyone out.
- There is no session refresh. After seven days the person signs in again.
- Google's ID token is read without checking its signature. That is allowed because it arrives directly from Google's token endpoint over TLS (OpenID Connect Core, section 3.1.3.7).
- `NEXT_PUBLIC_SITE_URL` is inlined at build time, so a production build needs the final URL set before `npm run build`. The OAuth redirect URI is built from it.
- Google's brand rules ask for the Roboto font on the button. We use the site font, because loading Roboto would add a third-party request.
- A later phase can call `getSession()` from `src/lib/auth/get-session.ts` in a server component or route handler. Storing plans per user still needs a free storage option that has not been approved.
