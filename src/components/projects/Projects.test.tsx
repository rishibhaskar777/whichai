import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CATALOGUE_VERSION } from "@/lib/storage/catalogue-version";
import { createMemoryBackend } from "@/lib/storage/backend";
import { createStore } from "@/lib/storage/store";
import { seriousViolations } from "@/test/axe";
import { planNamed, seed } from "@/test/seed";
import { AppProviders } from "@/test/wrappers";
import { ProjectsView } from "./ProjectsView";

vi.mock("next/navigation", async () =>
  (await import("@/test/navigation")).navigationMock("/projects"),
);

const DAY = 24 * 60 * 60 * 1000;

function ago(days: number): Date {
  return new Date(Date.now() - days * DAY);
}

async function renderProjects(
  plans = [planNamed("Portfolio v1", undefined, ago(2))],
) {
  const backend = createMemoryBackend();
  await seed(backend, { plans });
  const view = render(
    <AppProviders backend={backend}>
      <ProjectsView />
    </AppProviders>,
  );
  return { backend, ...view };
}

async function row(title: string) {
  const heading = await screen.findByRole("heading", { name: title });
  return heading.closest("li") as HTMLElement;
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Projects page", () => {
  it("explains the empty state and offers to make a plan", async () => {
    await renderProjects([]);

    expect(
      await screen.findByRole("heading", { name: "No saved plans yet" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Make a plan" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("lists saved plans with goal type, level and date", async () => {
    await renderProjects();

    const item = await row("Portfolio v1");
    expect(within(item).getByText("Portfolio website")).toBeInTheDocument();
    expect(within(item).getByText(/^Saved /)).toBeInTheDocument();
    expect(screen.getByText("1 saved plan")).toBeInTheDocument();
    expect(
      within(item).getAllByRole("link", { name: /Portfolio v1|Open/ })[0],
    ).toHaveAttribute("href", expect.stringContaining("/plan?id="));
  });

  it("shows the Updated tools badge only when the catalogue changed", async () => {
    const stale = { ...planNamed("Old plan"), catalogueVersion: "older" };
    const fresh = planNamed("Fresh plan");
    expect(fresh.catalogueVersion).toBe(CATALOGUE_VERSION);
    await renderProjects([stale, fresh]);

    expect(
      within(await row("Old plan")).getByText("Updated tools"),
    ).toBeInTheDocument();
    expect(
      within(await row("Fresh plan")).queryByText("Updated tools"),
    ).not.toBeInTheDocument();
  });

  it("renames a plan inline and saves it", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { backend } = await renderProjects();
    await screen.findByText("Portfolio v1");

    await user.click(
      screen.getByRole("button", { name: "Rename Portfolio v1" }),
    );
    const input = screen.getByLabelText("Plan name");
    await user.clear(input);
    await user.type(input, "Design portfolio{Enter}");

    expect(await screen.findByText("Design portfolio")).toBeInTheDocument();
    expect(screen.queryByLabelText("Plan name")).not.toBeInTheDocument();
    const stored = await createStore(backend).load();
    expect(stored.plans[0]?.title).toBe("Design portfolio");
  });

  it("cancels a rename with Escape", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await renderProjects();
    await screen.findByText("Portfolio v1");

    await user.click(
      screen.getByRole("button", { name: "Rename Portfolio v1" }),
    );
    await user.type(screen.getByLabelText("Plan name"), " extra{Escape}");

    expect(screen.getByText("Portfolio v1")).toBeInTheDocument();
    expect(screen.queryByLabelText("Plan name")).not.toBeInTheDocument();
  });

  it("duplicates a plan", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { backend } = await renderProjects();
    await screen.findByText("Portfolio v1");

    await user.click(
      screen.getByRole("button", { name: "Duplicate Portfolio v1" }),
    );

    expect(await screen.findByText("Portfolio v1 (copy)")).toBeInTheDocument();
    expect(screen.getByText("Plan duplicated")).toBeInTheDocument();
    expect((await createStore(backend).load()).plans).toHaveLength(2);
  });

  it("deletes with an Undo toast that brings the plan back", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { backend } = await renderProjects();
    await screen.findByText("Portfolio v1");

    await user.click(
      screen.getByRole("button", { name: "Delete Portfolio v1" }),
    );
    await act(() => vi.advanceTimersByTimeAsync(300));

    expect(screen.queryByText("Portfolio v1")).not.toBeInTheDocument();
    expect(screen.getByText("Plan deleted")).toBeInTheDocument();
    expect((await createStore(backend).load()).plans).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Undo" }));

    expect(await screen.findByText("Portfolio v1")).toBeInTheDocument();
    expect((await createStore(backend).load()).plans).toHaveLength(1);
  });

  it("searches by title and goal type, and says when nothing matches", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await renderProjects([
      planNamed("Portfolio v1"),
      planNamed("Exam prep", "60-day study plan for my exams"),
    ]);
    await screen.findByText("Exam prep");

    await user.type(screen.getByLabelText("Search projects"), "exam");
    expect(screen.queryByText("Portfolio v1")).not.toBeInTheDocument();
    expect(screen.getByText("Exam prep")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Search projects"));
    await user.type(screen.getByLabelText("Search projects"), "zzz");
    expect(
      screen.getByText("No saved plans match your search."),
    ).toBeInTheDocument();
  });

  it("sorts by most recent or by name", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await renderProjects([
      planNamed("Zebra", undefined, ago(1)),
      planNamed("Apple", undefined, ago(5)),
    ]);
    await screen.findByText("Zebra");
    const titles = () =>
      screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);

    expect(titles()).toEqual(["Zebra", "Apple"]);

    await user.selectOptions(screen.getByLabelText("Sort by"), "name");

    expect(titles()).toEqual(["Apple", "Zebra"]);
  });

  it("has no serious accessibility violations", async () => {
    const { container } = await renderProjects();
    await screen.findByText("Portfolio v1");
    expect(await seriousViolations(container)).toEqual([]);
  });

  it("has no serious accessibility violations when empty", async () => {
    const { container } = await renderProjects([]);
    await screen.findByText("No saved plans yet");
    expect(await seriousViolations(container)).toEqual([]);
  });
});
