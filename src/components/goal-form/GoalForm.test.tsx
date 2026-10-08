import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GOAL_MAX_LENGTH } from "@/lib/schemas/goal";
import { GoalForm } from "./GoalForm";

function goalInput() {
  return screen.getByLabelText("What do you want to do with AI?");
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GoalForm", () => {
  it("rejects empty input with a message", async () => {
    const user = userEvent.setup();
    render(<GoalForm />);

    await user.click(goalInput());
    await user.keyboard("{Enter}");

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Describe what you want to do first.",
    );
    expect(goalInput()).toHaveAttribute("aria-invalid", "true");
  });

  it("rejects whitespace-only input", async () => {
    const user = userEvent.setup();
    render(<GoalForm />);

    await user.type(goalInput(), "   ");
    await user.keyboard("{Enter}");

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("submits on Enter and shows the planner notice without any request", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const user = userEvent.setup();
    render(<GoalForm />);

    await user.type(goalInput(), "Build a portfolio site");
    await user.keyboard("{Enter}");

    expect(screen.getByRole("status")).toHaveTextContent(
      "The planner arrives in the next release.",
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("inserts a new line on Shift+Enter instead of submitting", async () => {
    const user = userEvent.setup();
    render(<GoalForm />);

    await user.type(goalInput(), "first line");
    await user.keyboard("{Shift>}{Enter}{/Shift}");
    await user.keyboard("second line");

    expect(goalInput()).toHaveValue("first line\nsecond line");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("limits input to the maximum length and shows a counter near it", async () => {
    const user = userEvent.setup();
    render(<GoalForm />);

    await user.click(goalInput());
    await user.paste("a".repeat(GOAL_MAX_LENGTH + 50));

    expect(goalInput()).toHaveValue("a".repeat(GOAL_MAX_LENGTH));
    expect(
      screen.getByText(`${GOAL_MAX_LENGTH} / ${GOAL_MAX_LENGTH}`),
    ).toBeInTheDocument();
  });

  it("hides the counter while input is short", async () => {
    const user = userEvent.setup();
    render(<GoalForm />);

    await user.type(goalInput(), "short");

    expect(screen.queryByText(/ \/ 500/)).not.toBeInTheDocument();
  });

  it("fills the input from a suggestion chip without submitting", async () => {
    const user = userEvent.setup();
    render(<GoalForm />);

    await user.click(screen.getByRole("button", { name: "Study plan" }));

    expect(goalInput()).toHaveValue("Make a study plan for my upcoming exams");
    expect(goalInput()).toHaveFocus();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("offers the six suggestions", () => {
    render(<GoalForm />);
    expect(screen.getAllByRole("listitem")).toHaveLength(6);
  });
});
