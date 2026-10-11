import { afterEach, describe, expect, it, vi } from "vitest";
import { revealTheme } from "./theme-transition";

type TransitionStub = {
  ready: Promise<void>;
  finished: Promise<void>;
};

const doc = document as unknown as {
  startViewTransition?: (callback: () => void) => TransitionStub;
};
const root = document.documentElement as unknown as {
  animate?: (...args: unknown[]) => unknown;
};

function stubViewTransitions() {
  const animate = vi.fn();
  root.animate = animate;
  doc.startViewTransition = vi.fn((callback: () => void) => {
    callback();
    return { ready: Promise.resolve(), finished: Promise.resolve() };
  });
  return animate;
}

function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: reduce && query.includes("reduce"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

afterEach(() => {
  delete doc.startViewTransition;
  delete root.animate;
  delete document.documentElement.dataset.motion;
  document.documentElement.removeAttribute("data-theme-reveal");
  vi.unstubAllGlobals();
});

describe("revealTheme", () => {
  it("applies the change at once when View Transitions are unsupported", () => {
    const apply = vi.fn();

    revealTheme({ x: 10, y: 10 }, apply);

    expect(apply).toHaveBeenCalledTimes(1);
    expect(document.documentElement).not.toHaveAttribute("data-theme-reveal");
  });

  it("applies at once, without a transition, when the system asks for less motion", () => {
    stubViewTransitions();
    stubReducedMotion(true);
    const apply = vi.fn();

    revealTheme({ x: 10, y: 10 }, apply);

    expect(apply).toHaveBeenCalledTimes(1);
    expect(doc.startViewTransition).not.toHaveBeenCalled();
  });

  it("applies at once when the motion setting is reduce", () => {
    stubViewTransitions();
    document.documentElement.dataset.motion = "reduce";
    const apply = vi.fn();

    revealTheme({ x: 10, y: 10 }, apply);

    expect(apply).toHaveBeenCalledTimes(1);
    expect(doc.startViewTransition).not.toHaveBeenCalled();
  });

  it("animates when the motion setting is full even if the system asks for less", async () => {
    stubViewTransitions();
    stubReducedMotion(true);
    document.documentElement.dataset.motion = "full";

    revealTheme({ x: 10, y: 10 }, vi.fn());

    expect(doc.startViewTransition).toHaveBeenCalledTimes(1);
    await Promise.resolve();
  });

  it("reveals a circle from the origin over 400ms with ease-out", async () => {
    const animate = stubViewTransitions();
    stubReducedMotion(false);
    vi.stubGlobal("innerWidth", 1000);
    vi.stubGlobal("innerHeight", 600);
    const apply = vi.fn();

    revealTheme({ x: 100, y: 500 }, apply);

    expect(apply).toHaveBeenCalledTimes(1);
    expect(document.documentElement).toHaveAttribute("data-theme-reveal");

    await vi.waitFor(() => expect(animate).toHaveBeenCalled());
    const [keyframes, options] = animate.mock.calls[0] as [
      { clipPath: string[] },
      KeyframeAnimationOptions,
    ];
    const radius = Math.hypot(900, 500);
    expect(keyframes.clipPath).toEqual([
      "circle(0px at 100px 500px)",
      `circle(${radius}px at 100px 500px)`,
    ]);
    expect(options).toMatchObject({
      duration: 400,
      easing: "ease-out",
      pseudoElement: "::view-transition-new(root)",
    });

    await vi.waitFor(() =>
      expect(document.documentElement).not.toHaveAttribute("data-theme-reveal"),
    );
  });

  it("still applies the change when the transition is skipped", async () => {
    root.animate = vi.fn();
    const apply = vi.fn();
    doc.startViewTransition = vi.fn((callback: () => void) => {
      callback();
      return {
        ready: Promise.reject(new Error("skipped")),
        finished: Promise.resolve(),
      };
    });

    revealTheme({ x: 0, y: 0 }, apply);

    expect(apply).toHaveBeenCalledTimes(1);
    await vi.waitFor(() =>
      expect(document.documentElement).not.toHaveAttribute("data-theme-reveal"),
    );
    expect(root.animate).not.toHaveBeenCalled();
  });
});
