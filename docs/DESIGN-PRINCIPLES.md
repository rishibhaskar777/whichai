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

Glass is used on the search field only.

| Value                                   | Light                     | Dark                      |
| --------------------------------------- | ------------------------- | ------------------------- |
| Fill                                    | `rgb(255 255 255 / 0.45)` | `rgb(20 20 26 / 0.40)`    |
| Edge gradient, top-left to bottom-right | white 80% to black 6%     | white 18% to white 4%     |
| Outer shadow                            | `0 8px 32px` blue at 12%  | `0 8px 32px` black at 45% |

Both themes use `blur(24px) saturate(180%)` and an inset top highlight. The 1px gradient edge is drawn by a masked pseudo-element, so the markup stays unchanged. On focus a 45% accent edge fades in over the gradient, a 4px soft ring appears and the box lifts 2px. The solid fill is used when `backdrop-filter` is unsupported or reduced transparency is requested. Placeholder text and the counter use `--text-on-glass`, a stronger tone than muted text, because the translucent fill sits on top of the glow. The contrast tests check the text on the glass over all three glows at full strength. Do not apply glass to cards, sidebar or news panel.

The glow layer is fixed behind the page. It has three large blobs made from radial gradients in the blue family only: accent blue, sky blue and deep indigo-blue. Each drifts and scales on its own loop (16s, 22s and 28s, ease-in-out, alternate) by about 6 to 10 percent of the viewport and a scale of 0.9 to 1.15. Only `transform` and `opacity` are animated. A radial mask fades the layer out towards the edges so the sidebar and news panel stay clean. When the search field is focused the layer brightens by about 20 percent over 400ms. The layer is `aria-hidden`, ignores pointer events and causes no layout shift. Under `prefers-reduced-motion` the blobs stay still and the glow is static.

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
- Exactly one `h1` per page state. On the home page it is the greeting while empty, then the understanding card title, the no-match title or the plan headline; while a goal is being edited it is a screen-reader-only heading. The greeting becomes a paragraph once the hero collapses. Headings below it do not skip levels.
- Touch targets at least 44px
- Works at 200% zoom and at 320px width

## Contrast checks

`src/styles/contrast.test.ts` reads `tokens.css` and checks every text colour against every surface it can appear on, in the light theme and in both dark selectors. Text needs 4.5:1, the accent as a control needs 3:1, and the search text is checked on the glass over all three glows at full strength. Ratios on the page background:

| Pair        | Light | Dark |
| ----------- | ----- | ---- |
| Text        | 18.1  | 16.9 |
| Muted text  | 6.1   | 7.7  |
| Subtle text | 5.1   | 5.2  |
| Accent      | 5.3   | 7.4  |

Motion exception: collapsing the sidebar or the news panel animates the grid column width, which is a layout property, because the page must reflow. It is switched off under `prefers-reduced-motion`.

Second motion exception: when a goal is submitted, the greeting collapses (a grid row going from `1fr` to `0fr`) and the search moves to the bottom (`flex-grow` on the spacers and the thread) in 350ms. A single layout transition moves everything together, so no script measures positions. The level switch indicator, the card reveals and the fade-in of plan content after a level change use `transform` and `opacity` only. Disclosures expand with a grid row transition. All of it is removed under `prefers-reduced-motion`, leaving fades.

## Plan view

- The plan reads like a document, not a wall of cards: only the job cards and the understanding card have borders; overview, workflow, brief and lists are open sections with headings.
- Tags (Keep, Better option, New) are words with a thin outline, not colour alone. The accent outline marks a better option; status colours are kept for warnings.
- The sample notice sits at the top of every sample plan and cannot be dismissed.
- The sticky search keeps the glass treatment and respects `env(safe-area-inset-bottom)`.
