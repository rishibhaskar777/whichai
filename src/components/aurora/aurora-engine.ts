import { parseGlow, type Glow } from "./aurora-colour";
import {
  FAMILY_COUNT,
  createGrid,
  createIntensities,
  sampleField,
  type Grid,
  type Offset,
} from "./aurora-field";

/** The canvas is drawn this many pixels wide and scaled up by the browser. */
const RENDER_WIDTH = 72;
const MIN_HEIGHT = 20;
const MAX_HEIGHT = 120;
const MAX_FPS = 15;
const FRAME_MS = 1000 / MAX_FPS;
/** A long pause (hidden tab) must not make the light jump when it resumes. */
const MAX_STEP_MS = 100;
/** The moment shown when the background is not animated. */
const STILL_SECONDS = 24;
/** The most the pointer moves the light, as a share of the screen. */
const POINTER_RANGE = 0.035;
const POINTER_EASE_PER_SECOND = 2.5;
const FINE_POINTER = "(hover: hover) and (pointer: fine)";

const FALLBACK_GLOWS: readonly Glow[] = [
  { red: 79, green: 91, blue: 213, alpha: 0.16 },
  { red: 56, green: 140, blue: 255, alpha: 0.14 },
  { red: 99, green: 110, blue: 255, alpha: 0.1 },
];

/** The same three tokens the CSS glow uses, so both themes match the page.
 * The fallbacks are the light theme values, used only if a token is unset. */
function readGlows(): Glow[] {
  const style = getComputedStyle(document.documentElement);
  return FALLBACK_GLOWS.map(
    (fallback, index) =>
      parseGlow(style.getPropertyValue(`--glow-${index + 1}`)) ?? fallback,
  );
}

export interface AuroraHandle {
  setAnimated(animated: boolean): void;
  destroy(): void;
}

/**
 * Draws the aurora on `canvas`. Returns null when a 2D context is not
 * available, so the caller keeps the CSS glow.
 */
