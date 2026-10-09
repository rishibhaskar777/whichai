import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useNewPlanSignal } from "@/lib/new-plan-signal";
import { createMemoryBackend } from "@/lib/storage/backend";
import { DEFAULT_SETTINGS, type Settings } from "@/lib/storage/schemas";
import { createStore } from "@/lib/storage/store";
import { router } from "@/test/navigation";
import { seriousViolations } from "@/test/axe";
import { historyEntry, seed } from "@/test/seed";
import { AppProviders } from "@/test/wrappers";
import { SearchesView } from "./SearchesView";

vi.mock("next/navigation", async () =>
  (await import("@/test/navigation")).navigationMock("/searches"),
);

function daysAgo(days: number, hour = 9): Date {
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - days,
    hour,
  );
}

function Pending() {
  return <p data-testid="pending">{useNewPlanSignal().pendingGoal?.text}</p>;
}

async function renderSearches(
  history = [
    historyEntry("Build a portfolio website", daysAgo(0)),
    historyEntry("Make a study plan", daysAgo(1)),
    historyEntry("Improve my resume", daysAgo(4)),
    historyEntry("Make a short video", daysAgo(30)),
  ],
  settings: Settings = DEFAULT_SETTINGS,
) {
  const backend = createMemoryBackend();
  await seed(backend, { history, settings });
  const view = render(
    <AppProviders backend={backend}>
      <SearchesView />
      <Pending />
    </AppProviders>,
  );
  return { backend, ...view };
}

describe("Searches page", () => {
  it("groups entries by Today, Yesterday, Previous 7 days and Older", async () => {
    await renderSearches();

    const headings = await screen.findAllByRole("heading", { level: 2 });
    expect(headings.map((heading) => heading.textContent)).toEqual([
      "Today",
      "Yesterday",
      "Previous 7 days",
      "Older",
    ]);
    const today = screen.getByRole("region", { name: "Today" });
    expect(
      within(today).getByText("Build a portfolio website"),
    ).toBeInTheDocument();
    expect(screen.getByText("4 searches")).toBeInTheDocument();
  });

  it("re-runs a search on the home page without putting it in the URL", async () => {
    const user = userEvent.setup();
    await renderSearches();

    await user.click(
      await screen.findByRole("button", {
        name: "Run again: Make a study plan",
      }),
    );

    expect(router.push).toHaveBeenCalledWith("/");
    expect(screen.getByTestId("pending")).toHaveTextContent(
      "Make a study plan",
    );
  });

  it("deletes a single entry", async () => {
    const user = userEvent.setup();
    const { backend } = await renderSearches();

    await user.click(
      await screen.findByRole("button", {
        name: "Delete from history: Improve my resume",
      }),
    );

    expect(screen.queryByText("Improve my resume")).not.toBeInTheDocument();
    const stored = await createStore(backend).load();
    expect(stored.history.map((entry) => entry.goal)).not.toContain(
      "Improve my resume",
    );
    expect(stored.history).toHaveLength(3);
  });

  it("clears all history only after confirmation", async () => {
    const user = userEvent.setup();
    const { backend } = await renderSearches();
    await user.click(
      await screen.findByRole("button", { name: "Clear all history" }),
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByText("Make a study plan")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear all history" }));
    await user.click(screen.getByRole("button", { name: "Clear history" }));

    expect(await screen.findByText("No searches yet")).toBeInTheDocument();
    expect((await createStore(backend).load()).history).toEqual([]);
  });

  it("explains the empty state", async () => {
    await renderSearches([]);
    expect(await screen.findByText("No searches yet")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Make a plan" }),
    ).toBeInTheDocument();
  });

  it("says history is off and links to Settings", async () => {
    await renderSearches([], { ...DEFAULT_SETTINGS, saveHistory: false });

    expect(
      await screen.findByText(/Search history is off/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Change this in Settings" }),
    ).toHaveAttribute("href", "/settings");
  });

  it("shows entries as plain text, never as markup", async () => {
    await renderSearches([
      historyEntry("<img src=x onerror=alert(1)> portfolio", daysAgo(0)),
    ]);

    expect(
      await screen.findByText("<img src=x onerror=alert(1)> portfolio"),
    ).toBeInTheDocument();
    expect(document.querySelector("img")).toBeNull();
  });

  it("has no serious accessibility violations", async () => {
    const { container } = await renderSearches();
    await screen.findByText("Build a portfolio website");
    expect(await seriousViolations(container)).toEqual([]);
  });
});
