import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { interpretGoal } from "@/lib/plan/interpret-goal";
import { decodePlanRequest } from "@/lib/share/share-link";
import { createMemoryBackend } from "@/lib/storage/backend";
import type { SavedPlan } from "@/lib/storage/schemas";
import { createStore } from "@/lib/storage/store";
import { planNamed, seed } from "@/test/seed";
import { AppProviders } from "@/test/wrappers";
import { PlanView } from "./PlanView";

vi.mock("next/navigation", async () =>
  (await import("@/test/navigation")).navigationMock("/"),
);

const GOAL = interpretGoal("portfolio website with animations");
if (!GOAL) throw new Error("test goal not understood");

async function renderPlan(plans: SavedPlan[] = []) {
  const backend = createMemoryBackend();
  if (plans.length > 0) await seed(backend, { plans });
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(
    <AppProviders backend={backend}>
      <PlanView goal={GOAL!} initialLevel="polished" />
    </AppProviders>,
  );
  return { backend, user };
}

async function saved(backend: ReturnType<typeof createMemoryBackend>) {
  return (await createStore(backend).load()).plans;
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, "clipboard");
});

describe("Save", () => {
  it("saves the plan request, not the plan, and confirms with a toast", async () => {
    const { backend, user } = await renderPlan();

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Saved to Projects")).toBeInTheDocument();
    const [plan] = await saved(backend);
    expect(plan?.planRequest).toMatchObject({
      level: "polished",
      budget: null,
      toolsUsed: [],
    });
    expect(plan?.planRequest.goal.goalType).toBe("portfolio-website");
    expect(JSON.stringify(plan)).not.toContain("starterBrief");
    expect(plan?.title).toBe(
      screen.getByRole("heading", { level: 1 }).textContent,
    );
    expect(screen.getByRole("button", { name: "Saved" })).toBeDisabled();
  });

  it("Undo removes the plan again", async () => {
    const { backend, user } = await renderPlan();
    await user.click(screen.getByRole("button", { name: "Save" }));

    await user.click(await screen.findByRole("button", { name: "Undo" }));

    expect(await saved(backend)).toEqual([]);
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });

  it("dismisses the toast after five seconds, and pauses while hovered", async () => {
    const { user } = await renderPlan();
    await user.click(screen.getByRole("button", { name: "Save" }));
    const toast = (await screen.findByText("Saved to Projects")).closest(
      "div",
    ) as HTMLElement;

    await user.hover(toast);
    await act(() => vi.advanceTimersByTimeAsync(8000));
    expect(screen.getByText("Saved to Projects")).toBeInTheDocument();

    await user.unhover(toast);
    await act(() => vi.advanceTimersByTimeAsync(5300));
    // The exit animation is a second step once the toast starts leaving.
    await act(() => vi.advanceTimersByTimeAsync(300));
    expect(screen.queryByText("Saved to Projects")).not.toBeInTheDocument();
  });

  it("offers to update the saved plan after a change", async () => {
    const { backend, user } = await renderPlan();
    await user.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByText("Saved to Projects");

    await user.click(screen.getByRole("radio", { name: "₹0" }));
    await user.click(screen.getByRole("button", { name: "Update saved plan" }));

    const plans = await saved(backend);
    expect(plans).toHaveLength(1);
    expect(plans[0]?.planRequest.budget).toBe("zero");
    expect(await screen.findByText("Saved plan updated")).toBeInTheDocument();
  });

  it("tells the person when the plan limit is reached", async () => {
    const full = Array.from({ length: 100 }, () => planNamed("p"));
    const { backend, user } = await renderPlan(full);
    await act(() => vi.advanceTimersByTimeAsync(50));

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText(/You can keep up to 100 saved plans/),
    ).toBeInTheDocument();
    expect(await saved(backend)).toHaveLength(100);
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });
});

describe("Copy share link", () => {
  it("copies a link that holds the request after the #", async () => {
    const { user } = await renderPlan();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    await user.click(screen.getByRole("button", { name: "Copy share link" }));

    expect(writeText).toHaveBeenCalledTimes(1);
    const url = new URL(writeText.mock.calls[0]?.[0] as string);
    expect(url.pathname).toBe("/plan");
    expect(url.search).toBe("");
    const decoded = decodePlanRequest(url.hash);
    expect(decoded).toMatchObject({ ok: true });
    expect(await screen.findByText(/Link copied/)).toBeInTheDocument();
  });

  it("says so when the clipboard is blocked", async () => {
    const { user } = await renderPlan();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockRejectedValue(new Error("blocked")) },
      configurable: true,
    });

    await user.click(screen.getByRole("button", { name: "Copy share link" }));

    expect(
      await screen.findByText(/Couldn't copy the link/),
    ).toBeInTheDocument();
  });
});

describe("Download PDF", () => {
  it("opens the print dialog with the plan as the title, then restores it", async () => {
    const original = document.title;
    let titleWhilePrinting = "";
    const print = vi.spyOn(window, "print").mockImplementation(() => {
      titleWhilePrinting = document.title;
    });
    const { user } = await renderPlan();

    await user.click(screen.getByRole("button", { name: "Download PDF" }));
    window.dispatchEvent(new Event("afterprint"));

    expect(print).toHaveBeenCalledTimes(1);
    expect(titleWhilePrinting).toBe(
      screen.getByRole("heading", { level: 1 }).textContent,
    );
    expect(document.title).toBe(original);
  });

  it("marks the parts that are left out of the print layout", async () => {
    await renderPlan();
    expect(
      document.querySelectorAll("[data-print-hide]").length,
    ).toBeGreaterThan(2);
  });
});