export function startAurora(
  canvas: HTMLCanvasElement,
  initiallyAnimated: boolean,
): AuroraHandle | null {
  const context = canvas.getContext("2d");
  if (!context) return null;

  let animated = initiallyAnimated;
  let destroyed = false;
  let documentVisible = document.visibilityState !== "hidden";
  let onScreen = true;
  let timer = 0;
  let stillRequest = 0;
  let frameRequest = 0;
  let lastTick = 0;
  let seconds = STILL_SECONDS;
  let glows = readGlows();
  let grid: Grid = createGrid(RENDER_WIDTH, MIN_HEIGHT);
  let intensities = createIntensities(grid);
  let image = context.createImageData(grid.width, grid.height);
  const pointer: Offset = { x: 0, y: 0 };
  const pointerTarget: Offset = { x: 0, y: 0 };

  function fitCanvas() {
    const aspect = window.innerHeight / Math.max(1, window.innerWidth);
    const height = Math.round(
      Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, RENDER_WIDTH * aspect)),
    );
    if (canvas.width === RENDER_WIDTH && canvas.height === height) return;
    canvas.width = RENDER_WIDTH;
    canvas.height = height;
    grid = createGrid(RENDER_WIDTH, height);
    intensities = createIntensities(grid);
    image = context!.createImageData(RENDER_WIDTH, height);
  }

  function draw() {
    sampleField(grid, seconds, pointer, intensities);
    const pixels = image.data;
    for (let i = 0; i < grid.width * grid.height; i++) {
      // Premultiplied "over" in token order, the order the contrast test uses.
      let red = 0;
      let green = 0;
      let blue = 0;
      let alpha = 0;
      for (let f = 0; f < FAMILY_COUNT; f++) {
        const glow = glows[f];
        if (!glow) continue;
        const strength = glow.alpha * (intensities[f]?.[i] ?? 0);
        red = glow.red * strength + red * (1 - strength);
        green = glow.green * strength + green * (1 - strength);
        blue = glow.blue * strength + blue * (1 - strength);
        alpha = strength + alpha * (1 - strength);
      }
      const at = i * 4;
      pixels[at] = alpha > 0 ? red / alpha : 0;
      pixels[at + 1] = alpha > 0 ? green / alpha : 0;
      pixels[at + 2] = alpha > 0 ? blue / alpha : 0;
      pixels[at + 3] = alpha * 255;
    }
    context!.putImageData(image, 0, 0);
  }

  function running(): boolean {
    return animated && documentVisible && onScreen && !destroyed;
  }

  /**
   * A timer sets the pace and the animation frame only draws. Asking for a
   * frame on every refresh would wake the page 60 times a second to skip 45.
   */
  function schedule() {
    timer = window.setTimeout(() => {
      timer = 0;
      frameRequest = requestAnimationFrame(frame);
    }, FRAME_MS);
  }

  function frame(now: number) {
    frameRequest = 0;
    if (!running()) return;

    const step = Math.min(MAX_STEP_MS, Math.max(0, now - lastTick));
    lastTick = now;
    seconds += step / 1000;
    const ease = 1 - Math.exp((-POINTER_EASE_PER_SECOND * step) / 1000);
    pointer.x += (pointerTarget.x - pointer.x) * ease;
    pointer.y += (pointerTarget.y - pointer.y) * ease;
    draw();
    schedule();
  }

  function sync() {
    if (running()) {
      if (timer === 0 && frameRequest === 0) {
        lastTick = performance.now();
        schedule();
      }
      return;
    }
    if (timer !== 0) {
      window.clearTimeout(timer);
      timer = 0;
    }
    if (frameRequest !== 0) {
      cancelAnimationFrame(frameRequest);
      frameRequest = 0;
    }
  }

  function drawStillSoon() {
    if (stillRequest !== 0) return;
    stillRequest = requestAnimationFrame(() => {
      stillRequest = 0;
      drawStill();
    });
  }

  function cancelStill() {
    if (stillRequest !== 0) cancelAnimationFrame(stillRequest);
    stillRequest = 0;
  }

  function drawStill() {
    if (destroyed || animated) return;
    seconds = STILL_SECONDS;
    pointer.x = 0;
    pointer.y = 0;
    draw();
  }

  const cleanups: (() => void)[] = [];
  function listen(target: EventTarget, type: string, handler: EventListener) {
    target.addEventListener(type, handler);
    cleanups.push(() => target.removeEventListener(type, handler));
  }

  listen(document, "visibilitychange", () => {
    documentVisible = document.visibilityState !== "hidden";
    sync();
  });

  listen(window, "resize", () => {
    fitCanvas();
    draw();
  });

  const pointerQuery = window.matchMedia(FINE_POINTER);
  listen(window, "pointermove", (event) => {
    const move = event as PointerEvent;
    if (!animated || move.pointerType === "touch" || !pointerQuery.matches) {
      return;
    }
    pointerTarget.x =
      (move.clientX / window.innerWidth - 0.5) * 2 * POINTER_RANGE;
    pointerTarget.y =
      (move.clientY / window.innerHeight - 0.5) * 2 * POINTER_RANGE;
  });

  const themeObserver = new MutationObserver(() => {
    glows = readGlows();
    if (!running()) draw();
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  cleanups.push(() => themeObserver.disconnect());

  listen(window.matchMedia("(prefers-color-scheme: dark)"), "change", () => {
    glows = readGlows();
    if (!running()) draw();
  });

  if (typeof IntersectionObserver !== "undefined") {
    const visibility = new IntersectionObserver((entries) => {
      const latest = entries[entries.length - 1];
      if (!latest) return;
      onScreen = latest.isIntersecting;
      sync();
    });
    visibility.observe(canvas);
    cleanups.push(() => visibility.disconnect());
  }

  // The first picture is drawn in a task of its own, so that starting the
  // aurora never adds one long task to the page load.
  fitCanvas();
  if (animated) sync();
  else drawStillSoon();

  return {
    setAnimated(next) {
      if (next === animated || destroyed) return;
      animated = next;
      if (animated) {
        cancelStill();
        draw();
        sync();
      } else {
        sync();
        drawStill();
      }
    },
    destroy() {
      destroyed = true;
      sync();
      cancelStill();
      for (const cleanup of cleanups) cleanup();
    },
  };
}
