import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAccount } from "@/components/account/AccountProvider";
import { HomeFlow } from "@/components/home-flow/HomeFlow";
import { useLocalData } from "@/components/local-data/LocalDataProvider";
import { LimitCard } from "@/components/limit-card/LimitCard";
import { PlanRoute } from "@/components/plan-route/PlanRoute";
import { CompareGate } from "@/components/tools/CompareGate";
import { dayKey } from "@/lib/plans/usage";
import type { Tier } from "@/lib/plans/entitlements";
import { encodePlanRequest } from "@/lib/share/share-link";
import { createMemoryBackend, type KvBackend } from "@/lib/storage/backend";
import { seriousViolations } from "@/test/axe";
import { searchParams } from "@/test/navigation";
import { planNamed, requestFor, seed } from "@/test/seed";
import { AppProviders } from "@/test/wrappers";
import { useEntitlements } from "./EntitlementsProvider";

vi.mock("next/navigation", async () =>
  (await import("@/test/navigation")).navigationMock("/"),
);

// A cold chunk load counts towards each test.
vi.setConfig({ testTimeout: 60_000 });

const LOAD_TIMEOUT = 20_000;
const GOAL = "Build a portfolio website with a blog";

afterEach(() => {
  window.history.replaceState(null, "", "/");
  searchParams.current = new URLSearchParams();
});

/** Writes today's count under the profile a signed-out visitor has. */
async function seedUsage(
  backend: KvBackend,
  count: number,
  day = dayKey(new Date()),
) {
  await backend.set(
    "plan-usage",
    JSON.stringify({ "guest:visitor": { day, count } }),
  );
}

async function storedCount(backend: KvBackend): Promise<number> {
  const text = await backend.get("plan-usage");
  if (!text) return 0;
  const usage = JSON.parse(text) as Record<string, { count: number }>;
  return Object.values(usage).reduce((sum, record) => sum + record.count, 0);
}

function renderHome(tier: Tier, backend: KvBackend = createMemoryBackend()) {
  render(
    <AppProviders backend={backend} tier={tier}>
      <HomeFlow />
    </AppProviders>,
  );
  return { backend, user: userEvent.setup() };
}

type User = ReturnType<typeof userEvent.setup>;

async function makePlan(user: User, goal = GOAL) {
  const box = await screen.findByLabelText(/What do you want to do with AI/);
  await user.clear(box);
  await user.type(box, goal);
  await user.keyboard("{Enter}");
  await user.click(
    await screen.findByRole(
      "button",
      { name: "Yes, show my plan" },
      { timeout: LOAD_TIMEOUT },
    ),
  );
}

async function planShown() {
  await screen.findByRole(
    "radio",
    { name: "Simple" },
    { timeout: LOAD_TIMEOUT },
  );
}

