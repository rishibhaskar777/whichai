import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { coveredGoals } from "@/lib/plan/interpret-goal";
import { seriousViolations } from "@/test/axe";
import { NoMatchCard } from "./NoMatchCard";

describe("NoMatchCard", () => {
  it("says honestly that there is no plan yet", () => {
    render(<NoMatchCard goals={coveredGoals} onChoose={() => {}} />);

    expect(
      screen.getByRole("heading", {
        name: "We don't have a plan for this goal yet",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/we won't guess/)).toBeInTheDocument();
  });

  it("lists the goals we cover as buttons", () => {
    render(<NoMatchCard goals={coveredGoals} onChoose={() => {}} />);

    const list = screen.getByRole("list", { name: "Goals we cover" });
    expect(list.querySelectorAll("button")).toHaveLength(coveredGoals.length);
    expect(
      screen.getByRole("button", { name: "Portfolio website" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Study plan" }),
    ).toBeInTheDocument();
  });

  it("reports the example goal when one is tapped", async () => {
    const onChoose = vi.fn();
    const user = userEvent.setup();
    render(<NoMatchCard goals={coveredGoals} onChoose={onChoose} />);

    await user.click(screen.getByRole("button", { name: "Study plan" }));

    expect(onChoose).toHaveBeenCalledExactlyOnceWith(
      "Make a study plan for my upcoming exams",
    );
  });

  it("has no serious or critical axe violations", async () => {
    const { container } = render(
      <NoMatchCard goals={coveredGoals} onChoose={() => {}} />,
    );
    expect(await seriousViolations(container)).toEqual([]);
  });
});
