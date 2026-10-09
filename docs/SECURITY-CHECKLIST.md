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
- [ ] Logs contain no secrets or personal data

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
