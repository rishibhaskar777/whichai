const REVEAL_ATTRIBUTE = "data-theme-reveal";
const DURATION_MS = 400;

export interface RevealOrigin {
  x: number;
  y: number;
}

function prefersReducedMotion(): boolean {
  const setting = document.documentElement.dataset.motion;
  if (setting === "reduce") return true;
  if (setting === "full") return false;
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

let latestReveal = 0;

/**
 * Runs `apply`, which must change the theme synchronously. With View
 * Transitions and motion allowed, the new theme is revealed as a circle that
 * grows from `origin`; otherwise `apply` runs at once. The circle is a Web
 * Animations API call, so nothing needs inline styles under the CSP.
 */
export function revealTheme(origin: RevealOrigin, apply: () => void): void {
  if (
    typeof document.startViewTransition !== "function" ||
    prefersReducedMotion()
  ) {
    apply();
    return;
  }

  const root = document.documentElement;
  const token = ++latestReveal;
  root.setAttribute(REVEAL_ATTRIBUTE, "");

  const radius = Math.hypot(
    Math.max(origin.x, window.innerWidth - origin.x),
    Math.max(origin.y, window.innerHeight - origin.y),
  );
  const transition = document.startViewTransition(apply);

  void transition.ready
    .then(() => {
      root.animate(
        {
          clipPath: [
            `circle(0px at ${origin.x}px ${origin.y}px)`,
            `circle(${radius}px at ${origin.x}px ${origin.y}px)`,
          ],
        },
        {
          duration: DURATION_MS,
          easing: "ease-out",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    })
    // A skipped transition (for example a second click) rejects `ready`; the
    // theme has still been applied by then.
    .catch(() => undefined);

  void transition.finished
    .catch(() => undefined)
    .then(() => {
      if (token === latestReveal) root.removeAttribute(REVEAL_ATTRIBUTE);
    });
}
