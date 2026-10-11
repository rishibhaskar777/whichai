import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/app-shell/AppShell";
import { HomeFlow } from "@/components/home-flow/HomeFlow";
import type { Tier } from "@/lib/plans/entitlements";
import { useNewPlanSignal } from "@/lib/new-plan-signal";
import { dayKey } from "@/lib/plans/usage";
import { createMemoryBackend, type KvBackend } from "@/lib/storage/backend";
import { seriousViolations } from "@/test/axe";
import { panelNewsFixture } from "@/test/news";
import { AppProviders } from "@/test/wrappers";

vi.mock("next/navigation", async () =>
  (await import("@/test/navigation")).navigationMock("/"),
);

vi.setConfig({ testTimeout: 60_000 });

const LOAD_TIMEOUT = 20_000;

/* Goals the interpreter understands, so each one makes an understanding card. */
const GOALS = [
  "Make a study plan for my upcoming exams",
  "Build a portfolio website to show my work",
  "Improve my resume for a job application",
  "Make a short video from my own footage",
  "Build a simple app without much coding",
  "Read and write stories with AI help",
];

afterEach(() => {
  vi.useRealTimers();
  window.history.replaceState(null, "", "/");
  window.localStorage.clear();
});

type User = ReturnType<typeof userEvent.setup>;

async function seedUsage(backend: KvBackend, count: number) {
  await backend.set(
    "plan-usage",
    JSON.stringify({
      "guest:visitor": { day: dayKey(new Date()), count },
    }),
  );
}

async function storedCount(backend: KvBackend): Promise<number> {
  const text = await backend.get("plan-usage");
  if (!text) return 0;
  const usage = JSON.parse(text) as Record<string, { count: number }>;
  return Object.values(usage).reduce((sum, record) => sum + record.count, 0);
}

const composer = () =>
  screen.getByLabelText(
    /What do you want to do with AI/,
  ) as HTMLTextAreaElement;
const sendButton = () => screen.getByRole("button", { name: "Get a plan" });
const bar = () => screen.queryByRole("region", { name: "Daily plan limit" });

/** Types into whichever composer is showing and sends it with Enter. */
async function submit(user: User, text: string) {
  await user.clear(composer());
  await user.type(composer(), text);
  await user.keyboard("{Enter}");
  await screen.findByText(text, undefined, { timeout: LOAD_TIMEOUT });
  await screen.findByRole(
    "button",
    { name: "Yes, show my plan" },
    { timeout: LOAD_TIMEOUT },
  );
}

function renderHome(tier: Tier, backend: KvBackend = createMemoryBackend()) {
  const view = render(
    <AppProviders backend={backend} tier={tier}>
      <HomeFlow />
    </AppProviders>,
  );
  return { backend, user: userEvent.setup(), ...view };
}

describe("a guest's five goals", () => {
  it("blocks the sixth, disables the composer and makes no card", async () => {
    const { backend, user, container } = renderHome("guest");

    // The first goal uses the home search, the rest the composer under the card.
    for (let made = 0; made < 5; made += 1) {
      await submit(user, GOALS[made] as string);
    }
    await waitFor(async () => expect(await storedCount(backend)).toBe(5));

    await waitFor(() => expect(bar()).not.toBeNull());
    expect(bar()).toHaveTextContent(
      /You've reached today's 5 guest plans\. Resets in \d+h \d+m\./,
    );
    expect(composer()).toBeDisabled();
    expect(composer()).toHaveAttribute("aria-disabled", "true");
    expect(sendButton()).toBeDisabled();
    expect(sendButton()).toHaveAttribute("aria-disabled", "true");

    // Enter does nothing, and the fifth card is still the one showing.
    await user.type(composer(), "A sixth goal{Enter}");
    expect(screen.queryByText("A sixth goal")).toBeNull();
    expect(screen.getByText(GOALS[4] as string)).toBeInTheDocument();
    expect(await storedCount(backend)).toBe(5);

    expect(await seriousViolations(container)).toEqual([]);

    const register = within(bar() as HTMLElement).getByRole("button", {
      name: "Register free",
    });
    await user.click(register);
    const dialog = document.querySelector(
      'dialog[aria-labelledby="sign-in-dialog-title"]',
    ) as HTMLDialogElement;
    expect(
      within(dialog).getByRole("heading", {
        name: "Create your WhichAI account",
      }),
    ).toBeInTheDocument();
  });

  it("announces the limit once in a polite live region", async () => {
    const backend = createMemoryBackend();
    await seedUsage(backend, 5);
    renderHome("guest", backend);

    await waitFor(() => expect(bar()).not.toBeNull());
    const announced = screen
      .getAllByRole("status")
      .filter((node) => node.textContent === "Daily plan limit reached");
    expect(announced).toHaveLength(1);
  });
});

