import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createMemoryBackend } from "@/lib/storage/backend";
import { addMissedGoal } from "@/lib/storage/operations";
import type { MissedGoal } from "@/lib/storage/schemas";
import { createStore } from "@/lib/storage/store";
import { seriousViolations } from "@/test/axe";
import { AppProviders } from "@/test/wrappers";
import { SettingsView } from "./SettingsView";

vi.mock("next/navigation", async () =>
  (await import("@/test/navigation")).navigationMock("/settings"),
);

async function renderSettings(goals: string[] = []) {
  const backend = createMemoryBackend();
  const store = createStore(backend);
  const misses = goals.reduce<MissedGoal[]>(
    (list, goal) => addMissedGoal(list, goal, "no-match"),
    [],
  );
  await store.saveMisses(misses);
  const view = render(
    <AppProviders backend={backend}>
      <SettingsView viewer={null} version="1.2.3" />
    </AppProviders>,
  );
  await screen.findByRole("heading", {
    level: 2,
    name: "Help improve WhichAI",
  });
  return { backend, ...view };
}

describe("Help improve WhichAI", () => {
  it("says there is nothing to send when no goal was missed", async () => {
    await renderSettings();

    expect(await screen.findByText("No missed goals so far.")).toBeVisible();
    expect(
      screen.queryByRole("link", { name: /Open a GitHub issue/ }),
    ).toBeNull();
  });

  it("lists the goals kept on this device and links to a prefilled issue", async () => {
    await renderSettings(["weather in delhi", "make a quantum toaster"]);

    expect(
      await screen.findByText("2 goals kept on this device"),
    ).toBeInTheDocument();
    expect(screen.getByText("make a quantum toaster")).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /Open a GitHub issue/ });
    const url = new URL(link.getAttribute("href") ?? "");
    expect(url.pathname.endsWith("/issues/new")).toBe(true);
    expect(url.searchParams.get("body")).toContain("make a quantum toaster");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("sends nothing by itself: the list only leaves through that link", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await renderSettings(["weather in delhi"]);
    await screen.findByText("1 goal kept on this device");

    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("clears the list", async () => {
    const user = userEvent.setup();
    const { backend } = await renderSettings(["weather in delhi"]);

    await user.click(
      await screen.findByRole("button", { name: "Clear this list" }),
    );

    expect(await screen.findByText("No missed goals so far.")).toBeVisible();
    await waitFor(async () =>
      expect(await createStore(backend).loadMisses()).toEqual([]),
    );
  });

  it("has no serious accessibility problems", async () => {
    const { container } = await renderSettings(["weather in delhi"]);
    await screen.findByText("1 goal kept on this device");

    expect(await seriousViolations(container)).toEqual([]);
  });
});
