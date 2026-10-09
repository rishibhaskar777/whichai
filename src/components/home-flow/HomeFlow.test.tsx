import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/app-shell/AppShell";
import { catalogue } from "@/data/catalogue";
import { sampleNews } from "@/data/sample/news";
import { headingViolations, seriousViolations } from "@/test/axe";
import { HomeFlow } from "./HomeFlow";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

const PORTFOLIO_GOAL = "Build a portfolio website with a blog";
const UNKNOWN_GOAL = "What is the weather in Delhi today";

function renderHome() {
  return render(
    <AppShell
      news={sampleNews}
      initialTheme="system"
      viewer={null}
      providers={{ google: true, github: true }}
    >
      <HomeFlow />
    </AppShell>,
  );
}

function searchBox() {
  return screen.getByLabelText("What do you want to do with AI?");
}

async function submit(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.type(searchBox(), text);
  await user.keyboard("{Enter}");
}

async function confirm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Yes, show my plan" }));
}

async function expectSingleH1(container: HTMLElement, name: string) {
  const inDom = container.querySelectorAll("h1");
  expect(inDom).toHaveLength(1);
  expect(inDom[0]).toHaveTextContent(name);
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  expect(await headingViolations(container)).toEqual([]);
}

let fetchSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  fetchSpy = vi.spyOn(globalThis, "fetch");
});

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe("empty state", () => {
  it("shows the greeting, the search and the suggestions", () => {
    renderHome();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "What do you want to do with AI?",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "Suggestions" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Here's what we understood")).toBeNull();
  });
});

describe("understanding a goal", () => {
  it("collapses the greeting, clears the search and shows what was understood", async () => {
    const user = userEvent.setup();
    renderHome();
    const greeting = screen.getByRole("heading", { level: 1 });
    const intro = greeting.closest("[data-collapsed]");
    expect(intro).toHaveAttribute("data-collapsed", "false");

    await submit(user, PORTFOLIO_GOAL);

    expect(intro).toHaveAttribute("data-collapsed", "true");
    expect(searchBox()).toHaveValue("");
    expect(screen.getByText(PORTFOLIO_GOAL)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Here's what we understood" }),
    ).toBeInTheDocument();
    const chips = screen.getByRole("list", { name: "What we understood" });
    expect(within(chips).getByText("Portfolio website")).toBeInTheDocument();
    expect(within(chips).getByText("Blog")).toBeInTheDocument();
  });

  it("switches the search to its compact form", async () => {
    const user = userEvent.setup();
    renderHome();

    await submit(user, PORTFOLIO_GOAL);

    expect(screen.queryByRole("list", { name: "Suggestions" })).toBeNull();
    await user.click(document.body);
    expect(screen.getByText("Describe another goal")).toBeInTheDocument();
  });

  it("announces the result politely", async () => {
    const user = userEvent.setup();
    renderHome();

    await submit(user, PORTFOLIO_GOAL);

    expect(
      screen.getByText("Goal understood. Check the details and confirm."),
    ).toBeInTheDocument();
  });

  it("puts the text back into the search when Edit is pressed", async () => {
    const user = userEvent.setup();
    renderHome();
    await submit(user, PORTFOLIO_GOAL);

    await user.click(screen.getByRole("button", { name: "Edit" }));

    expect(searchBox()).toHaveValue(PORTFOLIO_GOAL);
    expect(searchBox()).toHaveFocus();
    expect(screen.queryByText("Here's what we understood")).toBeNull();
  });

  it("lets the edited goal be submitted again", async () => {
    const user = userEvent.setup();
    renderHome();
    await submit(user, PORTFOLIO_GOAL);
    await user.click(screen.getByRole("button", { name: "Edit" }));

    await user.type(searchBox(), " with animation");
    await user.keyboard("{Enter}");

    const chips = screen.getByRole("list", { name: "What we understood" });
    expect(within(chips).getByText("Animation")).toBeInTheDocument();
  });

  it("has no serious or critical axe violations", async () => {
    const user = userEvent.setup();
    const { container } = renderHome();
    await submit(user, PORTFOLIO_GOAL);

    expect(await seriousViolations(container)).toEqual([]);
  });
});