describe("work on a goal that is already started", () => {
  it("does not count Edit, chips, resubmitting the same goal or Yes, show my plan", async () => {
    const { backend, user } = renderHome("guest");
    await submit(user, "Portfolio website in React");
    await waitFor(async () => expect(await storedCount(backend)).toBe(1));

    await user.click(screen.getByRole("button", { name: "Remove React" }));
    const add = screen
      .getAllByRole("button", { name: /^Add (?!a part)/ })
      .at(0) as HTMLElement;
    await user.click(add);
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(await storedCount(backend)).toBe(1);

    await user.keyboard("{Enter}");
    await screen.findByRole("button", { name: "Yes, show my plan" });
    await user.click(screen.getByRole("button", { name: "Yes, show my plan" }));
    await screen.findByRole(
      "radio",
      { name: "Simple" },
      { timeout: LOAD_TIMEOUT },
    );
    await user.click(screen.getByRole("radio", { name: "Polished" }));

    expect(await storedCount(backend)).toBe(1);
  });
});

function Starters() {
  const { request, startGoal } = useNewPlanSignal();
  return (
    <div>
      <button type="button" onClick={request}>
        New plan
      </button>
      <button type="button" onClick={() => startGoal(GOALS[0] as string)}>
        Re-run from Searches
      </button>
    </div>
  );
}

describe("every entry point at the limit", () => {
  it("blocks suggestion chips, New plan and a Searches re-run", async () => {
    const backend = createMemoryBackend();
    await seedUsage(backend, 5);
    const user = userEvent.setup();
    render(
      <AppProviders backend={backend} tier="guest">
        <Starters />
        <HomeFlow />
      </AppProviders>,
    );
    await waitFor(() => expect(bar()).not.toBeNull());

    const chips = within(
      screen.getByRole("list", { name: "Suggestions" }),
    ).getAllByRole("button");
    for (const chip of chips) expect(chip).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "New plan" }));
    expect(bar()).not.toBeNull();
    expect(composer()).toBeDisabled();

    await user.click(
      screen.getByRole("button", { name: "Re-run from Searches" }),
    );
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(screen.queryByText("Here's what we understood")).toBeNull();
    expect(await storedCount(backend)).toBe(5);
  });

  it("lets a re-run from Searches start a goal while there is room", async () => {
    const backend = createMemoryBackend();
    const user = userEvent.setup();
    render(
      <AppProviders backend={backend} tier="guest">
        <Starters />
        <HomeFlow />
      </AppProviders>,
    );
    await screen.findByLabelText(/What do you want to do with AI/);

    await user.click(
      screen.getByRole("button", { name: "Re-run from Searches" }),
    );

    await screen.findByRole(
      "button",
      { name: "Yes, show my plan" },
      { timeout: LOAD_TIMEOUT },
    );
    await waitFor(async () => expect(await storedCount(backend)).toBe(1));
  });

  it("still opens the plan of a card made before the limit", async () => {
    const backend = createMemoryBackend();
    await seedUsage(backend, 4);
    const { user } = renderHome("guest", backend);
    await submit(user, GOALS[0] as string);
    await waitFor(() => expect(bar()).not.toBeNull());

    await user.click(screen.getByRole("button", { name: "Yes, show my plan" }));

    await screen.findByRole(
      "radio",
      { name: "Simple" },
      { timeout: LOAD_TIMEOUT },
    );
    expect(await storedCount(backend)).toBe(5);
  });
});

