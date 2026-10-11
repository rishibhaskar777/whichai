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

The glow layer is fixed behind the page and is an aurora: soft bands and blobs in the blue family only (accent blue, sky blue and deep indigo-blue) that slowly flow, bend and change brightness, like light under water. It is drawn on one full-screen canvas at 72 pixels wide, scaled up by the browser with a 20px blur, at no more than 15 frames per second (`src/components/aurora/`). The colours are the `--glow-1` to `--glow-3` tokens, read from the page, so both themes share the same feel. The centre, behind the search, moves about a third as much as the edges. On a mouse the light drifts up to 3.5 percent of the screen towards the pointer, eased, with the far layers moving least; touch input is ignored.

- The three families share one brightness budget per pixel (they add up to at most 1), so the strongest a pixel can be is one glow token at full strength. Because of that budget the contrast test only has to check each glow on its own against every text colour.
- The canvas starts after the page has loaded and the browser is idle. Until then, and whenever a 2D canvas is unavailable, the three CSS blobs from the previous design are shown, at `--glow-fallback` strength so that all three overlapping still pass.
- Drawing pauses while the tab is hidden or the canvas is off-screen.
- Settings, General, "Animated background" (On by default) turns the movement off. Off, Reduce motion on, and save-data mode all show one still frame of the same aurora instead. Reduce motion set to Off keeps the movement, as it does for other animation.
- When the search field is focused the layer brightens by about 20 percent over 400ms. The layer is `aria-hidden`, ignores pointer events, causes no layout shift and is hidden in print.
- Only `transform` and `opacity` are animated in CSS; the canvas content is redrawn by script and needs no inline style, so the CSP is unchanged.

## Sidebar

- Navigation is grouped under two quiet labels (11px, uppercase, muted): "Your work" (Projects with up to five recent plans, Searches) and "Explore" (Tool Library, What Changed, Compare tools). Home sits at the top under New plan, which shows its keyboard shortcut on hover and focus. Rows are 36px with 18px icons and a 10px gap. The current page has a soft surface and a 2px accent bar on the left.
- The bottom area sits under a thin divider and respects the safe area on phones. Signed out it is one row: a "Sign in" button that fills the width, the theme toggle and a "More" button. Signed in it is the account button (avatar, name, plan, chevron) and the theme toggle.
- The theme toggle switches light and dark in one click and its icon shows the mode you will switch to. The icons rotate and fade over 250ms using `transform` and `opacity`; reduced motion keeps a crossfade. The System choice lives in Settings.
- The account menu holds Settings, Upgrade plan, Help, Language and, after a divider, Sign out. The More menu holds Settings, Help, Plans & pricing and Language. Both are real menus: arrow keys, Home and End move, Escape closes and returns focus.
- On the rail the avatar (or sign-in icon), the toggle and More stack and centre. Menus and tooltips are positioned against the viewport because the sidebar clips its contents.
- A guest sees "Guest" and the Free plan badge in the same account button, and the menu ends with "Sign in". A logged-in preview account shows the first name and two initials, and the menu ends with "Sign out", which clears the session and keeps the account.
- Legal links are not in the sidebar. They are in Settings under "About & legal" and at the bottom of `/pricing` and `/checkout`, where payment pages need them.

## Sign-in popup

- Two views in one dialog, Log in and Register, switched with a short fade and a height animation (none under reduced motion). Focus moves to the new title. The popup has no scrollbar at 1366x768 or 360x740; on shorter screens it still scrolls by touch with the bar hidden and a fade at the bottom edge.
- The wordmark is dropped inside the popup because the title already names the product. Titles are 22px.
- Fields are 40px tall (44px on touch), with a visible label above, a hint or error below, and a 1px border dark enough to meet 3:1 as a control boundary. Names sit side by side and stack below 420px.
- The one primary action uses the accent fill with `--on-accent` text. This is the only filled-accent button; elsewhere primary buttons stay filled with the text colour.
- Errors are shown under the field and as a short summary of field names that takes focus. A message about the whole form (a wrong password) replaces the list.
- The line "Preview: accounts are saved only in this browser until online accounts launch." stays visible in both views, in the on-glass text colour.

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

`src/styles/contrast.test.ts` reads `tokens.css` and checks every text colour against every surface it can appear on, in the light theme and in both dark selectors. Text needs 4.5:1, the accent as a control needs 3:1, the search text is checked on the glass over all three glows at full strength, and every text colour is checked on the page background under each glow at full strength and under the overlapping fallback blobs. Ratios on the plain page background:

| Pair        | Light | Dark |
| ----------- | ----- | ---- |
| Text        | 18.1  | 16.9 |
| Muted text  | 7.4   | 7.7  |
| Subtle text | 6.1   | 5.8  |
| Accent      | 6.1   | 7.4  |

Motion exception: collapsing the sidebar or the news panel animates the grid column width, which is a layout property, because the page must reflow. It is switched off under `prefers-reduced-motion`.

Theme toggle exception: the toggle in the sidebar reveals the new theme with a View Transition, a circle growing from the button over 400ms with ease-out (`src/lib/theme-transition.ts`). The circle is animated with the Web Animations API, so no inline style is needed. It is skipped, and the theme changes at once, when the browser lacks `document.startViewTransition` or reduced motion is on. Changes made in Settings do not use it, and there is no colour transition on every element.

Second motion exception: when a goal is submitted, the greeting collapses (a grid row going from `1fr` to `0fr`) and the search moves to the bottom (`flex-grow` on the spacers and the thread) in 350ms. A single layout transition moves everything together, so no script measures positions. The level switch indicator, the card reveals and the fade-in of plan content after a level change use `transform` and `opacity` only. Disclosures expand with a grid row transition. All of it is removed under `prefers-reduced-motion`, leaving fades.

## Plan view

- The plan reads like a document, not a wall of cards: only the job cards and the understanding card have borders; overview, workflow, brief and lists are open sections with headings.
- Tags (Keep, Better option, New) are words with a thin outline, not colour alone. The accent outline marks a better option; status colours are kept for warnings.
- There is no notice above the plan. One quiet line at the bottom says tool details come from official sites and fit scores are estimates, and links to `/about#data`. Cards label the fit score as an editorial estimate and show a "Verified <date>" tick only for verified records. No card shows a placeholder or "Not verified".
- "Choose X if ..." alternatives are buttons that swap the tool into the card. The new tool's name takes focus and a status message announces it.
- "Your toolkit at a glance" sits right below the overview: plain outlined chips grouped by category, each scrolling to and focusing its card. No icons, colour coding or counts.
- Cards show the kind of tool as a small label. AI tool cards add one quiet block that names a model class and effort per step, with the note to check the tool's model picker, and never a model version.
- "See other options" is open by default on screens 768px and wider, so the variety is visible, and collapsed on narrower ones.
- The sticky search keeps the glass treatment and respects `env(safe-area-inset-bottom)`.
