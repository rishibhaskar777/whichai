import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useNewPlanSignal } from "@/lib/new-plan-signal";
import { decodePlanRequest } from "@/lib/share/share-link";
import { AppProviders } from "@/test/wrappers";
import { HomeFlow } from "./HomeFlow";

vi.mock("next/navigation", async () =>
  (await import("@/test/navigation")).navigationMock("/"),
);

vi.setConfig({ testTimeout: 30_000 });

const LOAD_TIMEOUT = 15_000;
const GOAL = "Build a portfolio website with a blog";

function NewPlanButton() {
  const { request } = useNewPlanSignal();
  return (
    <button type="button" onClick={request}>
      Start a new plan
    </button>
  );
}

function Page() {
  return (
    <AppProviders>
      <HomeFlow />
      <NewPlanButton />
    </AppProviders>
  );
}

type User = ReturnType<typeof userEvent.setup>;

function searchBox() {
  return screen.getByLabelText("What do you want to do with AI?");
}

async function submit(user: User, text = GOAL) {
  await user.type(searchBox(), text);
  await user.keyboard("{Enter}");
  await screen.findByText("Here's what we understood", undefined, {
    timeout: LOAD_TIMEOUT,
  });
}

async function confirm(user: User) {
  await user.click(
    await screen.findByRole("button", { name: "Yes, show my plan" }),
  );
  await screen.findByRole(
    "radio",
    { name: "Simple" },
    { timeout: LOAD_TIMEOUT },
  );
}

async function go(direction: "back" | "forward") {
  await act(async () => {
    if (direction === "back") window.history.back();
    else window.history.forward();
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
}

function requestInAddress() {
  const decoded = decodePlanRequest(
    window.location.hash.replace("#understanding.", "#"),
  );
  if (!decoded.ok) throw new Error("the address does not hold a request");
  return decoded.request;
}

async function addChip(user: User, name: string) {
  await user.click(screen.getByRole("button", { name: `Add ${name}` }));
  await screen.findByRole("button", { name: `Remove ${name}` });
}

function chipLabels() {
  return screen
    .getAllByRole("button", { name: /^Remove / })
    .map((button) => button.getAttribute("aria-label"));
}

beforeEach(() => {
  // A fresh entry drops any forward entries an earlier test left behind, so
  // history.length counts only what the test itself pushes.
  window.history.pushState(null, "", "/");
});

describe("history entries", () => {
  it("pushes one entry for the understanding card and one for the plan", async () => {
    const user = userEvent.setup();
    render(<Page />);
    const start = window.history.length;
    expect(window.location.hash).toBe("");

    await submit(user);
    expect(window.history.length).toBe(start + 1);
    expect(window.location.hash).toMatch(/^#understanding\.[A-Za-z0-9_-]+$/);

    await confirm(user);
    expect(window.history.length).toBe(start + 2);
    expect(window.location.hash).toMatch(/^#[A-Za-z0-9_-]+$/);
    expect(window.location.hash).not.toContain("understanding");
  });

  it("holds the request in the share-link format and never the goal text", async () => {
    const user = userEvent.setup();
    render(<Page />);
    await submit(user);
    await confirm(user);

    const request = requestInAddress();
    expect(request.goal.goalType).toBe("portfolio-website");
    expect(request.level).toBe("simple");
    expect(request.chosenTools).toEqual({});
    const address = decodeURIComponent(window.location.href);
    const decodedFragment = atob(
      window.location.hash.slice(1).replace(/-/g, "+").replace(/_/g, "/"),
    );
    expect(address).not.toContain(GOAL);
    expect(decodedFragment).not.toContain(GOAL);
    expect(window.location.search).toBe("");
    expect(window.sessionStorage.getItem("whichai:goal")).toBe(GOAL);
  });

  it("replaces, not pushes, when the level changes", async () => {
    const user = userEvent.setup();
    render(<Page />);
    await submit(user);
    await confirm(user);
    const entries = window.history.length;
    const before = window.location.hash;

    await user.click(screen.getByRole("radio", { name: "Polished" }));

    await waitFor(() => expect(window.location.hash).not.toBe(before));
    expect(window.history.length).toBe(entries);
    expect(requestInAddress().level).toBe("polished");
  });
});

describe("Back and Forward", () => {
  it("goes plan, understanding card, home and forward again", async () => {
    const user = userEvent.setup();
    render(<Page />);
    await submit(user);
    await addChip(user, "Dark mode");
    await user.click(screen.getByRole("button", { name: "Remove Blog" }));
    const remaining = chipLabels();
    expect(remaining).toEqual(["Remove Dark mode"]);
    await confirm(user);

    await go("back");
    await screen.findByText("Here's what we understood");
    expect(chipLabels()).toEqual(remaining);
    expect(screen.getByText(GOAL)).toBeInTheDocument();
    expect(
      screen.queryByRole("radio", { name: "Simple" }),
    ).not.toBeInTheDocument();

    await go("back");
    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          level: 1,
          name: "What do you want to do with AI?",
        }),
      ).toBeInTheDocument(),
    );
    expect(searchBox()).toHaveValue(GOAL);
    expect(window.location.hash).toBe("");

    await go("forward");
    await screen.findByText("Here's what we understood");
    expect(chipLabels()).toEqual(remaining);

    await go("forward");
    expect(
      await screen.findByRole(
        "radio",
        { name: "Simple" },
        { timeout: LOAD_TIMEOUT },
      ),
    ).toBeChecked();
  });

  it("returns to the level the reader had chosen", async () => {
    const user = userEvent.setup();
    render(<Page />);
    await submit(user);
    await confirm(user);
    await user.click(screen.getByRole("radio", { name: "Advanced" }));
    await waitFor(() => expect(requestInAddress().level).toBe("advanced"));

    await go("back");
    await screen.findByText("Here's what we understood");
    await go("forward");

    expect(
      await screen.findByRole("radio", { name: "Advanced" }),
    ).toBeChecked();
  });
});

