import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createMemoryBackend } from "@/lib/storage/backend";
import { DEFAULT_SETTINGS } from "@/lib/storage/schemas";
import { createStore } from "@/lib/storage/store";
import { seed } from "@/test/seed";
import { AppProviders } from "@/test/wrappers";
import { HomeFlow } from "./HomeFlow";

vi.mock("next/navigation", async () =>
  (await import("@/test/navigation")).navigationMock("/"),
);

vi.setConfig({ testTimeout: 30_000 });

const LOAD_TIMEOUT = 15_000;

async function renderHome(options: { saveHistory?: boolean } = {}) {
  const backend = createMemoryBackend();
  if (options.saveHistory === false) {
    await seed(backend, {
      settings: { ...DEFAULT_SETTINGS, saveHistory: false },
    });
  }
  render(
    <AppProviders backend={backend}>
      <HomeFlow />
    </AppProviders>,
  );
  const user = userEvent.setup();
  await screen.findByLabelText("What do you want to do with AI?");
  await new Promise((resolve) => setTimeout(resolve, 20));
  return { backend, user };
}

async function submit(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.type(screen.getByRole("textbox"), text);
  await user.keyboard("{Enter}");
  await screen.findByRole(
    "heading",
    { level: 1, name: /what we understood|We don't have a plan/i },
    { timeout: LOAD_TIMEOUT },
  );
}

function chipLabels() {
  const list = screen.getByRole("list", { name: "What we understood" });
  return Array.from(list.querySelectorAll("li")).map((item) =>
    item.textContent?.trim(),
  );
}

function missedGoals(backend: ReturnType<typeof createMemoryBackend>) {
  return createStore(backend).loadMisses();
}

describe("understanding more goals", () => {
  it("understands a goal written with Hindi words", async () => {
    const { user } = await renderHome();

    await submit(user, "mujhe resume banana hai fresher ke liye");

    expect(chipLabels()).toEqual(["Resume and job search"]);
    expect(screen.queryByText("Did you mean one of these?")).toBeNull();
  });

  it("asks Did you mean when the sentence fits several goals", async () => {
    const { user } = await renderHome();

    await submit(user, "a website");

    expect(screen.getByText("Did you mean one of these?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Business website" }));

    expect(chipLabels()).toEqual(["Business website"]);
    expect(
      screen.getByRole("button", { name: "Business website" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("builds a plan from the parts it heard when no goal fits", async () => {
    const { user } = await renderHome();

    await submit(user, "razorpay payments with login and a database");

    expect(chipLabels()).toEqual([
      "Plan built from your parts",
      "Authentication",
      "Database",
      "Payments (India)",
    ]);
  });

  it("can switch from a goal to a plan from the parts", async () => {
    const { user } = await renderHome();

    await submit(user, "a blog or a newsletter with seo and analytics");
    await user.click(
      screen.getByRole("button", { name: "Build from the parts I described" }),
    );

    expect(chipLabels()[0]).toBe("Plan built from your parts");
    expect(chipLabels()).toContain("Search visibility (SEO)");
  });

  it("shows the plan with an added part and the chosen goal", async () => {
    const { user } = await renderHome();

    await submit(user, "portfolio website with a chatbot");
    await user.click(screen.getByRole("button", { name: "Yes, show my plan" }));

    const plan = await screen.findByRole(
      "heading",
      { level: 1, name: "Your portfolio website plan" },
      { timeout: LOAD_TIMEOUT },
    );
    expect(plan).toBeInTheDocument();
    const cards = Array.from(
      document.querySelectorAll('[id^="job-card-"]'),
    ).map((card) => card.id);
    expect(cards).toContain("job-card-chatbot-builder");
  });
});

describe("goals that were not understood", () => {
  it("keeps a goal with no match on the device", async () => {
    const { backend, user } = await renderHome();

    await submit(user, "What is the weather in Delhi today");

    await waitFor(async () => {
      const misses = await missedGoals(backend);
      expect(misses).toHaveLength(1);
      expect(misses[0]).toMatchObject({
        goal: "What is the weather in Delhi today",
        reason: "no-match",
      });
    });
  });

  it("keeps a goal that only parts could explain", async () => {
    const { backend, user } = await renderHome();

    await submit(user, "need hosting and a custom domain");

    await waitFor(async () =>
      expect((await missedGoals(backend))[0]).toMatchObject({
        reason: "parts-only",
      }),
    );
  });

  it("keeps nothing for a goal that was understood", async () => {
    const { backend, user } = await renderHome();

    await submit(user, "start a youtube channel");
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(await missedGoals(backend)).toEqual([]);
  });

  it("keeps nothing when history is off", async () => {
    const { backend, user } = await renderHome({ saveHistory: false });

    await submit(user, "What is the weather in Delhi today");
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(await missedGoals(backend)).toEqual([]);
    expect(await backend.get("misses")).toBeNull();
  });

  it("offers the common goals, a search and all goals when nothing matched", async () => {
    const { user } = await renderHome();

    await submit(user, "What is the weather in Delhi today");

    const list = screen.getByRole("list", { name: "Goals we cover" });
    expect(within(list).getAllByRole("button")).toHaveLength(8);
    expect(screen.getByLabelText("Search all goals")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "See all goals" }),
    ).toBeInTheDocument();
  });
});