describe("daily plan limits", () => {
  it("lets a guest make 5 plans and shows the limit card instead of the 6th", async () => {
    const { backend, user } = renderHome("guest");

    for (let made = 0; made < 5; made += 1) {
      await makePlan(user, `${GOAL} ${made}`);
      await planShown();
    }
    await waitFor(async () => expect(await storedCount(backend)).toBe(5));

    await makePlan(user, `${GOAL} again`);

    const card = await screen.findByRole("region", {
      name: "Daily plan limit",
    });
    expect(card).toHaveTextContent(
      "You've used today's 5 guest plans. Create a free account to get 20 a day.",
    );
    expect(screen.queryByRole("radio", { name: "Simple" })).toBeNull();
    expect(await storedCount(backend)).toBe(5);

    await user.click(within(card).getByRole("button", { name: "Register" }));
    const dialog = document.querySelector("dialog") as HTMLDialogElement;
    expect(
      within(dialog).getByRole("heading", {
        name: "Create your WhichAI account",
      }),
    ).toBeInTheDocument();
  });

  it("gives a free account 20 plans, then a link to /pricing", async () => {
    const backend = createMemoryBackend();
    await seedUsage(backend, 19);
    const { user } = renderHome("free", backend);

    await makePlan(user);
    await planShown();
    await makePlan(user, `${GOAL} again`);

    const card = await screen.findByRole("region", {
      name: "Daily plan limit",
    });
    expect(card).toHaveTextContent(
      "You've reached today's 20 plans. Upgrade for unlimited plans.",
    );
    expect(within(card).getByRole("link", { name: "Upgrade" })).toHaveAttribute(
      "href",
      "/pricing",
    );
  });

  it("never limits a paid plan", async () => {
    const backend = createMemoryBackend();
    await seedUsage(backend, 500);
    const { user } = renderHome("pro", backend);

    await makePlan(user);
    await planShown();

    expect(
      screen.queryByRole("region", { name: "Daily plan limit" }),
    ).toBeNull();
    expect(screen.queryByText(/plans left today/)).toBeNull();
  });

  it("shows how many are left only when two or fewer remain", async () => {
    const backend = createMemoryBackend();
    await seedUsage(backend, 2);
    const { user } = renderHome("guest", backend);
    await screen.findByLabelText(/What do you want to do with AI/);
    await waitFor(() => expect(screen.queryByText(/left today/)).toBeNull());

    await makePlan(user);
    await planShown();

    expect(await screen.findByText("2 plans left today")).toBeInTheDocument();
  });

  it("does not count Back and Forward, a change of level or a reload of the plan", async () => {
    const { backend, user } = renderHome("ultra");
    await makePlan(user);
    await planShown();
    await waitFor(async () => expect(await storedCount(backend)).toBe(1));

    await user.click(screen.getByRole("radio", { name: "Advanced" }));
    await user.click(screen.getByRole("radio", { name: "Simple" }));
    window.history.back();
    await waitFor(() =>
      expect(screen.queryByRole("radio", { name: "Simple" })).toBeNull(),
    );
    window.history.forward();
    await planShown();

    expect(await storedCount(backend)).toBe(1);
  });

  it("does not count a saved plan or a share link being opened", async () => {
    const backend = createMemoryBackend();
    const saved = planNamed("My portfolio");
    await seed(backend, { plans: [saved] });

    searchParams.current = new URLSearchParams(`id=${saved.id}`);
    const first = render(
      <AppProviders backend={backend} tier="guest">
        <PlanRoute />
      </AppProviders>,
    );
    await screen.findByRole("heading", { level: 1 }, { timeout: LOAD_TIMEOUT });
    first.unmount();

    searchParams.current = new URLSearchParams();
    window.history.replaceState(
      null,
      "",
      `/plan#${encodePlanRequest(requestFor("portfolio website with animations"))}`,
    );
    render(
      <AppProviders backend={backend} tier="guest">
        <PlanRoute />
      </AppProviders>,
    );
    await screen.findByText(/Opened from a share link/, undefined, {
      timeout: LOAD_TIMEOUT,
    });

    expect(await storedCount(backend)).toBe(0);
  });

  it("starts the count again on a new day", async () => {
    const backend = createMemoryBackend();
    await seedUsage(backend, 5, "2000-01-01");
    const { user } = renderHome("guest", backend);

    await makePlan(user);
    await planShown();

    expect(
      screen.queryByRole("region", { name: "Daily plan limit" }),
    ).toBeNull();
    await waitFor(async () => expect(await storedCount(backend)).toBe(1));
  });

  it("keeps a guest's searches for the visit only, and a free account's on the device", async () => {
    const guest = renderHome("guest");
    await makePlan(guest.user);
    await planShown();
    expect(await guest.backend.get("history")).toBeNull();
    document.body.innerHTML = "";

    const free = renderHome("free");
    await makePlan(free.user);
    await planShown();
    await waitFor(async () =>
      expect(await free.backend.get("history")).not.toBeNull(),
    );
  });
});

function Harness() {
  const { register, login, identity } = useAccount();
  const { consumePlan, usedToday, tier } = useEntitlements();
  const { plans } = useLocalData();
  return (
    <div>
      <p data-testid="state">
        {identity.kind}|{tier}|{usedToday}|{plans.length}
      </p>
      <button type="button" onClick={() => consumePlan()}>
        use
      </button>
      <button
        type="button"
        onClick={() =>
          void register({
            email: "ada@example.org",
            password: "violet lantern ocean",
            firstName: "Ada",
            lastName: "Lovelace",
            terms: true,
          })
        }
      >
        register
      </button>
      <button
        type="button"
        onClick={() =>
          void login({
            email: "ada@example.org",
            password: "violet lantern ocean",
          })
        }
      >
        login
      </button>
    </div>
  );
}

