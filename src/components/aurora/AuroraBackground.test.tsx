import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryBackend } from "@/lib/storage/backend";
import { DEFAULT_SETTINGS, type Settings } from "@/lib/storage/schemas";
import { seed } from "@/test/seed";
import { AppProviders } from "@/test/wrappers";
import { AuroraBackground } from "./AuroraBackground";

const engine = vi.hoisted(() => ({
  startAurora: vi.fn(),
}));

vi.mock("./aurora-engine", () => engine);

vi.mock("next/navigation", async () =>
  (await import("@/test/navigation")).navigationMock("/"),
);

const handle = { setAnimated: vi.fn(), destroy: vi.fn() };

async function renderAurora(settings: Partial<Settings> = {}) {
  const backend = createMemoryBackend();
  await seed(backend, { settings: { ...DEFAULT_SETTINGS, ...settings } });
  const view = render(
    <AppProviders backend={backend}>
      <AuroraBackground />
    </AppProviders>,
  );
  const layer = view.container.querySelector("[data-layer]") as HTMLElement;
  return { ...view, layer };
}

function setSaveData(saveData: boolean) {
  Object.defineProperty(navigator, "connection", {
    configurable: true,
    value: Object.assign(new EventTarget(), { saveData }),
  });
}

beforeEach(() => {
  engine.startAurora.mockReset();
  engine.startAurora.mockReturnValue(handle);
  handle.setAnimated.mockClear();
  handle.destroy.mockClear();
});

afterEach(() => {
  document.documentElement.removeAttribute("data-motion");
  Reflect.deleteProperty(navigator, "connection");
});

describe("AuroraBackground", () => {
  it("is hidden from assistive technology", async () => {
    const { layer } = await renderAurora();
    expect(layer).toHaveAttribute("aria-hidden", "true");
  });

  it("shows the CSS glow first and switches to the canvas once it runs", async () => {
    const { layer } = await renderAurora();
    expect(layer).toHaveAttribute("data-layer", "css");
    await waitFor(() => expect(layer).toHaveAttribute("data-layer", "canvas"));
    expect(engine.startAurora).toHaveBeenCalledTimes(1);
  });

  it("animates by default", async () => {
    const { layer } = await renderAurora();
    await waitFor(() => expect(engine.startAurora).toHaveBeenCalled());
    expect(engine.startAurora.mock.calls[0]?.[1]).toBe(true);
    expect(layer).toHaveAttribute("data-animated", "true");
  });

  it("draws a still background when the setting is Off", async () => {
    const { layer } = await renderAurora({ animatedBackground: false });
    await waitFor(() => expect(engine.startAurora).toHaveBeenCalled());
    await waitFor(() =>
      expect(layer).toHaveAttribute("data-animated", "false"),
    );
    const lastCall = engine.startAurora.mock.calls.at(-1);
    const lastAnimated = handle.setAnimated.mock.calls.at(-1)?.[0];
    expect(lastCall?.[1] === false || lastAnimated === false).toBe(true);
  });

  it("draws a still background when Reduce motion is On", async () => {
    const { layer } = await renderAurora({ reduceMotion: "on" });
    await waitFor(() => expect(engine.startAurora).toHaveBeenCalled());
    expect(engine.startAurora.mock.calls[0]?.[1]).toBe(false);
    expect(layer).toHaveAttribute("data-animated", "false");
  });

  it("keeps animating when Reduce motion is set to Off", async () => {
    const { layer } = await renderAurora({ reduceMotion: "off" });
    await waitFor(() => expect(engine.startAurora).toHaveBeenCalled());
    expect(engine.startAurora.mock.calls[0]?.[1]).toBe(true);
    expect(layer).toHaveAttribute("data-animated", "true");
  });

  it("draws a still background in save-data mode", async () => {
    setSaveData(true);
    const { layer } = await renderAurora();
    await waitFor(() => expect(engine.startAurora).toHaveBeenCalled());
    expect(engine.startAurora.mock.calls[0]?.[1]).toBe(false);
    expect(layer).toHaveAttribute("data-animated", "false");
  });

  it("keeps the CSS glow when a 2D canvas is not available", async () => {
    engine.startAurora.mockReturnValue(null);
    const { layer } = await renderAurora();
    await waitFor(() => expect(engine.startAurora).toHaveBeenCalled());
    expect(layer).toHaveAttribute("data-layer", "css");
  });

  it("keeps the CSS glow when the engine fails to load", async () => {
    engine.startAurora.mockImplementation(() => {
      throw new Error("no canvas");
    });
    const { layer } = await renderAurora();
    await waitFor(() => expect(engine.startAurora).toHaveBeenCalled());
    expect(layer).toHaveAttribute("data-layer", "css");
  });

  it("stops the engine when it unmounts", async () => {
    const { layer, unmount } = await renderAurora();
    await waitFor(() => expect(layer).toHaveAttribute("data-layer", "canvas"));
    unmount();
    expect(handle.destroy).toHaveBeenCalled();
  });
});
