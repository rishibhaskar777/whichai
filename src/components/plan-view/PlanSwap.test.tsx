import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { catalogue } from "@/data/catalogue";
import { buildPlan } from "@/lib/engine/build-plan";
import { interpretGoal } from "@/lib/plan/interpret-goal";
import { GOAL_IDS } from "@/lib/schemas/catalogue";
import type { Level, UnderstoodGoal } from "@/lib/schemas/plan";
import { goalChip } from "@/lib/plan/chips";
import { decodePlanRequest } from "@/lib/share/share-link";
import { createMemoryBackend } from "@/lib/storage/backend";
import { createStore } from "@/lib/storage/store";
import { seriousViolations } from "@/test/axe";
import { AppProviders } from "@/test/wrappers";
import type { PlanRequest } from "@/lib/schemas/plan-request";
import { PlanView } from "./PlanView";

vi.mock("next/navigation", async () =>
  (await import("@/test/navigation")).navigationMock("/"),
);

const GOAL = interpretGoal("portfolio website with animations")!;

function renderPlan(
  props: {
    goal?: UnderstoodGoal;
    level?: Level;
    chosen?: Record<string, string>;
    onRequestChange?: (request: PlanRequest) => void;
    backend?: ReturnType<typeof createMemoryBackend>;
  } = {},
) {
  return render(
    <AppProviders {...(props.backend ? { backend: props.backend } : {})}>
      <PlanView
        goal={props.goal ?? GOAL}
        initialLevel={props.level ?? "polished"}
        initialChosenTools={props.chosen}
        onRequestChange={props.onRequestChange}
      />
    </AppProviders>,
  );
}

function firstSwappable(level: Level = "polished") {
  const job = buildPlan(GOAL, {
    level,
    budget: null,
    toolsUsed: new Set(),
  }).levels[level].jobs.find((candidate) => candidate.alternatives.length > 0);
  if (!job) throw new Error("no swappable job");
  return job;
}

function card(toolName: string) {
  return screen.getByRole("article", { name: toolName });
}

afterEach(() => {
  Reflect.deleteProperty(navigator, "clipboard");
});

