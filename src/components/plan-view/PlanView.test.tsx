import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getSamplePlan, samplePlans } from "@/data/sample/plans";
import { LEVELS, type Level } from "@/lib/schemas/plan";
import { seriousViolations } from "@/test/axe";
import { PlanView } from "./PlanView";

const portfolio = getSamplePlan("portfolio-website");
const study = getSamplePlan("study-plan");

function renderPlan(plan = portfolio, level: Level = "simple") {
  return render(<PlanView plan={plan} initialLevel={level} />);
}

function card(toolName: string) {
  return screen.getByRole("article", { name: toolName });
}

function level(name: string) {
  return screen.getByRole("radio", { name });
}

afterEach(() => {
  Reflect.deleteProperty(navigator, "clipboard");
});

describe("PlanView basics", () => {
  it("opens with the sample notice, then the headline", () => {
    renderPlan();

    expect(
      screen.getByText(/tools, prices and dates are examples and not verified/),
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

    expect(
      screen.getByText(portfolio.levels.simple.summary),
    ).toBeInTheDocument();
    expect(screen.getByText("Estimated cost")).toBeInTheDocument();
    expect(screen.getByText("Estimated time")).toBeInTheDocument();
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
    renderPlan(portfolio, "polished");

    expect(
      screen.getByRole("radiogroup", { name: "Plan level" }),
    ).toBeInTheDocument();
    expect(level("Polished")).toBeChecked();
    expect(level("Simple")).not.toBeChecked();
    expect(
      screen.getByText(portfolio.levels.polished.summary),
    ).toBeInTheDocument();
  });

  it("changes the content when a level is clicked", async () => {
    const user = userEvent.setup();
    renderPlan();
    expect(screen.queryByRole("article", { name: "Sanity" })).toBeNull();

    await user.click(level("Advanced"));

    expect(level("Advanced")).toBeChecked();
    expect(card("Sanity")).toBeInTheDocument();
    expect(screen.queryByRole("article", { name: "Netlify" })).toBeNull();
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

describe("job cards", () => {
  it("shows pricing, watch-out, source and verification state", () => {
    renderPlan();
    const chatgpt = within(card("ChatGPT"));

    expect(chatgpt.getByText("Pricing")).toBeInTheDocument();
    expect(chatgpt.getByText(/₹\[verify\]/)).toBeInTheDocument();
    expect(chatgpt.getByText("Watch out for")).toBeInTheDocument();
    expect(chatgpt.getByText("Source: Sample data")).toBeInTheDocument();
    expect(
      chatgpt.getByText("Last verified: Not verified"),
    ).toBeInTheDocument();
    expect(chatgpt.getByText("New")).toBeInTheDocument();
  });

  it("opens the official page safely in a new tab", () => {
    renderPlan();

    const link = within(card("ChatGPT")).getByRole("link", {
      name: /Official page/,
    });
    expect(link).toHaveAttribute("href", "https://chatgpt.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("labels the tags Keep, Better option and New", async () => {
    const user = userEvent.setup();
    renderPlan();
    await user.click(level("Advanced"));

    expect(within(card("Next.js")).getByText("Keep")).toBeInTheDocument();
    expect(
      within(card("Cursor")).getByText("Better option"),
    ).toBeInTheDocument();
    expect(within(card("Sanity")).getByText("New")).toBeInTheDocument();
  });

  it("hides other options until the disclosure is opened", async () => {
    const user = userEvent.setup();
    renderPlan();
    const chatgpt = within(card("ChatGPT"));
    const toggle = chatgpt.getByRole("button", { name: "See other options" });
    const panel = document.getElementById(
      toggle.getAttribute("aria-controls") ?? "",
    );

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(panel?.firstElementChild).toHaveAttribute("inert");

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(panel?.firstElementChild).not.toHaveAttribute("inert");
    expect(panel).toHaveTextContent(
      "Choose Claude if you prefer a calmer writing style.",
    );

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("omits the disclosure for a tool with no alternatives", async () => {
    const user = userEvent.setup();
    renderPlan();
    await user.click(level("Advanced"));

    expect(
      within(card("Next.js")).queryByRole("button", {
        name: "See other options",
      }),
    ).toBeNull();
  });
});

describe("tiers, facts and lists", () => {
  it("shows three tier columns and the upgrade line when tiers exist", () => {
    renderPlan(portfolio, "polished");

    const heading = screen.getByRole("heading", {
      name: "Claude plans for this goal",
    });
    const section = heading.closest("section") as HTMLElement;
    expect(within(section).getAllByRole("listitem")).toHaveLength(3);
    expect(
      within(section).getByRole("heading", { name: "Free" }),
    ).toBeInTheDocument();
    expect(section).toHaveTextContent(
      "Start free. Upgrade only if you run out of free messages",
    );
  });

  it("omits the tier block when the level has none", () => {
    renderPlan(portfolio, "simple");
    expect(screen.queryByText(/plans for this goal/)).toBeNull();
  });

  it("shows the fact-check box only when the plan has one", () => {
    const { unmount } = renderPlan(portfolio, "simple");
    expect(
      screen.queryByRole("heading", { name: "Check the facts" }),
    ).toBeNull();
    unmount();

    renderPlan(study, "simple");
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
  it("numbers the steps and gives example prompts a copy button", () => {
    renderPlan(study, "simple");
    const heading = screen.getByRole("heading", { name: "Workflow" });
    const section = heading.closest("section") as HTMLElement;

    expect(within(section).getAllByRole("listitem")).toHaveLength(
      study.levels.simple.workflow.length,
    );
    expect(
      within(section).getByText(
        "Make a 60-day plan. Tell me honestly if my goal is unrealistic. List the three biggest risks in this plan.",
      ),
    ).toBeInTheDocument();
    expect(
      within(section).getByRole("button", { name: "Copy example prompt" }),
    ).toBeInTheDocument();
  });

  it("copies an example prompt to the clipboard", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    renderPlan(study, "simple");
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    await user.click(
      screen.getByRole("button", { name: "Copy example prompt" }),
    );

    expect(writeText).toHaveBeenCalledExactlyOnceWith(
      "Make a 60-day plan. Tell me honestly if my goal is unrealistic. List the three biggest risks in this plan.",
    );
  });

  it("shows the starter brief read-only and copies it from both buttons", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    renderPlan();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    const brief = portfolio.levels.simple.starterBrief;

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
  it("offers the tools of the current level", () => {
    renderPlan();
    const group = screen.getByRole("group", {
      name: "Which of these do you already use?",
    });

    expect(
      within(group)
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual(["ChatGPT", "Astro themes", "Netlify"]);
  });

  it("marks a recommended tool as Keep when the person already uses it", async () => {
    const user = userEvent.setup();
    renderPlan();
    expect(within(card("Netlify")).getByText("New")).toBeInTheDocument();

    const used = screen.getByRole("button", { name: "Netlify" });
    await user.click(used);

    expect(used).toHaveAttribute("aria-pressed", "true");
    expect(within(card("Netlify")).getByText("Keep")).toBeInTheDocument();
    expect(within(card("ChatGPT")).getByText("New")).toBeInTheDocument();

    await user.click(used);

    expect(within(card("Netlify")).getByText("New")).toBeInTheDocument();
  });

  it("keeps the Keep tag when switching levels", async () => {
    const user = userEvent.setup();
    renderPlan();
    await user.click(level("Advanced"));
    await user.click(screen.getByRole("button", { name: "Sanity" }));
    await user.click(level("Polished"));
    await user.click(level("Advanced"));

    expect(within(card("Sanity")).getByText("Keep")).toBeInTheDocument();
  });

  it("offers four budget choices and none is required", () => {
    renderPlan();

    const choices = screen.getAllByRole("radio", { name: /₹|More/ });
    expect(
      choices.map((choice) => choice.closest("label")?.textContent),
    ).toEqual(["₹0", "Under ₹1,000", "₹1,000 to ₹3,000", "More"]);
    for (const choice of choices) expect(choice).not.toBeChecked();
  });

  it("hides paid-only alternatives and adds a note at ₹0", async () => {
    const user = userEvent.setup();
    renderPlan();
    const toggleFor = (tool: string) =>
      within(card(tool)).getByRole("button", { name: "See other options" });
    await user.click(toggleFor("Astro themes"));
    expect(card("Astro themes")).toHaveTextContent("Framer templates");

    await user.click(screen.getByRole("radio", { name: "₹0" }));

    expect(card("Astro themes")).not.toHaveTextContent("Framer templates");
    expect(card("Astro themes")).toHaveTextContent("Carrd");
    expect(
      screen.getByText(/Showing only free alternatives/),
    ).toBeInTheDocument();
  });

  it("shows paid alternatives again for other budgets", async () => {
    const user = userEvent.setup();
    renderPlan();
    await user.click(screen.getByRole("radio", { name: "₹0" }));
    await user.click(screen.getByRole("radio", { name: "Under ₹1,000" }));

    expect(card("Astro themes")).toHaveTextContent("Framer templates");
    expect(screen.queryByText(/Showing only free alternatives/)).toBeNull();
  });

  it("drops the disclosure when every alternative is paid at ₹0", async () => {
    const user = userEvent.setup();
    renderPlan(study, "advanced");
    expect(
      within(card("NotebookLM")).getByRole("button", {
        name: "See other options",
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "₹0" }));

    expect(
      within(card("NotebookLM")).queryByRole("button", {
        name: "See other options",
      }),
    ).toBeNull();
  });
});

describe("accessibility", () => {
  it.each(
    samplePlans.flatMap((plan) => LEVELS.map((lvl) => [plan.id, lvl] as const)),
  )("has no serious or critical axe violations: %s at %s", async (id, lvl) => {
    const plan = samplePlans.find((candidate) => candidate.id === id);
    if (!plan) throw new Error(`Unknown plan ${id}`);
    const { container } = renderPlan(plan, lvl);

    const violations = await seriousViolations(container);

    expect(
      violations.map((violation) => `${violation.id}: ${violation.help}`),
    ).toEqual([]);
  });
});
