import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useNewPlanSignal } from "@/lib/new-plan-signal";
import { createMemoryBackend } from "@/lib/storage/backend";
import { DEFAULT_SETTINGS } from "@/lib/storage/schemas";
import { createStore } from "@/lib/storage/store";
import { seed } from "@/test/seed";
import { AppProviders } from "@/test/wrappers";
import { HomeFlow } from "./HomeFlow";

vi.mock("next/navigation", async () =>
  (await import("@/test/navigation")).navigationMock("/"),
);

function Rerun({ goal }: { goal: string }) {
  const { startGoal } = useNewPlanSignal();
  return (
    <button type="button" onClick={() => startGoal(goal)}>
      Run from history
    </button>
  );
}

async function renderHome(
  options: { saveHistory?: boolean; locale?: "en" | "hi"; rerun?: string } = {},
) {
  const backend = createMemoryBackend();
  if (options.saveHistory === false) {
    await seed(backend, {
      settings: { ...DEFAULT_SETTINGS, saveHistory: false },
    });
  }
  render(
    <AppProviders backend={backend} locale={options.locale ?? "en"}>
      <HomeFlow />
      {options.rerun ? <Rerun goal={options.rerun} /> : null}
    </AppProviders>,
  );
  const user = userEvent.setup();
  // The saved settings load asynchronously; wait for the page to settle.
  await screen.findByLabelText(/What do you want to do with AI|आप AI से/);
  await new Promise((resolve) => setTimeout(resolve, 20));
  return { backend, user };
}

async function submit(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.type(screen.getByRole("textbox"), text);
  await user.keyboard("{Enter}");
}

function history(backend: ReturnType<typeof createMemoryBackend>) {
  return createStore(backend)
    .load()
    .then((data) => data.history);
}

describe("search history from the home page", () => {
  it("records a submitted goal with its understood type", async () => {
    const { backend, user } = await renderHome();

    await submit(user, "Build a portfolio website");

    await waitFor(async () => {
      const entries = await history(backend);
      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({
        goal: "Build a portfolio website",
        goalType: "portfolio-website",
      });
    });
  });

  it("records a goal that has no plan with no type", async () => {
    const { backend, user } = await renderHome();

    await submit(user, "What is the weather in Delhi today");

    await waitFor(async () =>
      expect((await history(backend))[0]).toMatchObject({ goalType: null }),
    );
  });

  it("records nothing when history is off", async () => {
    const { backend, user } = await renderHome({ saveHistory: false });

    await submit(user, "Build a portfolio website");
    await screen.findByText("Here's what we understood");
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(await history(backend)).toEqual([]);
    expect(await backend.get("history")).toBeNull();
  });

  it("runs a goal handed over from the Searches page and records it", async () => {
    const { backend, user } = await renderHome({
      rerun: "Make a study plan for my exams",
    });

    await user.click(screen.getByRole("button", { name: "Run from history" }));

    expect(
      await screen.findByText("Here's what we understood"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Make a study plan for my exams"),
    ).toBeInTheDocument();
    await waitFor(async () =>
      expect((await history(backend))[0]?.goal).toBe(
        "Make a study plan for my exams",
      ),
    );
  });
});

describe("home page language", () => {
  it("shows Hindi text and the English-goals note", async () => {
    await renderHome({ locale: "hi" });

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "आप AI से क्या करना चाहते हैं?",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("अभी लक्ष्य अंग्रेज़ी में लिखने पर ही समझे जाते हैं।"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "पढ़ाई की योजना" }),
    ).toBeInTheDocument();
  });

  it("notes that tool details stay in English once a plan is shown", async () => {
    const user = userEvent.setup();
    render(
      <AppProviders locale="hi">
        <HomeFlow />
      </AppProviders>,
    );
    await user.type(screen.getByRole("textbox"), "Build a portfolio website");
    await user.keyboard("{Enter}");
    await user.click(
      await screen.findByRole("button", { name: "हाँ, मेरी योजना दिखाइए" }),
    );

    expect(
      await screen.findByText("टूल की जानकारी अभी अंग्रेज़ी में है।"),
    ).toBeInTheDocument();
  });
});
