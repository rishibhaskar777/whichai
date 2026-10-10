# Security checklist

Apply to every release and re-check when a phase adds a new input, route or dependency.

## Repository and account

- [ ] Two-factor authentication on the GitHub account
- [ ] `main` protected: pull request required, status checks required, force-push disabled
- [ ] Secret scanning and push protection enabled
- [ ] Dependabot alerts and security updates enabled
- [ ] Code scanning (CodeQL) enabled
- [ ] No secrets in the repository or its history; `.env.local` ignored

## Application

- [ ] All external input validated on the server with a schema (request bodies, query strings, environment variables)
- [ ] Output encoding handled by the framework; no `dangerouslySetInnerHTML` without a reviewed reason
- [ ] Content Security Policy with per-request nonce; no `unsafe-inline` or `unsafe-eval` in production
- [ ] Security headers set: `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options` or CSP `frame-ancestors`, `Cross-Origin-Opener-Policy`
- [ ] `X-Powered-By` disabled
- [ ] Rate limiting on every route that accepts input
- [ ] Request body size limits
- [ ] Error responses do not leak stack traces or internals
- [ ] Cookies: `HttpOnly`, `Secure` in production, `SameSite=Lax`, `Path=/`, `__Host-` prefix in production, contents encrypted and expiring (session 7 days, sign-in transaction 10 minutes); nothing but provider, provider id and display name stored
- [ ] State-changing requests protected against CSRF (sign-out is POST only, with an HMAC token bound to the session and an Origin check)
- [ ] OAuth: authorization code flow with a random `state` verified on callback; PKCE for providers that support it (GitHub does not through `arctic`, see 0008); minimum scopes only (Google `openid profile email`, GitHub `read:user user:email`)
- [ ] OAuth: post-sign-in redirects only to the path allowlist; redirect URLs built from `NEXT_PUBLIC_SITE_URL`, not the `Host` header
- [ ] OAuth: no tokens, codes, emails or cookies logged or shown; user-facing errors are generic
- [ ] OAuth: `AUTH_SECRET` and client secrets only in the host environment and `.env.local`, never in client code; the CSP is not widened for sign-in
- [ ] Authorization checked on the server for every protected action, using `getSession()` (once a protected action exists)
- [ ] Logs contain no secrets or personal data, and no goal text
- [ ] Local data: everything read from IndexedDB or localStorage is validated with Zod and invalid records are dropped; stored text is only ever rendered as text
- [ ] Untrusted imports: a backup file is size-checked (1 MB) before it is read, parsed as JSON, validated against the backup schema and per record, and counts are previewed before Merge or Replace; Replace needs confirmation
- [ ] Fragment links: `/plan#...` is limited to 4 KB, must be base64url, and is validated with the strict plan-request schema before use; failures show a friendly message and nothing is logged
- [ ] The share link holds the plan request only, never the goal text, and sits after the `#` so it is not sent to the server
- [ ] Local data limits are enforced (100 plans, 200 history entries, total size) and a clear message is shown when full
- [ ] "Clear all data" needs the word CLEAR typed and also removes the theme and language cookies
- [ ] Only theme and language are stored in cookies, as one word each, with `SameSite=Lax` and no personal data

## Download links

- [ ] Every address in the catalogue is https and on the tool's `officialDomains` or on the official store allowlist; no URL shorteners and no third-party download sites (enforced by `src/lib/catalogue/links.ts` and its tests)
- [ ] A shared host (GitHub, an app store) is allowed only for the owner named in `officialDomains` or for a listing a person has checked
- [ ] An unknown link is left out, so the interface falls back to the official homepage
- [ ] `linkCheckedOn` never sets `verified`, and only a person sets `verified`
- [ ] Install commands are one line of text with no `sudo`, shown with a copy button and never executed; addresses inside them are on the tool's domains
- [ ] External links open in a new tab with `rel="noopener noreferrer"`, and the Get it block tells people to check the address bar
- [ ] The link checker is run by hand or by the weekly workflow (`contents: read`, `issues: write`, actions pinned to SHAs), and its findings are reviewed
- [ ] Library and compare query parameters are validated and fall back to defaults; nothing from them is rendered as HTML

## Dependencies

- [ ] `npm audit` shows no high or critical issues, or each is documented
- [ ] Lockfile committed; `npm ci` used in CI
- [ ] New dependencies reviewed for maintenance, size and licence
- [ ] No third-party scripts or trackers without a documented reason

Documented exception: `braces` (GHSA-vfj7-8cjw-p6xm, high, no patched version as of 2026-10-09) is reachable only through `eslint-config-next`, a development dependency that is not part of the production build. CI therefore runs `npm audit --omit=dev --audit-level=high`. Remove the exception when a fix is released.

## Deployment

- [ ] HTTPS only, with HSTS
- [ ] Environment variables set in the host, not in code
- [ ] Production build used; source maps not publicly exposed
- [ ] Headers verified against the deployed site, not only locally

## Verify

```bash
curl -sI https://[your-domain] | grep -iE "content-security|strict-transport|x-content|referrer|permissions|cross-origin"
```
