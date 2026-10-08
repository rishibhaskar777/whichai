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
- Use a restrained palette: neutral light and dark surfaces, one indigo accent used only for focus, the search glow, links and small highlights, and semantic colours for status only. Primary buttons are filled with the text colour. No gradients on text or buttons.
- Use one sans-serif family (Onest, weights 400, 500 and 600), self-hosted. Headline 36px desktop and 28px mobile, body 15px, navigation 14px, small labels 12px.
- Use a spacing scale on a 4px base and apply it consistently. Controls are 36px tall, or 44px on touch screens.
- Vary rhythm: dense areas (sidebar, news) next to open areas (search, headline).
- Use one icon set, drawn at one stroke width, as inline SVG components.
- Write copy the way a person would: short, specific, plain.

## Glass effect and glow layer

Glass is used on the search field only. Light: `rgb(255 255 255 / 0.65)`. Dark: `rgb(24 24 30 / 0.55)`. Both use `blur(20px) saturate(140%)`, a 1px strong border, an inset top highlight and a layered shadow. It needs a solid fallback when `backdrop-filter` is unsupported or the user prefers reduced transparency. Text contrast must meet WCAG AA on the glass over the strongest point of the glow; the contrast tests check this. Do not apply glass to cards, sidebar or news panel.

Behind the page sits one fixed decorative layer of two soft radial glows (accent and neutral) that drift over about 30 seconds. It is `aria-hidden`, ignores pointer events, animates `transform` only, causes no layout shift and is off under `prefers-reduced-motion`.

## Motion

- Use motion to show cause and effect: opening, closing, moving, loading.
- Animate `transform` and `opacity` only.
- One set of easing curves and durations, defined as tokens: fast 150ms, base 250ms, slow 400ms. Entrances rise 8px and take 250ms or less.
- Honour `prefers-reduced-motion`: remove movement, keep simple fades.
- No animation on first paint that delays reading or input.

## Accessibility

- WCAG AA contrast in both themes
- Full keyboard operation with a visible focus ring
- Semantic HTML first; ARIA only where HTML is not enough
- Touch targets at least 44px
- Works at 200% zoom and at 320px width

## Contrast checks

`src/styles/contrast.test.ts` reads `tokens.css` and checks every text colour against every surface it can appear on, in the light theme and in both dark selectors. Text needs 4.5:1, the accent as a control needs 3:1, and the search text is checked on the glass over the strongest glow. Ratios on the page background:

| Pair        | Light | Dark |
| ----------- | ----- | ---- |
| Text        | 18.1  | 16.9 |
| Muted text  | 6.1   | 7.7  |
| Subtle text | 5.1   | 5.2  |
| Accent      | 5.3   | 7.4  |

Motion exception: collapsing the sidebar or the news panel animates the grid column width, which is a layout property, because the page must reflow. It is switched off under `prefers-reduced-motion`.
