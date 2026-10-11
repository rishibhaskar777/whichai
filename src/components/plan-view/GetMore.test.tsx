import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { interpretGoal } from "@/lib/plan/interpret-goal";
import type { UnderstoodGoal } from "@/lib/schemas/plan";
import { seriousViolations } from "@/test/axe";
import { AppProviders } from "@/test/wrappers";
import { PlanView } from "./PlanView";

vi.mock("next/navigation", async () =>
  (await import("@/test/navigation")).navigationMock("/"),
);

function understand(text: string): UnderstoodGoal {
  const goal = interpretGoal(text);
  if (!goal) throw new Error(`Test goal not understood: ${text}`);
  return goal;
}

function renderPlan(
  chosen: Record<string, string>,
  goal = "I want to make a simple game",
) {
  return render(
    <AppProviders>
      <PlanView
        goal={understand(goal)}
        initialLevel="simple"
        initialChosenTools={chosen}
      />
    </AppProviders>,
  );
}

function cardOf(toolName: string) {
  return screen.getByRole("article", { name: toolName });
}

describe("Get more on an AI tool's card", () => {
  it("starts collapsed and opens on request", async () => {
    const user = userEvent.setup();
    renderPlan({ "ai-assistant": "claude" });

    const toggle = within(cardOf("Claude")).getByRole("button", {
      name: "Get more from Claude",
    });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("shows model names with the date and the source, and the starter prompt", async () => {
    const user = userEvent.setup();
    renderPlan({ "ai-assistant": "claude" });
    const card = cardOf("Claude");
    await user.click(
      within(card).getByRole("button", { name: "Get more from Claude" }),
    );

    expect(within(card).getByText(/As of .*2026/)).toBeInTheDocument();
    expect(
      within(card).getAllByText(/Fable 5.1|Opus 5.5|Sonnet 5.5|Haiku 5.5/),
    ).not.toHaveLength(0);
    const source = within(card).getAllByRole("link", { name: /Source/ });
    expect(source[0]).toHaveAttribute("href", "https://claude.com/pricing");
    expect(within(card).getByText(/Settings that help/)).toBeInTheDocument();
    expect(
      within(card).getByRole("button", {
        name: "Copy the starter prompt for Claude",
      }),
    ).toBeInTheDocument();
  });

  it("falls back to capability advice when no names are recorded", async () => {
    const user = userEvent.setup();
    renderPlan({ "ai-assistant": "chatgpt" });
    const card = cardOf("ChatGPT");
    await user.click(
      within(card).getByRole("button", { name: "Get more from ChatGPT" }),
    );

    expect(within(card).queryByText(/As of /)).not.toBeInTheDocument();
    expect(
      within(card).getByText(/No model names are recorded/),
    ).toBeInTheDocument();
  });

  it("lists add-ons from the catalogue with their kind and Get it button", async () => {
    const user = userEvent.setup();
    renderPlan(
      { "ai-assistant": "gemini" },
      "I need to prepare for my exams in two months",
    );
    const card = cardOf("Gemini");
    await user.click(
      within(card).getByRole("button", { name: "Get more from Gemini" }),
    );

    const addOns = within(card).getByRole("heading", {
      name: "Add-ons",
    }).parentElement!;
    expect(
      within(addOns).getByText("Gemini Notebook (NotebookLM)"),
    ).toBeInTheDocument();
    expect(
      within(addOns).getAllByRole("link", { name: /Open|Official|Get/i })
        .length,
    ).toBeGreaterThan(0);
  });

  it("is left out for a tool with no recorded data", () => {
    renderPlan({ "ai-assistant": "meta-ai" });
    const card = cardOf("Meta AI");
    expect(
      within(card).queryByRole("button", { name: /Get more from/ }),
    ).not.toBeInTheDocument();
  });

  it("has no serious accessibility violations when expanded", async () => {
    const user = userEvent.setup();
    const { container } = renderPlan({ "ai-assistant": "claude" });
    await user.click(
      within(cardOf("Claude")).getByRole("button", {
        name: "Get more from Claude",
      }),
    );
    expect(await seriousViolations(container)).toEqual([]);
  });

  it("changes the headline with the goal", () => {
    const game = renderPlan({ "ai-assistant": "claude" });
    const gameHeading = within(cardOf("Claude")).getByRole("heading", {
      level: 3,
    }).textContent;
    game.unmount();

    renderPlan({ "ai-assistant": "claude" }, "I want to start a blog");
    const blogHeading = within(cardOf("Claude")).getByRole("heading", {
      level: 3,
    }).textContent;

    expect(gameHeading).toMatch(/^Use Claude to /);
    expect(blogHeading).toMatch(/^Use Claude to /);
    expect(gameHeading).not.toBe(blogHeading);
  });
});