describe("reloading", () => {
  it("restores the plan, its level and the chosen tools", async () => {
    const user = userEvent.setup();
    const first = render(<Page />);
    await submit(user);
    await confirm(user);
    await user.click(screen.getByRole("radio", { name: "Polished" }));
    const swap = screen.getAllByRole("button", { name: /^Choose .+ if / })[0]!;
    await user.click(swap);
    await waitFor(() =>
      expect(Object.keys(requestInAddress().chosenTools)).toHaveLength(1),
    );
    const chosen = requestInAddress().chosenTools;
    const headline = document.getElementById("plan-headline")?.textContent;
    first.unmount();

    render(<Page />);

    expect(
      await screen.findByRole(
        "radio",
        { name: "Polished" },
        { timeout: LOAD_TIMEOUT },
      ),
    ).toBeChecked();
    expect(document.getElementById("plan-headline")).toHaveTextContent(
      headline ?? "",
    );
    expect(requestInAddress().chosenTools).toEqual(chosen);
    const [jobId, toolId] = Object.entries(chosen)[0]!;
    expect(document.querySelector(`#job-card-${jobId}`)).toBeInTheDocument();
    expect(toolId).toBeTruthy();
    expect(screen.getByText(GOAL)).toBeInTheDocument();
  });

  it("restores the understanding card with its chips", async () => {
    const user = userEvent.setup();
    const first = render(<Page />);
    await submit(user);
    await addChip(user, "Dark mode");
    const remaining = chipLabels();
    first.unmount();

    render(<Page />);

    await screen.findByText("Here's what we understood", undefined, {
      timeout: LOAD_TIMEOUT,
    });
    expect(chipLabels()).toEqual(remaining);
  });

  it("starts at home when the fragment is not a valid request", async () => {
    for (const fragment of ["#!!!", "#abc", "#understanding.abc", "#main"]) {
      window.history.replaceState(null, "", `/${fragment}`);
      const view = render(<Page />);
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(
        screen.getByRole("heading", {
          level: 1,
          name: "What do you want to do with AI?",
        }),
      ).toBeInTheDocument();
      view.unmount();
    }
  });
});

describe("a tool page and back", () => {
  it("returns to the plan scrolled to the same card", async () => {
    const user = userEvent.setup();
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const first = render(<Page />);
    await submit(user);
    await confirm(user);
    const cards = screen.getAllByRole("link", { name: /View full details/ });
    const link = cards[1]!;
    expect(link.getAttribute("href")).toMatch(/^\/tools\/[a-z0-9-]+$/);
    const card = link.closest("article")!;

    // The reader leaves for the tool page; the card is noted in this entry.
    link.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(link);
    const planAddress = window.location.hash;
    first.unmount();
    scrollIntoView.mockClear();

    // Back remounts the home page on the same address.
    render(<Page />);

    await waitFor(
      () => expect(document.getElementById(card.id)).toBeInTheDocument(),
      { timeout: LOAD_TIMEOUT },
    );
    await waitFor(() =>
      expect(scrollIntoView.mock.contexts[0]).toBe(
        document.getElementById(card.id),
      ),
    );
    expect(document.getElementById(card.id)).toHaveFocus();
    expect(window.location.hash).toBe(planAddress);
  });
});

describe("New plan", () => {
  it("clears the saved text, shows the start and adds a home entry", async () => {
    const user = userEvent.setup();
    render(<Page />);
    await submit(user);
    await confirm(user);
    const entries = window.history.length;

    await user.click(screen.getByRole("button", { name: "Start a new plan" }));

    await waitFor(() => expect(window.location.hash).toBe(""));
    expect(window.history.length).toBe(entries + 1);
    expect(window.sessionStorage.getItem("whichai:goal")).toBeNull();
    expect(searchBox()).toHaveValue("");
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "What do you want to do with AI?",
      }),
    ).toBeInTheDocument();

    await go("back");
    expect(
      await screen.findByRole(
        "radio",
        { name: "Simple" },
        { timeout: LOAD_TIMEOUT },
      ),
    ).toBeInTheDocument();
  });
});

describe("a goal with no match", () => {
  it("gets its own entry so Back returns to the start", async () => {
    const user = userEvent.setup();
    render(<Page />);
    const start = window.history.length;

    await user.type(searchBox(), "What is the weather in Delhi today");
    await user.keyboard("{Enter}");
    await screen.findByText(
      "We don't have a plan for this goal yet",
      undefined,
      {
        timeout: LOAD_TIMEOUT,
      },
    );
    expect(window.history.length).toBe(start + 1);
    expect(window.location.hash).toBe("");

    await go("back");
    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          level: 1,
          name: "What do you want to do with AI?",
        }),
      ).toBeInTheDocument(),
    );
    expect(searchBox()).toHaveValue("What is the weather in Delhi today");
  });
});