describe("limits by tier", () => {
  it("stops a free account at 20 and points to /pricing", async () => {
    const backend = createMemoryBackend();
    await seedUsage(backend, 20);
    renderHome("free", backend);

    await waitFor(() => expect(bar()).not.toBeNull());
    expect(bar()).toHaveTextContent(
      /You've reached today's 20 plans\. Resets in \d+h \d+m\./,
    );
    expect(
      within(bar() as HTMLElement).getByRole("link", { name: "See plans" }),
    ).toHaveAttribute("href", "/pricing");
    expect(composer()).toBeDisabled();
  });

  it("lets a free account use its 20th plan", async () => {
    const backend = createMemoryBackend();
    await seedUsage(backend, 19);
    const { user } = renderHome("free", backend);

    await submit(user, GOALS[0] as string);

    await waitFor(() => expect(bar()).not.toBeNull());
  });

  it("never limits a paid plan", async () => {
    const backend = createMemoryBackend();
    await seedUsage(backend, 500);
    const { user } = renderHome("pro", backend);

    await submit(user, GOALS[0] as string);

    expect(bar()).toBeNull();
    expect(composer()).toBeEnabled();
  });
});

describe("the countdown and midnight", () => {
  it("counts down to local midnight", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2030, 2, 10, 21, 30, 0));
    const backend = createMemoryBackend();
    await backend.set(
      "plan-usage",
      JSON.stringify({ "guest:visitor": { day: "2030-03-10", count: 5 } }),
    );
    renderHome("guest", backend);

    await waitFor(() => expect(bar()).not.toBeNull());
    expect(bar()).toHaveTextContent("Resets in 2h 30m.");
  });

  it("re-enables the composer at midnight without a reload", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2030, 2, 10, 23, 59, 59, 300));
    const backend = createMemoryBackend();
    await backend.set(
      "plan-usage",
      JSON.stringify({ "guest:visitor": { day: "2030-03-10", count: 5 } }),
    );
    renderHome("guest", backend);
    await waitFor(() => expect(bar()).not.toBeNull());
    expect(composer()).toBeDisabled();

    vi.setSystemTime(new Date(2030, 2, 11, 0, 0, 2));

    await waitFor(() => expect(bar()).toBeNull(), { timeout: 5000 });
    expect(composer()).toBeEnabled();
  });
});

describe("the sidebar", () => {
  it("shows Guest with what a day allows, and the usage line", async () => {
    const user = userEvent.setup();
    render(
      <AppShell
        news={panelNewsFixture}
        initialTheme="system"
        viewer={null}
        providers={{ google: false, github: false }}
        tier="guest"
      >
        <p>page</p>
      </AppShell>,
    );
    await user.click(screen.getAllByRole("button", { name: "Sign in" })[0]!);
    const dialog = document.querySelector(
      'dialog[aria-labelledby="sign-in-dialog-title"]',
    ) as HTMLDialogElement;
    await user.click(
      within(dialog).getByRole("button", {
        name: "Continue without signing in",
      }),
    );

    const [guest] = await screen.findAllByRole("button", { name: /Guest/ });
    expect(guest).toHaveTextContent("Guest");
    expect(guest).toHaveTextContent("5 plans a day");
    expect(guest).not.toHaveTextContent("Free plan");

    await user.click(guest as HTMLElement);
    expect(
      await screen.findByText("5 of 5 plans left today"),
    ).toBeInTheDocument();
  });
});
