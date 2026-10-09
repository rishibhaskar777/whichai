import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildPlan } from "@/lib/engine/build-plan";
import { interpretGoal } from "@/lib/plan/interpret-goal";
import { LEVELS, type Level, type UnderstoodGoal } from "@/lib/schemas/plan";
import { seriousViolations } from "@/test/axe";
import { PlanView } from "./PlanView";

function understand(text: string): UnderstoodGoal {
  const goal = interpretGoal(text);
  if (!goal) throw new Error(`Test goal not understood: ${text}`);
  return goal;
}

const PORTFOLIO = understand("portfolio website with animations");
const STUDY = understand("60-day study plan for my exams");

function renderPlan(goal = PORTFOLIO, level: Level = "simple") {
  return render(<PlanView goal={goal} initialLevel={level} />);
}

function planFor(goal: UnderstoodGoal, level: Level) {
  return buildPlan(goal, {
    level,
    budget: null,
    toolsUsed: new Set(),
  });
}

function card(toolName: string) {
  return screen.getByRole("article", { name: toolName });
}

function level(name: string) {
  return screen.getByRole("radio", { name });
}

function useWideScreen() {
  const original = window.matchMedia;
  window.matchMedia = (query: string) =>
    ({
      matches: query.includes("min-width: 768px"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList;
  return () => {
    window.matchMedia = original;
  };
}

afterEach(() => {
  Reflect.deleteProperty(navigator, "clipboard");
});

describe("PlanView basics", () => {
  it("opens with the sample notice, then the headline", () => {
    renderPlan();

    expect(screen.getByText(/Sample data, not verified:/)).toBeInTheDocument();
    expect(
      screen.getByText(/prices, limits and dates are placeholders/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Your portfolio website plan",
      }),
    ).toBeInTheDocument();
  });

  it("moves focus to the headline when it appears", () => {
    renderPlan();
    expect(
      screen.getByRole("heading", { name: "Your portfolio website plan" }),
    ).toHaveFocus();
  });

  it("shows the overview for the starting level", () => {
    renderPlan();

    expect(screen.getByText("Estimated cost")).toBeInTheDocument();
    expect(screen.getByText("Estimated time")).toBeInTheDocument();
    expect(screen.getByText(/Free options may cover this/)).toBeInTheDocument();
  });

  it("ends with the price warning and the actions", () => {
    renderPlan();

    expect(
      screen.getByText(
        "Prices and limits change. Check the official page before paying.",
      ),
    ).toBeInTheDocument();
    const copyButtons = screen.getAllByRole("button", {
      name: "Copy starter brief",
    });
    expect(copyButtons).toHaveLength(2);
    for (const button of copyButtons) expect(button).toBeEnabled();
  });

  it("keeps Save, Download PDF and Share disabled with an explanation", () => {
    renderPlan();

    for (const name of ["Save", "Download PDF", "Share"]) {
      expect(screen.getByRole("button", { name })).toBeDisabled();
    }
    expect(
      screen.getByText(
        "Save, Download PDF and Share arrive in a later release.",
      ),
    ).toBeInTheDocument();
  });
});

describe("level switch", () => {
  it("is a radio group that starts on the inferred level", () => {
    renderPlan(PORTFOLIO, "polished");

    expect(
      screen.getByRole("radiogroup", { name: "Plan level" }),
    ).toBeInTheDocument();
    expect(level("Polished")).toBeChecked();
    expect(level("Simple")).not.toBeChecked();
    expect(
      screen.getByText(planFor(PORTFOLIO, "polished").levels.polished.summary),
    ).toBeInTheDocument();
  });

  it("changes the content when a level is clicked", async () => {
    const user = userEvent.setup();
    renderPlan();
    const simple = planFor(PORTFOLIO, "simple").levels.simple;
    const advanced = planFor(PORTFOLIO, "simple").levels.advanced;
    expect(screen.getByText(simple.summary)).toBeInTheDocument();

    await user.click(level("Advanced"));

    expect(level("Advanced")).toBeChecked();
    expect(screen.getByText(advanced.summary)).toBeInTheDocument();
    expect(screen.queryByText(simple.summary)).toBeNull();
    expect(screen.getByText("Showing the Advanced level.")).toBeInTheDocument();
  });

  it("moves with the arrow keys", async () => {
    const user = userEvent.setup();
    renderPlan();

    level("Simple").focus();
    await user.keyboard("{ArrowRight}");
    expect(level("Polished")).toBeChecked();
    expect(level("Polished")).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(level("Advanced")).toBeChecked();

    await user.keyboard("{ArrowLeft}");
    expect(level("Polished")).toBeChecked();
  });

  it("wraps around at the ends", async () => {
    const user = userEvent.setup();
    renderPlan();

    level("Simple").focus();
    await user.keyboard("{ArrowLeft}");

    expect(level("Advanced")).toBeChecked();
  });

  it("is a single tab stop", async () => {
    const user = userEvent.setup();
    renderPlan();
    level("Simple").focus();

    await user.tab();

    expect(level("Polished")).not.toHaveFocus();
    expect(level("Advanced")).not.toHaveFocus();
  });
});

describe("toolkit at a glance", () => {
  it("sits right below the overview and lists every chosen tool", () => {
    renderPlan();
    const headings = screen
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent);
    expect(headings.slice(0, 3)).toEqual([
      "Overview",
      "Your toolkit at a glance",
      "What to use",
    ]);

    const toolkit = screen
      .getByRole("heading", { name: "Your toolkit at a glance" })
      .closest("section") as HTMLElement;
    const chips = within(toolkit)
      .getAllByRole("button")
      .map((button) => button.textContent);
    const expected = planFor(PORTFOLIO, "simple").levels.simple.jobs.map(
      (job) => job.toolName,
    );
    expect(chips.sort()).toEqual([...new Set(expected)].sort());
  });

  it("groups the chips by category", () => {
    renderPlan(PORTFOLIO, "advanced");
    const toolkit = screen
      .getByRole("heading", { name: "Your toolkit at a glance" })
      .closest("section") as HTMLElement;

    const groups = within(toolkit).getAllByRole("group");
    const names = groups.map((group) => group.querySelector("p")?.textContent);
    expect(names).toContain("AI");
    expect(names).toContain("Build");
    expect(new Set(names).size).toBe(names.length);
  });

  it("scrolls to the card and focuses it when a chip is clicked", async () => {
    const user = userEvent.setup();
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    renderPlan();
    const first = planFor(PORTFOLIO, "simple").levels.simple.jobs[0]!;

    await user.click(
      screen.getByRole("button", { name: `Go to ${first.toolName}` }),
    );

    expect(scrollIntoView).toHaveBeenCalledOnce();
    expect(card(first.toolName)).toHaveFocus();
    Reflect.deleteProperty(Element.prototype, "scrollIntoView");
  });

  it("changes with the level", async () => {
    const user = userEvent.setup();
    renderPlan();
    const toolkit = () =>
      screen
        .getByRole("heading", { name: "Your toolkit at a glance" })
        .closest("section") as HTMLElement;
    const before = within(toolkit()).getAllByRole("button").length;

    await user.click(level("Advanced"));

    expect(within(toolkit()).getAllByRole("button").length).toBeGreaterThan(
      before,
    );
  });
});

describe("job cards", () => {
  it("shows kind, pricing, watch-out, fit, source and verification state", () => {
    renderPlan();
    const first = planFor(PORTFOLIO, "simple").levels.simple.jobs[0]!;
    const view = within(card(first.toolName));

    expect(view.getByText("AI tool")).toBeInTheDocument();
    expect(view.getByText("Pricing")).toBeInTheDocument();
    expect(view.getByText(/\[verify\]/)).toBeInTheDocument();
    expect(view.getByText("Watch out for")).toBeInTheDocument();
    expect(view.getByText(/of 5 \(editorial estimate/)).toBeInTheDocument();
    expect(view.getByText("Source: Sample data")).toBeInTheDocument();
    expect(view.getByText("Last verified: Not verified")).toBeInTheDocument();
    expect(view.getByText("New")).toBeInTheDocument();
  });

  it("labels libraries and services differently from AI tools", () => {
    renderPlan(PORTFOLIO, "advanced");

    const kindOf = (label: string) => screen.queryAllByText(label).length;
    expect(kindOf("AI tool")).toBeGreaterThan(0);
    expect(kindOf("Library")).toBeGreaterThan(0);
    expect(kindOf("Service")).toBeGreaterThan(0);
  });

  it("opens the official page safely in a new tab", () => {
    renderPlan();
    const first = planFor(PORTFOLIO, "simple").levels.simple.jobs[0]!;

    const link = within(card(first.toolName)).getByRole("link", {
      name: /Official page/,
    });
    expect(link).toHaveAttribute("href", first.officialUrl);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("explains the model to pick on AI tool cards", () => {
    renderPlan(PORTFOLIO, "polished");
    const assistant = planFor(PORTFOLIO, "polished").levels.polished.jobs.find(
      (job) => job.jobId === "ai-assistant",
    )!;
    const view = within(card(assistant.toolName));

    expect(view.getByText("Which model to pick")).toBeInTheDocument();
    expect(
      view.getByText(
        "For drafting copy: fast-and-cheap model, low effort. For planning the structure: deep-reasoning model, high effort.",
      ),
    ).toBeInTheDocument();
    expect(
      view.getByText(/check the tool's model picker/i),
    ).toBeInTheDocument();
    expect(view.getByText("What do these mean?")).toBeInTheDocument();
  });

  it("shows no model guidance on cards that are not AI tools", () => {
    renderPlan(PORTFOLIO, "polished");
    const framework = planFor(PORTFOLIO, "polished").levels.polished.jobs.find(
      (job) => job.jobId === "framework",
    )!;

    expect(
      within(card(framework.toolName)).queryByText("Which model to pick"),
    ).toBeNull();
  });

  it("states compatibility between build tools", () => {
    renderPlan(PORTFOLIO, "advanced");

    expect(screen.getAllByText("Works with").length).toBeGreaterThan(0);
  });

  it("labels the tags Keep, Better option and New", async () => {
    const user = userEvent.setup();
    renderPlan(STUDY, "simple");
    const assistant = planFor(STUDY, "simple").levels.simple.jobs[0]!;
    expect(
      within(card(assistant.toolName)).getByText("New"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: assistant.toolName }));

    expect(
      within(card(assistant.toolName)).getByText("Keep"),
    ).toBeInTheDocument();
  });
});

describe("other options", () => {
  function firstWithAlternatives(goal: UnderstoodGoal, lvl: Level) {
    return planFor(goal, lvl).levels[lvl].jobs.find(
      (job) => job.alternatives.length > 0,
    )!;
  }

  it("is collapsed by default on a narrow screen", async () => {
    const user = userEvent.setup();
    renderPlan();
    const job = firstWithAlternatives(PORTFOLIO, "simple");
    const view = within(card(job.toolName));
    const toggle = view.getByRole("button", { name: "See other options" });
    const panel = document.getElementById(
      toggle.getAttribute("aria-controls") ?? "",
    );

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(panel?.firstElementChild).toHaveAttribute("inert");

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(panel?.firstElementChild).not.toHaveAttribute("inert");
    const alternative = job.alternatives[0]!;
    expect(panel).toHaveTextContent(
      `Choose ${alternative.toolName} if ${alternative.chooseIf}.`,
    );

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("is open by default on a wide screen, so variety is visible", () => {
    const restore = useWideScreen();
    renderPlan();
    const job = firstWithAlternatives(PORTFOLIO, "simple");

    const toggle = within(card(job.toolName)).getByRole("button", {
      name: "See other options",
    });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    restore();
  });

  it("can still be closed on a wide screen", async () => {
    const restore = useWideScreen();
    const user = userEvent.setup();
    renderPlan();
    const job = firstWithAlternatives(PORTFOLIO, "simple");
    const toggle = within(card(job.toolName)).getByRole("button", {
      name: "See other options",
    });

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    restore();
  });

  it("offers up to two alternatives, each from a stated reason", () => {
    renderPlan(PORTFOLIO, "advanced");
    for (const job of planFor(PORTFOLIO, "advanced").levels.advanced.jobs) {
      expect(job.alternatives.length).toBeLessThanOrEqual(2);
      for (const alternative of job.alternatives) {
        expect(alternative.chooseIf).toMatch(/^you want /);
      }
    }
  });
});

describe("tiers, facts and lists", () => {
  it("omits the tier block, since no tier data is verified", () => {
    renderPlan(PORTFOLIO, "polished");
    expect(screen.queryByText(/plans for this goal/)).toBeNull();
  });

  it("shows the fact-check box only when the plan has one", () => {
    const { unmount } = renderPlan(PORTFOLIO, "simple");
    expect(
      screen.queryByRole("heading", { name: "Check the facts" }),
    ).toBeNull();
    unmount();

    renderPlan(STUDY, "simple");
    expect(
      screen.getByRole("heading", { name: "Check the facts" }),
    ).toBeInTheDocument();
  });

  it("shows when to upgrade and common mistakes", () => {
    renderPlan();

    expect(
      screen.getByRole("heading", { name: "When to upgrade" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Common mistakes" }),
    ).toBeInTheDocument();
  });
});

describe("workflow and starter brief", () => {
  const HONEST_PROMPT =
    "Make a 60-day plan. Tell me honestly if my goal is unrealistic. List the three biggest risks in this plan.";

  it("numbers the steps and gives example prompts a copy button", () => {
    renderPlan(STUDY, "simple");
    const heading = screen.getByRole("heading", { name: "Workflow" });
    const section = heading.closest("section") as HTMLElement;

    expect(within(section).getAllByRole("listitem")).toHaveLength(
      planFor(STUDY, "simple").levels.simple.workflow.length,
    );
    expect(within(section).getByText(HONEST_PROMPT)).toBeInTheDocument();
    expect(
      within(section).getAllByRole("button", { name: "Copy example prompt" })
        .length,
    ).toBeGreaterThan(0);
  });

  it("copies an example prompt to the clipboard", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    renderPlan(STUDY, "simple");
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    const prompt = screen.getByText(HONEST_PROMPT);
    const copy = within(prompt.parentElement as HTMLElement).getByRole(
      "button",
      { name: "Copy example prompt" },
    );

    await user.click(copy);

    expect(writeText).toHaveBeenCalledExactlyOnceWith(HONEST_PROMPT);
  });

  it("shows the starter brief read-only and copies it from both buttons", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    renderPlan();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    const brief = planFor(PORTFOLIO, "simple").levels.simple.starterBrief;

    const section = screen
      .getByRole("heading", { name: "Starter brief" })
      .closest("section") as HTMLElement;
    expect(section.querySelector("pre")?.textContent).toBe(brief);
    expect(section.querySelector("textarea, input")).toBeNull();

    const [inBlock, inActions] = screen.getAllByRole("button", {
      name: "Copy starter brief",
    });
    await user.click(inBlock as HTMLElement);
    await user.click(inActions as HTMLElement);

    expect(writeText).toHaveBeenCalledTimes(2);
    expect(writeText).toHaveBeenNthCalledWith(1, brief);
    expect(writeText).toHaveBeenNthCalledWith(2, brief);
  });

  it("explains when the clipboard cannot be used", async () => {
    const user = userEvent.setup();
    renderPlan();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
      configurable: true,
    });
    const [inBlock] = screen.getAllByRole("button", {
      name: "Copy starter brief",
    });

    await user.click(inBlock as HTMLElement);

    expect(
      await screen.findByText(/Couldn't copy automatically/),
    ).toBeVisible();
  });
});

describe("make this more accurate", () => {
  function usedGroup() {
    return screen.getByRole("group", {
      name: "Which of these do you already use?",
    });
  }

  it("offers the recommended tools and their alternatives", () => {
    renderPlan();
    const expected = new Set(
      planFor(PORTFOLIO, "simple").levels.simple.jobs.flatMap((job) => [
        job.toolName,
        ...job.alternatives.map((alt) => alt.toolName),
      ]),
    );

    const offered = within(usedGroup())
      .getAllByRole("button")
      .map((button) => button.textContent);

    expect(new Set(offered)).toEqual(expected);
  });

  it("marks a recommended tool as Keep when the person already uses it", async () => {
    const user = userEvent.setup();
    renderPlan(STUDY, "simple");
    const assistant = planFor(STUDY, "simple").levels.simple.jobs[0]!;
    expect(
      within(card(assistant.toolName)).getByText("New"),
    ).toBeInTheDocument();

    const used = within(usedGroup()).getByRole("button", {
      name: assistant.toolName,
    });
    await user.click(used);

    expect(used).toHaveAttribute("aria-pressed", "true");
    expect(
      within(card(assistant.toolName)).getByText("Keep"),
    ).toBeInTheDocument();

    await user.click(used);

    expect(
      within(card(assistant.toolName)).getByText("New"),
    ).toBeInTheDocument();
  });

  it("puts a tool the person uses into the plan in place of the pick", async () => {
    const user = userEvent.setup();
    renderPlan(STUDY, "simple");
    const assistant = planFor(STUDY, "simple").levels.simple.jobs[0]!;
    const alternative = assistant.alternatives[0]!;

    await user.click(
      within(usedGroup()).getByRole("button", { name: alternative.toolName }),
    );

    expect(card(alternative.toolName)).toBeInTheDocument();
    expect(
      within(card(alternative.toolName)).getByText("Keep"),
    ).toBeInTheDocument();
    expect(
      within(card(alternative.toolName)).getByText(/You already use it/),
    ).toBeInTheDocument();
  });

  it("keeps the same choices after the plan changes", async () => {
    const user = userEvent.setup();
    renderPlan(STUDY, "simple");
    const before = within(usedGroup())
      .getAllByRole("button")
      .map((button) => button.textContent);
    const assistant = planFor(STUDY, "simple").levels.simple.jobs[0]!;

    await user.click(
      within(usedGroup()).getByRole("button", {
        name: assistant.alternatives[0]!.toolName,
      }),
    );

    expect(
      within(usedGroup())
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual(before);
  });

  it("keeps the Keep tag when switching levels", async () => {
    const user = userEvent.setup();
    renderPlan(STUDY, "simple");
    const assistant = planFor(STUDY, "simple").levels.simple.jobs[0]!;
    await user.click(
      within(usedGroup()).getByRole("button", { name: assistant.toolName }),
    );
    await user.click(level("Polished"));
    await user.click(level("Simple"));

    expect(
      within(card(assistant.toolName)).getByText("Keep"),
    ).toBeInTheDocument();
  });

  it("offers four budget choices and none is required", () => {
    renderPlan();

    const choices = screen.getAllByRole("radio", { name: /₹|More/ });
    expect(
      choices.map((choice) => choice.closest("label")?.textContent),
    ).toEqual(["₹0", "Under ₹1,000", "₹1,000 to ₹3,000", "More"]);
    for (const choice of choices) expect(choice).not.toBeChecked();
  });

  it("filters the plan to free options at ₹0 and says so", async () => {
    const user = userEvent.setup();
    renderPlan(understand("make a video for youtube"), "advanced");
    expect(screen.queryByText(/Free options only/)).toBeNull();

    await user.click(screen.getByRole("radio", { name: "₹0" }));

    expect(
      screen.queryByRole("article", { name: "Adobe Premiere Pro" }),
    ).toBeNull();
    expect(
      screen.queryByRole("article", { name: "Adobe Photoshop" }),
    ).toBeNull();
    expect(screen.queryByText("Paid only")).toBeNull();
    expect(
      screen.getByText(/Showing only tools with a free option/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Free options only/)).toBeInTheDocument();
  });

  it("brings paid options back for other budgets", async () => {
    const user = userEvent.setup();
    renderPlan(understand("make a video for youtube"), "advanced");
    await user.click(screen.getByRole("radio", { name: "₹0" }));
    await user.click(screen.getByRole("radio", { name: "Under ₹1,000" }));

    expect(
      screen.queryByText(/Showing only tools with a free option/),
    ).toBeNull();
    expect(screen.queryByText(/Free options only/)).toBeNull();
  });
});

describe("pick-an-ai plans", () => {
  it("builds cards from the tasks that were understood", () => {
    renderPlan(understand("make a logo"), "simple");

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Your AI tool picks",
    );
    const headings = screen
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent);
    expect(headings.length).toBeGreaterThanOrEqual(2);
  });
});

describe("accessibility", () => {
  it.each(
    [
      "portfolio website with animations",
      "60-day study plan",
      "make a youtube video",
      "research ancient Indian stories",
      "build a todo app with login",
      "which ai should I use to summarise a pdf",
    ].flatMap((text) => LEVELS.map((lvl) => [text, lvl] as const)),
  )(
    "has no serious or critical axe violations: %s at %s",
    async (text, lvl) => {
      const { container } = renderPlan(understand(text), lvl);

      const violations = await seriousViolations(container);

      expect(
        violations.map((violation) => `${violation.id}: ${violation.help}`),
      ).toEqual([]);
    },
  );
});
