import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { interpretGoal } from "@/lib/plan/interpret-goal";
import type { Chip } from "@/lib/schemas/plan";
import { seriousViolations } from "@/test/axe";
import { UnderstandingCard } from "./UnderstandingCard";

interface HarnessProps {
  goalText?: string;
  onEdit?: () => void;
  onConfirm?: () => void;
}

function Harness({
  goalText = "Portfolio website with a blog, built in React",
  onEdit = () => {},
  onConfirm = () => {},
}: HarnessProps) {
  const [chips, setChips] = useState<readonly Chip[]>(
    interpretGoal(goalText)?.chips ?? [],
  );
  return (
    <UnderstandingCard
      chips={chips}
      onRemoveChip={(id) =>
        setChips((current) => current.filter((chip) => chip.id !== id))
      }
      onAddChip={(chip) => setChips((current) => [...current, chip])}
      onEdit={onEdit}
      onConfirm={onConfirm}
    />
  );
}

function chipLabels() {
  const list = screen.getByRole("list", { name: "What we understood" });
  return Array.from(list.querySelectorAll("li")).map((item) =>
    item.textContent?.trim(),
  );
}

describe("UnderstandingCard", () => {
  it("shows what was understood as chips", () => {
    render(<Harness />);

    expect(
      screen.getByRole("heading", { name: "Here's what we understood" }),
    ).toBeInTheDocument();
    expect(chipLabels()).toEqual(["Portfolio website", "Blog", "React"]);
  });

  it("removes a chip with its x button and says so", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Remove Blog" }));

    expect(chipLabels()).toEqual(["Portfolio website", "React"]);
    expect(screen.getByText("Removed Blog.")).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "What we understood" }),
    ).toHaveFocus();
  });

  it("does not let the goal chip be removed", () => {
    render(<Harness />);
    expect(
      screen.queryByRole("button", { name: "Remove Portfolio website" }),
    ).not.toBeInTheDocument();
  });

  it("adds a chip from the fixed list and stops offering it", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Add Dark mode" }));

    expect(chipLabels()).toContain("Dark mode");
    expect(screen.getByText("Added Dark mode.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Add Dark mode" }),
    ).not.toBeInTheDocument();
  });

  it("offers only features that are not already present", () => {
    render(<Harness />);

    expect(
      screen.queryByRole("button", { name: "Add Blog" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add Animation" }),
    ).toBeInTheDocument();
  });

  it("lets a removed chip be added back", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Remove Blog" }));
    await user.click(screen.getByRole("button", { name: "Add Blog" }));

    expect(chipLabels()).toContain("Blog");
  });

  it("confirms and edits through the two buttons", async () => {
    const onConfirm = vi.fn();
    const onEdit = vi.fn();
    const user = userEvent.setup();
    render(<Harness onConfirm={onConfirm} onEdit={onEdit} />);

    await user.click(screen.getByRole("button", { name: "Yes, show my plan" }));
    await user.click(screen.getByRole("button", { name: "Edit" }));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it("has no serious or critical axe violations", async () => {
    const { container } = render(<Harness />);

    const violations = await seriousViolations(container);

    expect(
      violations.map((violation) => `${violation.id}: ${violation.help}`),
    ).toEqual([]);
  });
});
