# 0003: Content Security Policy approach

Status: accepted

## Context

The security checklist requires a CSP with a per-request nonce and no `unsafe-inline` or `unsafe-eval` in production.

## Decision

`src/proxy.ts` generates a nonce for every request and sets the policy built by `src/lib/security/csp.ts`. The file is named `proxy.ts` because Next.js 16 renamed the `middleware.ts` convention; the behaviour is the same. The builder is a pure function with unit tests.

Production policy:

- `script-src 'self' 'nonce-…' 'strict-dynamic'`. Next.js reads the nonce from the request's CSP header and applies it to its own scripts.
- `style-src 'self'` with no nonce. All styles are CSS Modules compiled to same-origin stylesheets. The code never uses `style` attributes or `<style>` tags. Where JavaScript needs to set a size (the growing textarea), it uses the CSSOM (`element.style.height`), which the policy permits.
- `img-src 'self' data:`, `font-src 'self'`, `connect-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`, `upgrade-insecure-requests`.

Development adds `'unsafe-eval'` to scripts, `'unsafe-inline'` to styles and `ws:`/`wss:` to connections, because the dev server needs them. `upgrade-insecure-requests` is omitted in development.

The theme is stored in a cookie that the server reads, so the correct `data-theme` is in the first HTML and no inline script is needed.

Zod is configured with `jitless: true` in `src/lib/schemas/zod.ts`, which every schema file imports, because Zod's default probe calls `new Function()`, which the policy blocks and reports.

## Consequences

- Every page is rendered per request, since a nonce cannot exist in prerendered HTML. Static generation and CDN caching of pages are not available.
- Inline scripts and styles cannot be added without a nonce or a policy change.
- Third-party scripts, fonts or images need an explicit policy entry and a documented reason.
