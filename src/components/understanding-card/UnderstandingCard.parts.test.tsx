import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/lib/i18n/provider";
import {
  listParts,
  understandGoal,
  type GoalSuggestion,
} from "@/lib/plan/interpret-goal";
import type { Chip } from "@/lib/schemas/plan";
import { UnderstandingCard } from "./UnderstandingCard";

interface HarnessProps {
  text: string;
  suggestions?: GoalSuggestion[];
  onChooseGoal?: (goalType: GoalSuggestion["goalType"]) => void;
  onBuildFromParts?: () => void;
}

function Harness({
  text,
  suggestions = [],
  onChooseGoal,
  onBuildFromParts,
}: HarnessProps) {
  const [chips, setChips] = useState<readonly Chip[]>(
    understandGoal(text)?.goal.chips ?? [],
  );
  return (
    <I18nProvider locale="en">
      <UnderstandingCard
        chips={chips}
        options={[]}
        parts={listParts()}
        suggestions={suggestions}
        {...(onChooseGoal ? { onChooseGoal } : {})}
        onBuildFromParts={onBuildFromParts}
        onRemoveChip={(id) =>
          setChips((current) => current.filter((chip) => chip.id !== id))
        }
        onAddChip={(chip) => setChips((current) => [...current, chip])}
        onEdit={() => {}}
        onConfirm={() => {}}
      />
    </I18nProvider>
  );
}

function chipLabels() {
  const list = screen.getByRole("list", { name: "What we understood" });
  return Array.from(list.querySelectorAll("li")).map((item) =>
    item.textContent?.trim(),
  );
}

describe("UnderstandingCard parts", () => {
  it("shows the goal and the parts found beyond it as chips", () => {
    render(<Harness text="portfolio website with a chatbot" />);

    expect(chipLabels()).toEqual(["Portfolio website", "Chatbot builder"]);
  });

  it("removes a detected part", async () => {
    const user = userEvent.setup();
    render(<Harness text="portfolio website with a chatbot" />);

    await user.click(
      screen.getByRole("button", { name: "Remove Chatbot builder" }),
    );

    expect(chipLabels()).toEqual(["Portfolio website"]);
  });

  it("adds a part from the searchable list", async () => {
    const user = userEvent.setup();
    render(<Harness text="portfolio website" />);

    await user.click(screen.getByRole("button", { name: "Add a part" }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("Search parts"), "razorpay");
    await user.click(
      within(dialog).getByRole("button", { name: /Payments \(India\)/ }),
    );

    expect(chipLabels()).toEqual(["Portfolio website", "Payments (India)"]);
    expect(screen.getByText("Added Payments (India).")).toBeInTheDocument();
  });

  it("does not show Did you mean when the goal is clear", () => {
    render(<Harness text="portfolio website" />);

    expect(screen.queryByText("Did you mean one of these?")).toBeNull();
  });

  it("offers the top goals and a plan from the parts when unsure", async () => {
    const user = userEvent.setup();
    const onChooseGoal = vi.fn();
    const onBuildFromParts = vi.fn();
    const understanding = understandGoal("host my site on vercel")!;
    render(
      <Harness
        text="a website"
        suggestions={understanding.suggestions}
        onChooseGoal={onChooseGoal}
        onBuildFromParts={onBuildFromParts}
      />,
    );

    expect(screen.getByText("Did you mean one of these?")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: understanding.suggestions[0]!.title }),
    );
    expect(onChooseGoal).toHaveBeenCalledWith(
      understanding.suggestions[0]!.goalType,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Build from the parts I described",
      }),
    );
    expect(onBuildFromParts).toHaveBeenCalled();
  });
});
