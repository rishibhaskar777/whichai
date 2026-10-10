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

## News feeds

- [ ] The server requests only the addresses in `src/data/news/sources.json`; no visitor input reaches a request, so there is no server-side request forgery surface
- [ ] Every feed address is https, on the source's `officialDomains`, and is validated by a schema at start-up and in tests
- [ ] Feed requests have a 5 second timeout, follow no redirect and read at most 1 MB
- [ ] The browser makes no request to a news site; CSP `connect-src` stays `'self'`
- [ ] Feed text is untrusted: HTML is stripped, `<script>` and `<style>` content is removed, nothing is rendered with `dangerouslySetInnerHTML`, the DOCTYPE is removed before parsing, the parser runs with entity processing off, and nesting is limited
- [ ] An item link must be https, carry no credentials and be on the source's `officialDomains`; anything else drops the item
- [ ] Only title, link, date, source id and a summary of at most 160 characters are kept; full articles are never copied
- [ ] A failing feed never fails a page, and its warning in the log holds the feed id and a short reason only
- [ ] "Affects your plans" runs in the browser against local data; saved plans and tool ids are not sent anywhere
- [ ] `/what-changed` query values (`q`, `tag`, `source`, `page`) are validated, fall back to defaults and are only ever rendered as text
- [ ] The weekly workflow also fetches every news source (`scripts/check-news.ts`) and reports failing or quiet feeds in the existing issue; it has the same `contents: read` and `issues: write` permissions
- [ ] New sources follow [NEWS-SOURCES.md](NEWS-SOURCES.md): official, fetched and read, dated items, links on the source's own domains

## Tool discovery

- [ ] The discovery workflows have `contents: read` and `issues: write` only, actions pinned to full commit SHAs, `npm ci --ignore-scripts`, and (for the weekly job) a concurrency group; a test checks each of these
- [ ] The weekly job never writes to the catalogue, pushes a commit or opens a pull request; only `discover:import`, run by hand, writes catalogue files
- [ ] Only free, public endpoints are used, with no key other than the workflow's own `GITHUB_TOKEN`, which is sent to `api.github.com` only
- [ ] Each request has a 10 second timeout, a `User-Agent` naming the project, no redirect and a size limit; a failing source is skipped for the run
- [ ] A candidate's website gets one HEAD or GET request: https only, no credentials, port or IP address, redirects reported and never followed, no body read
- [ ] Candidate text is cleaned (control, invisible and bidirectional characters, angle brackets, backticks, length) and appears only in code spans or code blocks; titles use letters, digits and a few marks; no `@mention`, no `#123` reference, no clickable candidate text; only https addresses are shown
- [ ] The hidden state blocks (watchlist and candidate issues) are escaped so they cannot end their comment, the last block wins, every field is validated on read, and only issues written by `github-actions[bot]` with the `discovery-watchlist` or `tool-candidate` label are read as state
- [ ] The watchlist body is kept under GitHub's 65,536 character limit by construction: compact fields, at most 100 tracked candidates, and the lowest scores dropped first if it is still too long
- [ ] The watchlist is edited in place and never commented on; at most 5 new candidate issues per run; closed issues are never reopened; rejected names and domains and expired candidates are never re-added early
- [ ] The approval workflow reads the issue through the API and never interpolates issue or label text into a script
- [ ] Draft records are unverified with a price placeholder and an empty `getIt`; `discover:import` validates against the catalogue schema and cross-file checks and asks for confirmation before writing
- [ ] Every candidate is reviewed by hand with the checklist in [TOOL-DISCOVERY.md](TOOL-DISCOVERY.md) before `approved` is added

## Pricing and checkout

- [ ] No payment gateway, payment SDK, external script or external font is loaded; CSP `connect-src` and `script-src` stay as they are
- [ ] No page asks for card, UPI or bank details, and `/checkout` has no form field; a test checks the page and the dialog
- [ ] The Pay button and "Manage subscription" make no network request; a test stubs `fetch` and checks it is not called
- [ ] `/checkout` query values (`plan`, `billing`) are validated with Zod; anything invalid, including Free, redirects to `/pricing`, and values are only ever rendered as text
- [ ] `src/data/pricing/plans.json` is validated at start-up and in tests; prices are whole rupees and every visible string has both languages
- [ ] The Free plan lists only features that work today; paid features are labelled as planned
- [ ] Nobody can be moved off Free: `getCurrentPlan()` ignores the request and the session until a verified subscription store exists
- [ ] Legal pages carry the draft note until they have been reviewed
- [ ] Before real payments: gateway-hosted payment page, signed and idempotent webhooks, no card data stored or logged, secrets only in the host environment (see [0014](decisions/0014-pricing-preview.md))

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