describe("clickable alternatives", () => {
  it("shows every alternative as a button, not as plain text", () => {
    const job = firstSwappable();
    renderPlan();

    const view = within(card(job.toolName));
    for (const alternative of job.alternatives) {
      const button = view.getByRole("button", {
        name: new RegExp(`Choose ${alternative.toolName} if`),
      });
      expect(button).toBeEnabled();
    }
  });

  it("swaps the alternative into the card with its full details", async () => {
    const user = userEvent.setup();
    const job = firstSwappable();
    const alternative = job.alternatives[0]!;
    const tool = catalogue.tools.find((t) => t.id === alternative.toolId)!;
    renderPlan();

    await user.click(
      within(card(job.toolName)).getByRole("button", {
        name: new RegExp(`Choose ${alternative.toolName} if`),
      }),
    );

    expect(
      screen.queryByRole("article", { name: job.toolName }),
    ).not.toBeInTheDocument();
    const view = within(card(alternative.toolName));
    expect(view.getByText(new RegExp(tool.summary.slice(0, 40)))).toBeVisible();
    expect(view.getByText("Free option")).toBeInTheDocument();
    expect(view.getByText("Pricing")).toBeInTheDocument();
    expect(view.getByText("Watch out for")).toBeInTheDocument();
    expect(view.getByText(/of 5 \(editorial estimate/)).toBeInTheDocument();
    expect(view.getByRole("link", { name: /Official page/ })).toHaveAttribute(
      "href",
      tool.officialUrl,
    );
    expect(
      view.getByRole("link", { name: /View full details/ }),
    ).toHaveAttribute("href", `/tools/${tool.id}`);
  });

  it("moves the previous pick into the alternatives list", async () => {
    const user = userEvent.setup();
    const job = firstSwappable();
    const alternative = job.alternatives[0]!;
    renderPlan();

    await user.click(
      within(card(job.toolName)).getByRole("button", {
        name: new RegExp(`Choose ${alternative.toolName} if`),
      }),
    );

    const view = within(card(alternative.toolName));
    expect(
      view.getByRole("button", {
        name: new RegExp(`Choose ${job.toolName} if`),
      }),
    ).toBeInTheDocument();
    expect(
      view.queryByRole("button", {
        name: new RegExp(`Choose ${alternative.toolName} if`),
      }),
    ).toBeNull();
  });

  it("offers a Switch back link that restores the original", async () => {
    const user = userEvent.setup();
    const job = firstSwappable();
    const alternative = job.alternatives[0]!;
    renderPlan();
    expect(
      within(card(job.toolName)).queryByRole("button", {
        name: /Switch back/,
      }),
    ).toBeNull();

    await user.click(
      within(card(job.toolName)).getByRole("button", {
        name: new RegExp(`Choose ${alternative.toolName} if`),
      }),
    );
    await user.click(
      within(card(alternative.toolName)).getByRole("button", {
        name: `Switch back to ${job.toolName}`,
      }),
    );

    const restored = within(card(job.toolName));
    expect(restored.queryByRole("button", { name: /Switch back/ })).toBeNull();
    expect(
      restored.getByRole("button", {
        name: new RegExp(`Choose ${alternative.toolName} if`),
      }),
    ).toBeInTheDocument();
  });

  it("updates the toolkit at a glance", async () => {
    const user = userEvent.setup();
    const job = firstSwappable();
    const alternative = job.alternatives[0]!;
    renderPlan();
    const toolkit = screen.getByRole("region", {
      name: "Your toolkit at a glance",
    });
    expect(
      within(toolkit).getByRole("button", { name: `Go to ${job.toolName}` }),
    ).toBeInTheDocument();

    await user.click(
      within(card(job.toolName)).getByRole("button", {
        name: new RegExp(`Choose ${alternative.toolName} if`),
      }),
    );

    expect(
      within(toolkit).getByRole("button", {
        name: `Go to ${alternative.toolName}`,
      }),
    ).toBeInTheDocument();
    expect(
      within(toolkit).queryByRole("button", { name: `Go to ${job.toolName}` }),
    ).toBeNull();
  });

  it("updates the starter brief", async () => {
    const user = userEvent.setup();
    const job = firstSwappable();
    const alternative = job.alternatives[0]!;
    renderPlan();
    const brief = () =>
      screen
        .getAllByText(/Tools I plan to use:/)
        .map((node) => node.textContent ?? "")
        .join("\n");
    expect(brief()).toContain(job.toolName);

    await user.click(
      within(card(job.toolName)).getByRole("button", {
        name: new RegExp(`Choose ${alternative.toolName} if`),
      }),
    );

    expect(brief()).toContain(alternative.toolName);
    expect(brief()).not.toContain(job.toolName);
  });

  it("announces the swap and moves focus to the new tool's name", async () => {
    const user = userEvent.setup();
    const job = firstSwappable();
    const alternative = job.alternatives[0]!;
    renderPlan();

    await user.click(
      within(card(job.toolName)).getByRole("button", {
        name: new RegExp(`Choose ${alternative.toolName} if`),
      }),
    );

    expect(
      screen.getByText(
        `Now showing ${alternative.toolName} for ${job.jobName}.`,
      ),
    ).toHaveAttribute("role", "status");
    await waitFor(() =>
      expect(
        within(card(alternative.toolName)).getByRole("heading", {
          level: 3,
          name: new RegExp(`^Use ${alternative.toolName} to `),
        }),
      ).toHaveFocus(),
    );
  });

  it("works from the keyboard", async () => {
    const user = userEvent.setup();
    const job = firstSwappable();
    const alternative = job.alternatives[0]!;
    renderPlan();

    within(card(job.toolName))
      .getByRole("button", {
        name: new RegExp(`Choose ${alternative.toolName} if`),
      })
      .focus();
    await user.keyboard("{Enter}");

    expect(card(alternative.toolName)).toBeInTheDocument();
  });

  it("starts from the tools stored in the request", () => {
    const job = firstSwappable();
    const alternative = job.alternatives[0]!;
    renderPlan({ chosen: { [job.jobId]: alternative.toolId } });

    expect(card(alternative.toolName)).toBeInTheDocument();
    expect(
      screen.queryByRole("article", { name: job.toolName }),
    ).not.toBeInTheDocument();
  });

  it("keeps the choice when the level changes", async () => {
    const user = userEvent.setup();
    const job = firstSwappable("simple");
    const alternative = job.alternatives[0]!;
    renderPlan({ level: "simple" });

    await user.click(
      within(card(job.toolName)).getByRole("button", {
        name: new RegExp(`Choose ${alternative.toolName} if`),
      }),
    );
    await user.click(screen.getByRole("radio", { name: "Polished" }));
    await user.click(screen.getByRole("radio", { name: "Simple" }));

    expect(card(alternative.toolName)).toBeInTheDocument();
  });

  it("reports the choice so the address and saved plans can follow", async () => {
    const user = userEvent.setup();
    const job = firstSwappable();
    const alternative = job.alternatives[0]!;
    const onRequestChange = vi.fn();
    renderPlan({ onRequestChange });
    expect(onRequestChange).not.toHaveBeenCalled();

    await user.click(
      within(card(job.toolName)).getByRole("button", {
        name: new RegExp(`Choose ${alternative.toolName} if`),
      }),
    );

    expect(onRequestChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        chosenTools: { [job.jobId]: alternative.toolId },
      }),
    );

    await user.click(
      within(card(alternative.toolName)).getByRole("button", {
        name: `Switch back to ${job.toolName}`,
      }),
    );
    expect(onRequestChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ chosenTools: {} }),
    );
  });

  it("stores the chosen tool in the saved plan request", async () => {
    const user = userEvent.setup();
    const job = firstSwappable();
    const alternative = job.alternatives[0]!;
    const backend = createMemoryBackend();
    renderPlan({ backend });

    await user.click(
      within(card(job.toolName)).getByRole("button", {
        name: new RegExp(`Choose ${alternative.toolName} if`),
      }),
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    await screen.findByText("Saved to Projects");
    const [plan] = (await createStore(backend).load()).plans;
    expect(plan?.planRequest.chosenTools).toEqual({
      [job.jobId]: alternative.toolId,
    });
  });

  it("puts the chosen tool in the share link", async () => {
    const user = userEvent.setup();
    const job = firstSwappable();
    const alternative = job.alternatives[0]!;
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    renderPlan();

    await user.click(
      within(card(job.toolName)).getByRole("button", {
        name: new RegExp(`Choose ${alternative.toolName} if`),
      }),
    );
    await user.click(screen.getByRole("button", { name: "Copy share link" }));

    const url = new URL(writeText.mock.calls[0]![0] as string);
    const decoded = decodePlanRequest(url.hash);
    expect(decoded.ok && decoded.request.chosenTools).toEqual({
      [job.jobId]: alternative.toolId,
    });
  });

  it("has no serious accessibility problems after a swap", async () => {
    const user = userEvent.setup();
    const job = firstSwappable();
    const alternative = job.alternatives[0]!;
    const { container } = renderPlan();

    await user.click(
      within(card(job.toolName)).getByRole("button", {
        name: new RegExp(`Choose ${alternative.toolName} if`),
      }),
    );

    expect(await seriousViolations(container)).toEqual([]);
  });
});

