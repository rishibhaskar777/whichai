# Design principles

The interface should look designed for this product, not assembled from a template. These rules exist to prevent the generic look.

## Avoid

- Purple-to-blue gradient heroes and gradient text on headings
- Rows of three identical cards, each with an icon on top and a short blurb
- Emoji used as icons
- Marketing phrases such as "supercharge", "unleash", "revolutionize", "seamless"
- Centered everything; stock illustration sets; floating decorative blobs competing with content
- Lorem ipsum, fake logos, fake testimonials, fake numbers
- Shadows and rounded corners applied uniformly to every element

## Do

- Start from content. Lay out what the user needs to read and do; add decoration last.
- Use a restrained palette: warm neutral surfaces, one accent colour, semantic colours for status only.
- Use a clear type scale (for example 1.2 ratio) with at most two weights per family. Self-host the font. Choose a typeface with some character for headings; keep body text plain and readable at 16px or larger.
- Use a spacing scale on a 4px base and apply it consistently.
- Vary rhythm: dense areas (sidebar, news) next to open areas (search, headline).
- Use one icon set, drawn at one stroke width, as inline SVG components.
- Write copy the way a person would: short, specific, plain.

## Glass effect

Use it on the search field only. It needs a solid fallback when `backdrop-filter` is unsupported or the user prefers reduced transparency. Text contrast must meet WCAG AA on top of the blurred background. Do not apply glass to cards, sidebar or news panel.

## Motion

- Use motion to show cause and effect: opening, closing, moving, loading.
- Animate `transform` and `opacity` only.
- One set of easing curves and durations, defined as tokens: fast 150ms, base 250ms, slow 400ms.
- Honour `prefers-reduced-motion`: remove movement, keep simple fades.
- No animation on first paint that delays reading or input.

## Accessibility

- WCAG AA contrast in both themes
- Full keyboard operation with a visible focus ring
- Semantic HTML first; ARIA only where HTML is not enough
- Touch targets at least 44px
- Works at 200% zoom and at 320px width

## Contrast checks

`src/styles/contrast.test.ts` reads `tokens.css` and checks every text and control colour pair in the light theme and in both dark selectors. Text pairs need 4.5:1 and control borders need 3:1. Selected ratios on the page background:

| Pair                   | Light | Dark |
| ---------------------- | ----- | ---- |
| Body text              | 15.5  | 15.8 |
| Muted text             | 7.1   | 8.5  |
| Text on accent button  | 5.6   | 7.5  |
| Accent text            | 7.2   | 9.0  |
| Control border         | 3.9   | 4.5  |
| Warning (sample label) | 5.5   | 9.8  |

Motion exception: collapsing the sidebar or the news panel animates the grid column width, which is a layout property, because the panel must reflow the page. It is switched off under `prefers-reduced-motion`.
