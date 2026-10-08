# 0004: Visual refresh

Status: accepted. Supersedes [0002](0002-fonts.md).

## Context

The first design used a warm beige and rust palette, a serif headline and large controls. It read as heavy and dated next to the products people already use for AI tasks. Structure, behaviour and security setup were fine; only the visual layer needed to change.

## Decision

- **One sans-serif family: Onest**, weights 400, 500 and 600, loaded through `next/font/google` and served from the same origin, so `font-src 'self'` still holds. The serif heading face and the second body face are removed.
- **Neutral palette** with two fully designed themes. Light: `#FAFAFA` page, `#F4F4F5` sidebar, white surfaces, `#111114` text. Dark: `#0A0A0C` page, `#0F0F12` sidebar, `#141418` surfaces, `#EDEDEF` text. One indigo accent (`#4F5BD5` light, `#8B96FF` dark) is used only for focus rings, the search glow, links and small highlights.
- **Primary controls use the text colour as fill** and the page colour as label, so they are black on light and white on dark. There are no gradients on text or buttons.
- **Glass on the search field only**, over a fixed, decorative background layer of two soft radial glows that drift slowly. The layer is `aria-hidden`, ignores pointer events, uses only `transform` for movement and is switched off under `prefers-reduced-motion`. The search surface falls back to a solid colour when `backdrop-filter` is unsupported or reduced transparency is requested.
- **Theme control** in the sidebar footer offers System, Light and Dark. System removes the stored cookie and follows the operating system. The server still renders the chosen `data-theme`, so there is no flash.
- **Sizing:** 248px sidebar, 36px navigation rows (44px on touch), 720px content column, 300px news panel shown at 1280px and wider.

Two colour values differ slightly from the brief because the contrast tests failed: `--text-subtle` is `#6B6B74` in light and `#82828C` in dark, so that dates and counters meet 4.5:1 on every surface.

## Consequences

- Rolling back means restoring `tokens.css`, `fonts.ts` and the component styles; behaviour and tests are unaffected.
- The background glow runs a continuous compositor animation. It is paused for reduced motion and costs no layout.
- The favicon is a monochrome mark that switches colours with the browser theme.