describe("the plan page text", () => {
  it("has no quiet notice at the top and one data note at the bottom", () => {
    renderPlan();
    const article = screen.getByRole("article", { name: /plan/i });

    expect(within(article).queryByText(/Sample data/)).toBeNull();
    const note = screen.getByText(/Tool details come from official sites\./);
    expect(note).toHaveTextContent(
      "Tool details come from official sites. Fit scores are our own estimates. How we check data",
    );
    expect(
      within(note).getByRole("link", { name: "How we check data" }),
    ).toHaveAttribute("href", "/about#data");
    expect(article.lastElementChild).toBe(note);
  });

  it.each(GOAL_IDS)("never shows a placeholder: %s", (goalId) => {
    const template = catalogue.goals.find((g) => g.id === goalId)!;
    const goal: UnderstoodGoal = {
      goalType: goalId,
      title: template.title,
      chips: [goalChip(goalId, template.title)],
      inferredLevel: "simple",
    };
    const { container, unmount } = renderPlan({ goal, level: "advanced" });

    expect(container.textContent).not.toContain("[verify]");
    expect(container.textContent).not.toMatch(/not verified/i);
    expect(container.textContent).not.toMatch(/sample data/i);
    unmount();
  });

  it("links every card to its tool page and shows only official addresses", () => {
    renderPlan();
    const plan = buildPlan(GOAL, {
      level: "polished",
      budget: null,
      toolsUsed: new Set(),
    });

    for (const job of plan.levels.polished.jobs) {
      const tool = catalogue.tools.find((t) => t.id === job.toolId)!;
      const allowed = new Set<string>([
        tool.officialUrl,
        tool.pricingUrl ?? tool.officialUrl,
        ...Object.values(tool.getIt ?? {}).flatMap((entry) =>
          entry && typeof entry !== "string" && entry.linkCheckedOn
            ? [entry.url]
            : [],
        ),
      ]);
      const external = within(card(job.toolName))
        .getAllByRole("link")
        .filter((link) => link.getAttribute("href")?.startsWith("https://"))
        .map((link) => link.getAttribute("href")!);
      for (const href of external) expect(allowed.has(href)).toBe(true);
    }
  });
});
