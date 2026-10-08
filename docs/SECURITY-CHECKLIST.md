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
- [ ] Cookies (once used): `HttpOnly`, `Secure`, `SameSite`
- [ ] State-changing requests protected against CSRF
- [ ] Authorization checked on the server for every protected action (Phase 4)
- [ ] Logs contain no secrets or personal data

## Dependencies

- [ ] `npm audit` shows no high or critical issues, or each is documented
- [ ] Lockfile committed; `npm ci` used in CI
- [ ] New dependencies reviewed for maintenance, size and licence
- [ ] No third-party scripts or trackers without a documented reason

## Deployment

- [ ] HTTPS only, with HSTS
- [ ] Environment variables set in the host, not in code
- [ ] Production build used; source maps not publicly exposed
- [ ] Headers verified against the deployed site, not only locally

## Verify

```bash
curl -sI https://[your-domain] | grep -iE "content-security|strict-transport|x-content|referrer|permissions|cross-origin"
```
