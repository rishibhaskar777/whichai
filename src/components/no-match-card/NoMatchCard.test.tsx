import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/lib/i18n/provider";
import { coveredGoals } from "@/lib/plan/interpret-goal";
import { seriousViolations } from "@/test/axe";
import { filterGoals, NoMatchCard } from "./NoMatchCard";

function card(onChoose: (example: string) => void = () => {}) {
  return (
    <I18nProvider locale="en">
      <NoMatchCard goals={coveredGoals} onChoose={onChoose} />
    </I18nProvider>
  );
}

describe("NoMatchCard", () => {
  it("says honestly that there is no plan yet", () => {
    render(card());

    expect(
      screen.getByRole("heading", {
        name: "We don't have a plan for this goal yet",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/we won't guess/)).toBeInTheDocument();
  });

  it("shows the eight most common goals as chips", () => {
    render(card());

    const list = screen.getByRole("list", { name: "Goals we cover" });
    expect(list.querySelectorAll("button")).toHaveLength(8);
    expect(
      within(list).getByRole("button", { name: "Portfolio website" }),
    ).toBeInTheDocument();
    expect(
      within(list).getByRole("button", { name: "Study plan" }),
    ).toBeInTheDocument();
    expect(within(list).queryByRole("button", { name: "Podcast" })).toBeNull();
  });

  it("filters every goal with the search box", async () => {
    const user = userEvent.setup();
    render(card());

    await user.type(screen.getByLabelText("Search all goals"), "podcast");

    const results = screen.getByRole("list", { name: "Matching goals" });
    expect(
      within(results).getByRole("button", { name: "Podcast" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/goals? match/)).toBeInTheDocument();
  });

  it("finds a goal by a word from its keywords", async () => {
    const user = userEvent.setup();
    render(card());

    await user.type(screen.getByLabelText("Search all goals"), "capcut");

    expect(
      within(screen.getByRole("list", { name: "Matching goals" })).getByRole(
        "button",
        { name: "Edit a video" },
      ),
    ).toBeInTheDocument();
  });

  it("says when no goal matches the search", async () => {
    const user = userEvent.setup();
    render(card());

    await user.type(screen.getByLabelText("Search all goals"), "zzzzqq");

    expect(screen.getByText(/No goal matches that/)).toBeInTheDocument();
  });

  it("expands a list of all goals, grouped by category", async () => {
    const user = userEvent.setup();
    render(card());
    const toggle = screen.getByRole("button", { name: "See all goals" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    for (const group of [
      "Websites and apps",
      "Create",
      "Study",
      "Work and business",
      "AI tools",
    ]) {
      expect(
        screen.getByRole("heading", { level: 2, name: group }),
      ).toBeInTheDocument();
    }
    const buttons = screen
      .getAllByRole("button")
      .filter((button) => button.className.includes("goal"));
    expect(buttons.length).toBe(8 + coveredGoals.length);
  });

  it("puts every goal in exactly one group", () => {
    const groups = new Set(coveredGoals.map((goal) => goal.group));
    expect(groups.size).toBe(5);
    expect(coveredGoals.filter((goal) => goal.common)).toHaveLength(8);
  });

  it("reports the example goal when one is tapped", async () => {
    const onChoose = vi.fn();
    const user = userEvent.setup();
    render(card(onChoose));

    await user.click(screen.getByRole("button", { name: "Study plan" }));

    expect(onChoose).toHaveBeenCalledExactlyOnceWith(
      "Make a study plan for my upcoming exams",
    );
  });

  it("has no serious or critical axe violations", async () => {
    const user = userEvent.setup();
    const { container } = render(card());
    await user.click(screen.getByRole("button", { name: "See all goals" }));

    expect(await seriousViolations(container)).toEqual([]);
  });
});

describe("filterGoals", () => {
  it("returns every goal for an empty search", () => {
    expect(filterGoals(coveredGoals, " ")).toHaveLength(coveredGoals.length);
  });

  it("needs every word to match", () => {
    expect(filterGoals(coveredGoals, "youtube channel").length).toBeGreaterThan(
      0,
    );
    expect(filterGoals(coveredGoals, "youtube zzzzqq")).toEqual([]);
  });
});
