# 0018: Live background

Status: accepted. Changes the glow layer described in [0004](0004-visual-refresh.md) and the contrast checks in the design principles.

## Context

The page background was three CSS blobs drifting on 16, 22 and 28 second loops. It looked static after a few seconds. The aim was a calm, slowly moving aurora that matches the blue glow, responds a little to the pointer, and costs little: no new dependency, no paid service, no inline script or style, and text that still passes WCAG AA wherever it sits.

## Decision

### Rendering

- A single `<canvas>` behind the page, drawn at 72 pixels wide and scaled up by the browser with `filter: blur(20px)`. Canvas 2D, not WebGL: the maths is small, there is no context loss to handle, and it works where WebGL is blocked.
- Three families of light (accent blue, sky blue, deep indigo-blue) each make a soft band and a blob. The field is computed in `aurora-field.ts` with one `sin()` per pixel per family. The centre moves about a third as much as the edges.
- Drawing is paced by a timer at 15 frames per second and the animation frame only draws. Asking for a frame on every display refresh kept the page awake 60 times a second even when 45 of those did nothing; pacing by timer roughly halved idle CPU.
- Colours come from the `--glow-*` tokens, read once and again when the theme changes. The minified CSS serialises them as `#rrggbbaa`, so `aurora-colour.ts` reads hex and `rgb()` forms.
- Drawing stops while the tab is hidden (`visibilitychange`) and while the canvas is off-screen (`IntersectionObserver`). A long pause does not make the light jump when it resumes.

### Pointer

On a device with `(hover: hover) and (pointer: fine)` the light shifts by at most 3.5 percent of the screen towards the pointer, eased with an exponential, and the far layers move least. Touch pointer events and coarse pointers are ignored.

### Loading and fallback

- `AuroraBackground` is part of the main bundle (a few hundred bytes). The engine is a separate chunk that is imported after `window.load` and a browser idle callback. Its first picture is drawn in a task of its own.
- The CSS glow is in the server HTML, so the first paint is the same with or without script. If `getContext("2d")` returns null or the import fails, the CSS glow stays.
- Off, Reduce motion on and save-data (`navigator.connection.saveData`) draw one still frame of the aurora. Reduce motion set to Off keeps the movement.

### Setting

`animatedBackground` (boolean, default `true`) in the local settings, shown as On / Off under Settings, General. Older saved data and backups lack the field and read as `true`, so no schema version change is needed.

### Contrast

The page text sits directly on the glow in places (the greeting line, plan sections, the news panel), so the glow had to be limited, not just the glass check. Findings:

- The old glow tokens (0.3, 0.26 and 0.18 alpha) already dropped muted text on the page to about 2.9:1 where the blobs overlapped, which the old tests did not check.
- The three families now share one budget per pixel (their intensities add up to at most 1), so the worst case is one glow at full strength. The glow alphas are 0.16, 0.14 and 0.10 in light and 0.16, 0.13 and 0.10 in dark.
- The CSS fallback blobs can all overlap, so they are drawn at `--glow-fallback: 0.45`, which the tests also check.
- To leave room for a visible glow, three text tokens moved one step: light `--text-muted` `#5f5f67` to `#52525a`, light `--text-subtle` `#6b6b74` to `#5f5f67`, light `--accent` `#4f5bd5` to `#4651cc`, and dark `--text-subtle` `#82828c` to `#8a8a94`. All ratios on the plain background went up (see the table in the design principles).
- `contrast.test.ts` checks every text colour and the accent on the page background under each glow at full strength and under the overlapping fallback, in the light theme and both dark selectors.

## Consequences

- The aurora is deliberately quiet. In the light theme the page can darken by about five percent at most; making it bolder would require darker text everywhere.
- The glass search keeps `backdrop-filter`, which has to re-blur whenever the canvas changes. That is the main cost of the layer, not the script; the script takes under one percent of the main thread at 15 frames per second.
- Anyone adding text on the page background needs no extra check; the contrast test covers the text tokens. A new glow colour must be added to the test.
