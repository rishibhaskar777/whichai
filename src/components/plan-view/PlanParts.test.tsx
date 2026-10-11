import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { interpretGoal } from "@/lib/plan/interpret-goal";
import type { PlanRequest } from "@/lib/schemas/plan-request";
import { seriousViolations } from "@/test/axe";
import { AppProviders } from "@/test/wrappers";
import { PlanView } from "./PlanView";

vi.mock("next/navigation", async () =>
  (await import("@/test/navigation")).navigationMock("/"),
);

const GOAL = interpretGoal("portfolio website")!;

function renderPlan(
  props: {
    addedJobs?: string[];
    removedJobs?: string[];
    onRequestChange?: (request: PlanRequest) => void;
  } = {},
) {
  return render(
    <AppProviders>
      <PlanView
        goal={GOAL}
        initialLevel="simple"
        initialAddedJobs={props.addedJobs}
        initialRemovedJobs={props.removedJobs}
        onRequestChange={props.onRequestChange}
      />
    </AppProviders>,
  );
}

function jobNames() {
  return Array.from(document.querySelectorAll('[id^="job-card-"]')).map(
    (card) => card.querySelector("p")?.firstChild?.textContent ?? "",
  );
}

async function addPart(
  user: ReturnType<typeof userEvent.setup>,
  search: string,
  name: RegExp,
) {
  await user.click(screen.getByRole("button", { name: "Add a part" }));
  const dialog = await screen.findByRole("dialog");
  await user.type(within(dialog).getByLabelText("Search parts"), search);
  await user.click(within(dialog).getByRole("button", { name }));
}

describe("Add a part", () => {
  it("opens a searchable list of every job, grouped by category", async () => {
    const user = userEvent.setup();
    renderPlan();

    await user.click(screen.getByRole("button", { name: "Add a part" }));
    const dialog = await screen.findByRole("dialog", { name: "Add a part" });

    const headings = within(dialog)
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent);
    expect(headings).toEqual([
      "AI",
      "Build",
      "Design",
      "Media",
      "Productivity",
      "Learning",
      "Research",
    ]);
    expect(
      within(dialog).getByRole("button", { name: /Payments \(India\)/ }),
    ).toBeEnabled();

    await user.type(within(dialog).getByLabelText("Search parts"), "payment");
    const shown = within(dialog)
      .getAllByRole("button")
      .map((button) => button.textContent ?? "");
    expect(shown.some((text) => text.includes("Payments (India)"))).toBe(true);
    expect(shown.some((text) => text.includes("Flashcards"))).toBe(false);
  });

  it("says when nothing matches", async () => {
    const user = userEvent.setup();
    renderPlan();

    await user.click(screen.getByRole("button", { name: "Add a part" }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("Search parts"), "zzzzqq");

    expect(
      within(dialog).getByText("No part matches that. Try another word."),
    ).toBeInTheDocument();
  });

  it("marks parts that are already in the plan and cannot add them twice", async () => {
    const user = userEvent.setup();
    renderPlan();

    await user.click(screen.getByRole("button", { name: "Add a part" }));
    const dialog = await screen.findByRole("dialog");

    expect(
      within(dialog).getByRole("button", { name: /AI assistant/ }),
    ).toBeDisabled();
  });

  it("adds a card with the engine's pick and reports the change", async () => {
    const user = userEvent.setup();
    const onRequestChange = vi.fn();
    renderPlan({ onRequestChange });
    expect(jobNames()).not.toContain("Payments (India)");

    await addPart(user, "razorpay", /Payments \(India\)/);

    await waitFor(() => expect(jobNames()).toContain("Payments (India)"));
    expect(onRequestChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ addedJobs: ["payments-india"] }),
    );
    expect(screen.getByText("Added Payments (India).")).toBeInTheDocument();
  });

  it("starts from the parts stored in the request", () => {
    renderPlan({ addedJobs: ["payments-india"] });

    expect(jobNames()).toContain("Payments (India)");
  });

  it("removes a part and puts it back with Undo", async () => {
    const user = userEvent.setup();
    const onRequestChange = vi.fn();
    renderPlan({ onRequestChange });
    expect(jobNames()).toContain("AI assistant");

    await user.click(
      screen.getByRole("button", { name: "Remove AI assistant from the plan" }),
    );

    await waitFor(() => expect(jobNames()).not.toContain("AI assistant"));
    expect(onRequestChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ removedJobs: ["ai-assistant"] }),
    );

    await user.click(await screen.findByRole("button", { name: "Undo" }));

    await waitFor(() => expect(jobNames()).toContain("AI assistant"));
  });

  it("puts a removed part back from the list", async () => {
    const user = userEvent.setup();
    renderPlan({ removedJobs: ["ai-assistant"] });
    expect(jobNames()).not.toContain("AI assistant");

    await addPart(user, "assistant", /AI assistant/);

    await waitFor(() => expect(jobNames()).toContain("AI assistant"));
  });

  it("keeps the last part, so a plan is never empty", async () => {
    renderPlan({
      removedJobs: ["ai-assistant", "ui-templates"],
    });

    expect(jobNames()).toEqual(["Hosting"]);
    expect(
      screen.queryByRole("button", { name: /Remove .* from the plan/ }),
    ).toBeNull();
  });

  it("has no serious accessibility problems with the list open", async () => {
    const user = userEvent.setup();
    const { container } = renderPlan();

    await user.click(screen.getByRole("button", { name: "Add a part" }));
    await screen.findByRole("dialog");

    expect(await seriousViolations(container)).toEqual([]);
  });
});