describe("guest to account", () => {
  it("moves the day's count and keeps the saved data", async () => {
    const backend = createMemoryBackend();
    await seed(backend, { plans: [planNamed("Kept plan")] });
    const user = userEvent.setup();
    render(
      <AppProviders backend={backend} tier="derived">
        <Harness />
      </AppProviders>,
    );
    const state = () => screen.getByTestId("state").textContent;
    await waitFor(() => expect(state()).toBe("none|guest|0|1"));

    for (let i = 0; i < 3; i += 1) {
      await user.click(screen.getByRole("button", { name: "use" }));
    }
    await waitFor(() => expect(state()).toBe("none|guest|3|1"));

    await user.click(screen.getByRole("button", { name: "register" }));
    await user.click(screen.getByRole("button", { name: "login" }));

    await waitFor(() => expect(state()).toBe("preview|free|3|1"), {
      timeout: 10_000,
    });
  });
});

describe("locked features", () => {
  async function openShared(tier: Tier) {
    const request = requestFor("portfolio website with animations", {
      level: "advanced",
    });
    window.history.replaceState(
      null,
      "",
      `/plan#${encodePlanRequest(request)}`,
    );
    render(
      <AppProviders tier={tier}>
        <PlanRoute />
      </AppProviders>,
    );
    await screen.findByText(/Opened from a share link/, undefined, {
      timeout: LOAD_TIMEOUT,
    });
  }

  it("locks Advanced, export, share and save for a guest, each with a way forward", async () => {
    await openShared("guest");

    const advanced = screen.getByRole("link", { name: /Advanced/ });
    expect(advanced).toHaveAttribute("href", "/pricing");
    expect(advanced).toHaveAccessibleDescription("Available on paid plans");
    expect(screen.getByRole("radio", { name: "Polished" })).toBeChecked();

    const pdf = screen.getByRole("link", { name: /Download PDF/ });
    expect(pdf).toHaveAttribute("href", "/pricing");
    expect(pdf).toHaveAccessibleDescription("Available on paid plans");

    for (const name of [/Save/, /Copy share link/]) {
      const control = screen.getByRole("button", { name });
      expect(control).toHaveAccessibleDescription("Free with an account");
    }
  });

  it("locks only Advanced and export for a free account", async () => {
    await openShared("free");

    expect(screen.getByRole("link", { name: /Advanced/ })).toHaveAttribute(
      "href",
      "/pricing",
    );
    expect(screen.getByRole("link", { name: /Download PDF/ })).toHaveAttribute(
      "href",
      "/pricing",
    );
    expect(
      screen.getByRole("button", { name: "Copy share link" }),
    ).toBeEnabled();
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });

  it("locks nothing on a paid plan", async () => {
    await openShared("plus");

    expect(screen.getByRole("radio", { name: "Advanced" })).toBeChecked();
    expect(screen.queryByRole("link", { name: /Advanced/ })).toBeNull();
    expect(screen.getByRole("button", { name: "Download PDF" })).toBeEnabled();
  });

  it("explains the 10-project limit on a free account", async () => {
    const backend = createMemoryBackend();
    await seed(backend, {
      plans: Array.from({ length: 10 }, (_, index) =>
        planNamed(`Plan ${index}`),
      ),
    });
    window.history.replaceState(
      null,
      "",
      `/plan#${encodePlanRequest(requestFor("portfolio website with animations"))}`,
    );
    render(
      <AppProviders backend={backend} tier="free">
        <PlanRoute />
      </AppProviders>,
    );
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole(
        "button",
        { name: "Save" },
        { timeout: LOAD_TIMEOUT },
      ),
    );

    expect(
      await screen.findByText(/You've saved 10 projects/),
    ).toBeInTheDocument();
  });

  it("locks Compare for a guest and leads to /pricing", async () => {
    render(
      <AppProviders tier="guest">
        <CompareGate>
          <p>the table</p>
        </CompareGate>
      </AppProviders>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Compare tools is on paid plans",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText("the table")).toBeNull();
    expect(screen.getByRole("link", { name: "See plans" })).toHaveAttribute(
      "href",
      "/pricing",
    );
  });

  it("shows Compare on a paid plan", async () => {
    render(
      <AppProviders tier="ultra">
        <CompareGate>
          <p>the table</p>
        </CompareGate>
      </AppProviders>,
    );

    expect(await screen.findByText("the table")).toBeInTheDocument();
  });
});

describe("limit card", () => {
  it.each(["guest", "free"] as const)(
    "has no serious accessibility violations for %s",
    async (tier) => {
      const { container } = render(
        <AppProviders tier={tier}>
          <LimitCard tier={tier} />
        </AppProviders>,
      );

      expect(await seriousViolations(container)).toEqual([]);
    },
  );
});
