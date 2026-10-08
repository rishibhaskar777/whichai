import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GOAL_MAX_LENGTH } from "@/lib/schemas/goal";
import { GoalForm } from "./GoalForm";

interface HarnessProps {
  onSubmit?: (goal: string) => void;
  compact?: boolean;
}

function Harness({ onSubmit = () => {}, compact = false }: HarnessProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  return (
    <GoalForm
      value={value}
      onValueChange={setValue}
      onSubmit={onSubmit}
      inputRef={inputRef}
      compact={compact}
    />
  );
}

function goalInput() {
  return screen.getByLabelText("What do you want to do with AI?");
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GoalForm", () => {
  it("rejects empty input with a message", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<Harness onSubmit={onSubmit} />);

    await user.click(goalInput());
    await user.keyboard("{Enter}");

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Describe what you want to do first.",
    );
    expect(goalInput()).toHaveAttribute("aria-invalid", "true");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects whitespace-only input", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<Harness onSubmit={onSubmit} />);

    await user.type(goalInput(), "   ");
    await user.keyboard("{Enter}");

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("passes the trimmed goal to onSubmit on Enter without any request", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<Harness onSubmit={onSubmit} />);

    await user.type(goalInput(), "  Build a portfolio site  ");
    await user.keyboard("{Enter}");

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith("Build a portfolio site");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("submits from the send button", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<Harness onSubmit={onSubmit} />);

    await user.type(goalInput(), "Plan my exams");
    await user.click(screen.getByRole("button", { name: "Get a plan" }));

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith("Plan my exams");
  });

  it("inserts a new line on Shift+Enter instead of submitting", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<Harness onSubmit={onSubmit} />);

    await user.type(goalInput(), "first line");
    await user.keyboard("{Shift>}{Enter}{/Shift}");
    await user.keyboard("second line");

    expect(goalInput()).toHaveValue("first line\nsecond line");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("limits input to the maximum length and shows a counter near it", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(goalInput());
    await user.paste("a".repeat(GOAL_MAX_LENGTH + 50));

    expect(goalInput()).toHaveValue("a".repeat(GOAL_MAX_LENGTH));
    expect(
      screen.getByText(`${GOAL_MAX_LENGTH} / ${GOAL_MAX_LENGTH}`),
    ).toBeInTheDocument();
  });

  it("hides the counter while input is short", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(goalInput(), "short");

    expect(screen.queryByText(/ \/ 500/)).not.toBeInTheDocument();
  });

  it("fills the input from a suggestion chip without submitting", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<Harness onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Study plan" }));

    expect(goalInput()).toHaveValue("Make a study plan for my upcoming exams");
    expect(goalInput()).toHaveFocus();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("offers the six suggestions", () => {
    render(<Harness />);
    expect(screen.getAllByRole("listitem")).toHaveLength(6);
  });

  it("hides the suggestions in compact mode", () => {
    render(<Harness compact />);
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.getByText("Describe another goal")).toBeInTheDocument();
  });
});
