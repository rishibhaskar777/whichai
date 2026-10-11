import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startAurora } from "./aurora-engine";

interface FakeContext {
  createImageData: ReturnType<typeof vi.fn>;
  putImageData: ReturnType<typeof vi.fn>;
}

let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
let clock: number;
let finePointer: boolean;
let context: FakeContext;

function fakeCanvas(available = true): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.getContext = vi.fn(() =>
    available ? context : null,
  ) as unknown as HTMLCanvasElement["getContext"];
  return canvas;
}

/** Lets one timer fire, then runs the animation frame it asked for. */
function tick(times = 1) {
  for (let i = 0; i < times; i++) {
    vi.advanceTimersByTime(70);
    clock += 70;
    const queued = [...frames.values()];
    frames.clear();
    for (const callback of queued) callback(clock);
  }
}

/** Timers and animation frames the engine still has waiting. */
function pending(): number {
  return vi.getTimerCount() + frames.size;
}

function setVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

function lastPixels(): number[] {
  const call = context.putImageData.mock.calls.at(-1);
  return [...(call?.[0].data as Uint8ClampedArray)];
}

/** The picture after 23 ticks with no pointer movement. */
function untouchedPixels(): number[] {
  const handle = startAurora(fakeCanvas(), true);
  tick(23);
  const pixels = lastPixels();
  handle?.destroy();
  return pixels;
}

function pixelsAfterPointer(type: string): number[] {
  const handle = startAurora(fakeCanvas(), true);
  tick(3);
  const move = new Event("pointermove");
  Object.assign(move, {
    pointerType: type,
    clientX: window.innerWidth,
    clientY: window.innerHeight,
  });
  window.dispatchEvent(move);
  tick(20);
  const pixels = lastPixels();
  handle?.destroy();
  return pixels;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  frames = new Map();
  nextFrame = 1;
  clock = 1000;
  finePointer = true;
  context = {
    createImageData: vi.fn((width: number, height: number) => ({
      data: new Uint8ClampedArray(width * height * 4),
      width,
      height,
    })),
    putImageData: vi.fn(),
  };
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn((callback: FrameRequestCallback) => {
      const id = nextFrame++;
      frames.set(id, callback);
      return id;
    }),
  );
  vi.stubGlobal(
    "cancelAnimationFrame",
    vi.fn((id: number) => frames.delete(id)),
  );
  vi.spyOn(performance, "now").mockImplementation(() => clock);
  window.matchMedia = ((query: string) => ({
    matches: query.includes("hover") ? finePointer : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
});

afterEach(() => {
  setVisibility("visible");
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("aurora engine", () => {
  it("returns null when a 2D context is not available", () => {
    expect(startAurora(fakeCanvas(false), true)).toBeNull();
  });

  it("draws frames while animated", () => {
    const handle = startAurora(fakeCanvas(), true);
    const first = context.putImageData.mock.calls.length;
    tick(3);
    expect(context.putImageData.mock.calls.length).toBeGreaterThan(first);
    handle?.destroy();
  });

  it("never draws faster than 30 frames per second", () => {
    const handle = startAurora(fakeCanvas(), true);
    const before = context.putImageData.mock.calls.length;
    // Half a second on a 120 Hz display: a frame callback every 8 ms.
    for (let i = 0; i < 60; i++) {
      vi.advanceTimersByTime(8);
      clock += 8;
      const queued = [...frames.values()];
      frames.clear();
      queued.forEach((callback) => callback(clock));
    }
    const drawn = context.putImageData.mock.calls.length - before;
    expect(drawn).toBeLessThanOrEqual(Math.ceil((60 * 8) / (1000 / 30)));
    expect(drawn).toBeGreaterThan(0);
    handle?.destroy();
  });

  it("stops drawing while the tab is hidden and resumes when it returns", () => {
    const handle = startAurora(fakeCanvas(), true);
    tick(2);

    setVisibility("hidden");
    expect(pending()).toBe(0);
    const whileHidden = context.putImageData.mock.calls.length;
    tick(5);
    expect(context.putImageData.mock.calls.length).toBe(whileHidden);

    setVisibility("visible");
    expect(pending()).toBe(1);
    tick(2);
    expect(context.putImageData.mock.calls.length).toBeGreaterThan(whileHidden);
    handle?.destroy();
  });

  it("stops drawing when the canvas leaves the screen", () => {
    let report: (
      entries: Partial<IntersectionObserverEntry>[],
    ) => void = () => {};
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: typeof report) {
          report = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
    const handle = startAurora(fakeCanvas(), true);
    report([{ isIntersecting: false }]);
    expect(pending()).toBe(0);
    report([{ isIntersecting: true }]);
    expect(pending()).toBe(1);
    handle?.destroy();
  });

  it("draws one still frame and no animation when not animated", () => {
    const handle = startAurora(fakeCanvas(), false);
    expect(context.putImageData).not.toHaveBeenCalled();
    tick();
    expect(context.putImageData).toHaveBeenCalledTimes(1);
    expect(pending()).toBe(0);
    tick(3);
    expect(context.putImageData).toHaveBeenCalledTimes(1);
    handle?.destroy();
  });

  it("starts and stops when the animated flag changes", () => {
    const handle = startAurora(fakeCanvas(), false);
    handle?.setAnimated(true);
    expect(pending()).toBe(1);
    handle?.setAnimated(false);
    expect(pending()).toBe(0);
    handle?.destroy();
  });

  it("stops everything on destroy", () => {
    const handle = startAurora(fakeCanvas(), true);
    handle?.destroy();
    expect(pending()).toBe(0);
    const drawn = context.putImageData.mock.calls.length;
    setVisibility("hidden");
    setVisibility("visible");
    expect(pending()).toBe(0);
    expect(context.putImageData.mock.calls.length).toBe(drawn);
  });

  it("never lets a pixel exceed the strongest glow token", () => {
    const handle = startAurora(fakeCanvas(), true);
    tick(10);
    const pixels = lastPixels();
    handle?.destroy();
    // The three families share one budget, so a pixel is never more opaque
    // than the strongest glow token (0.16 in the light theme).
    const worst = 0.16;
    for (let at = 3; at < pixels.length; at += 4) {
      expect((pixels[at] ?? 0) / 255).toBeLessThanOrEqual(worst + 0.005);
    }
  });

  it("answers a mouse pointer but ignores touch", () => {
    const none = untouchedPixels();
    expect(pixelsAfterPointer("touch")).toEqual(none);
    expect(pixelsAfterPointer("mouse")).not.toEqual(none);
  });

  it("ignores the pointer on devices without a fine pointer", () => {
    const none = untouchedPixels();
    finePointer = false;
    expect(pixelsAfterPointer("mouse")).toEqual(none);
  });
});
