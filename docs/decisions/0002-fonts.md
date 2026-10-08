# 0002: Typefaces

Status: accepted

## Context

The design principles ask for a heading typeface with some character and a plain, readable body face, both self-hosted. Inter, Roboto and a system-font heading are excluded.

## Decision

- **Headings: Fraunces** (variable serif, weight 600). A soft, slightly high-contrast serif that gives the greeting and section titles a human voice and sets the product apart from the usual sans-serif tool look.
- **Body: Instrument Sans** (weights 400 and 600). A clean, compact sans-serif that stays legible at 16px and above and pairs with Fraunces without competing with it.

Both are loaded through `next/font/google`, which downloads the files at build time and serves them from the same origin. The browser makes no request to Google, so `font-src 'self'` holds. Each family uses at most two weights.

## Consequences

- The build needs network access to fetch the font files once.
- `display: swap` shows fallback text (Georgia, system-ui) until the fonts load.
- Changing either family only touches `src/app/fonts.ts` and the two font tokens in `src/styles/tokens.css`.