describe("a goal we do not cover", () => {
  it("says so honestly and offers the covered goals", async () => {
    const user = userEvent.setup();
    renderHome();

    await submit(user, UNKNOWN_GOAL);

    expect(
      screen.getByRole("heading", {
        name: "We don't have a plan for this goal yet",
      }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("list", { name: "Goals we cover" })).getAllByRole(
        "button",
      ),
    ).toHaveLength(catalogue.goals.length);
    expect(screen.queryByRole("heading", { name: /plan$/ })).toBeNull();
  });

  it("moves on to the understanding card when a covered goal is tapped", async () => {
    const user = userEvent.setup();
    renderHome();
    await submit(user, UNKNOWN_GOAL);

    await user.click(screen.getByRole("button", { name: "Study plan" }));

    const chips = screen.getByRole("list", { name: "What we understood" });
    expect(within(chips).getByText("Study plan")).toBeInTheDocument();
  });

  it("has no serious or critical axe violations", async () => {
    const user = userEvent.setup();
    const { container } = renderHome();
    await submit(user, UNKNOWN_GOAL);

    expect(await seriousViolations(container)).toEqual([]);
  });
});

describe("showing the plan", () => {
  it("shows the plan, announces it and focuses the headline", async () => {
    const user = userEvent.setup();
    renderHome();
    await submit(user, PORTFOLIO_GOAL);

    await confirm(user);

    const headline = screen.getByRole("heading", {
      name: "Your portfolio website plan",
    });
    expect(headline).toHaveFocus();
    expect(screen.getByText("Plan ready")).toBeInTheDocument();
    expect(screen.getByText(/Sample data, not verified:/)).toBeInTheDocument();
    expect(screen.queryByText("Here's what we understood")).toBeNull();
  });

  it("starts at the level inferred from the skills mentioned", async () => {
    const user = userEvent.setup();
    renderHome();
    await submit(user, "Portfolio website in React");

    await confirm(user);

    expect(screen.getByRole("radio", { name: "Advanced" })).toBeChecked();
  });

  it("recomputes the level when a skill chip is removed", async () => {
    const user = userEvent.setup();
    renderHome();
    await submit(user, "Portfolio website in React");
    await user.click(screen.getByRole("button", { name: "Remove React" }));

    await confirm(user);

    expect(screen.getByRole("radio", { name: "Simple" })).toBeChecked();
  });

  it("shows the study plan for a study goal", async () => {
    const user = userEvent.setup();
    renderHome();
    await submit(user, "Make a study plan for my exams");

    await confirm(user);

    expect(
      screen.getByRole("heading", { name: "Your 60-day study plan" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Check the facts" }),
    ).toBeInTheDocument();
  });

  it("replaces the plan when another goal is submitted from the compact search", async () => {
    const user = userEvent.setup();
    renderHome();
    await submit(user, PORTFOLIO_GOAL);
    await confirm(user);

    await submit(user, "Study for my exams");

    expect(
      screen.queryByRole("heading", { name: "Your portfolio website plan" }),
    ).toBeNull();
    expect(
      screen.getByRole("heading", { name: "Here's what we understood" }),
    ).toBeInTheDocument();
  });

  it("has no serious or critical axe violations", async () => {
    const user = userEvent.setup();
    const { container } = renderHome();
    await submit(user, PORTFOLIO_GOAL);
    await confirm(user);

    expect(await seriousViolations(container)).toEqual([]);
  });
});

describe("New plan", () => {
  it("resets to the empty home state and focuses the search", async () => {
    const user = userEvent.setup();
    renderHome();
    await submit(user, PORTFOLIO_GOAL);
    await confirm(user);
    await user.type(searchBox(), "something half typed");

    const [newPlan] = screen.getAllByRole("link", { name: "New plan" });
    await user.click(newPlan as HTMLElement);

    expect(
      screen.queryByRole("heading", { name: "Your portfolio website plan" }),
    ).toBeNull();
    expect(searchBox()).toHaveValue("");
    expect(searchBox()).toHaveFocus();
    expect(
      screen.getByRole("list", { name: "Suggestions" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1 }).closest("[data-collapsed]"),
    ).toHaveAttribute("data-collapsed", "false");
  });

  it("works again after a second goal", async () => {
    const user = userEvent.setup();
    renderHome();
    const [newPlan] = screen.getAllByRole("link", { name: "New plan" });

    await submit(user, PORTFOLIO_GOAL);
    await user.click(newPlan as HTMLElement);
    await submit(user, "Study for exams");
    await user.click(newPlan as HTMLElement);

    expect(screen.queryByText("Here's what we understood")).toBeNull();
    expect(searchBox()).toHaveFocus();
  });
});

describe("privacy", () => {
  it("makes no network request during the whole flow", async () => {
    const user = userEvent.setup();
    renderHome();

    await submit(user, PORTFOLIO_GOAL);
    await user.click(screen.getByRole("button", { name: "Add Animation" }));
    await confirm(user);
    await user.click(screen.getByRole("radio", { name: "Advanced" }));
    await user.click(screen.getByRole("radio", { name: "₹0" }));
    await user.click(
      within(
        screen.getByRole("group", {
          name: "Which of these do you already use?",
        }),
      ).getAllByRole("button")[0]!,
    );
    await user.click(screen.getAllByRole("link", { name: "New plan" })[0]!);
    await submit(user, UNKNOWN_GOAL);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("keeps the goal text out of storage, cookies and the URL", async () => {
    const user = userEvent.setup();
    const cookiesBefore = document.cookie;
    const urlBefore = window.location.href;
    renderHome();

    await submit(user, PORTFOLIO_GOAL);
    await confirm(user);

    expect(window.localStorage).toHaveLength(0);
    expect(window.sessionStorage).toHaveLength(0);
    expect(document.cookie).toBe(cookiesBefore);
    expect(window.location.href).toBe(urlBefore);
  });

  it("does not write the goal text to the console", async () => {
    const methods = ["log", "info", "warn", "error", "debug"] as const;
    const spies = methods.map((method) =>
      vi.spyOn(console, method).mockImplementation(() => {}),
    );
    const user = userEvent.setup();
    renderHome();

    await submit(user, PORTFOLIO_GOAL);
    await confirm(user);

    for (const spy of spies) {
      for (const call of spy.mock.calls) {
        expect(JSON.stringify(call)).not.toContain(PORTFOLIO_GOAL);
      }
    }
  });
});

describe("heading structure", () => {
  it("has exactly one h1 in the empty home state", async () => {
    const { container } = renderHome();
    await expectSingleH1(container, "What do you want to do with AI?");
  });

  it("makes the understanding card title the h1", async () => {
    const user = userEvent.setup();
    const { container } = renderHome();
    await submit(user, PORTFOLIO_GOAL);

    await expectSingleH1(container, "Here's what we understood");
  });

  it("makes the no-match title the h1", async () => {
    const user = userEvent.setup();
    const { container } = renderHome();
    await submit(user, UNKNOWN_GOAL);

    await expectSingleH1(container, "We don't have a plan for this goal yet");
  });

  it("makes the plan headline the h1 at every level", async () => {
    const user = userEvent.setup();
    const { container } = renderHome();
    await submit(user, PORTFOLIO_GOAL);
    await confirm(user);

    await expectSingleH1(container, "Your portfolio website plan");
    await user.click(screen.getByRole("radio", { name: "Advanced" }));
    await expectSingleH1(container, "Your portfolio website plan");
  });

  it("keeps one h1 while the goal is being edited", async () => {
    const user = userEvent.setup();
    const { container } = renderHome();
    await submit(user, PORTFOLIO_GOAL);
    await user.click(screen.getByRole("button", { name: "Edit" }));

    await expectSingleH1(container, "Edit your goal");
  });

  it("returns to the greeting h1 after New plan", async () => {
    const user = userEvent.setup();
    const { container } = renderHome();
    await submit(user, PORTFOLIO_GOAL);
    await user.click(screen.getAllByRole("link", { name: "New plan" })[0]!);

    await expectSingleH1(container, "What do you want to do with AI?");
  });
});
