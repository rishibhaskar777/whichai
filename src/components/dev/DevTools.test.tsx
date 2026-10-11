import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

// Must run before the components below are imported, which read NODE_ENV once.
vi.hoisted(() => {
  vi.stubEnv("NODE_ENV", "development");
});

import { AppShell } from "@/components/app-shell/AppShell";
import { SettingsView } from "@/components/settings/SettingsView";
import { createLocalPreviewService } from "@/lib/auth/local-preview";
import { panelNewsFixture } from "@/test/news";
import { AppProviders } from "@/test/wrappers";

vi.mock("next/navigation", async () =>
  (await import("@/test/navigation")).navigationMock("/settings"),
);

const ACCOUNT = { email: "dev@example.org", password: "violet lantern ocean" };

describe("developer tools in development", () => {
  it("shows a labelled plan switcher and a usage reset in Settings", async () => {
    const user = userEvent.setup();
    render(
      <AppProviders tier="derived">
        <SettingsView viewer={null} version="1.0.0" />
      </AppProviders>,
    );

    const tools = await screen.findByRole("region", {
      name: "Developer tools",
    });
    const switcher = within(tools).getByRole("radiogroup", {
      name: "Plan switcher",
    });
    for (const name of ["Guest", "free", "plus", "pro", "ultra"]) {
      expect(within(switcher).getByRole("radio", { name })).toBeInTheDocument();
    }
    expect(
      within(tools).getByRole("button", { name: "Reset today's usage" }),
    ).toBeInTheDocument();

    await user.click(within(switcher).getByRole("radio", { name: "pro" }));
    await waitFor(() => expect(tools).toHaveTextContent("Acting as pro"));
    await user.click(
      within(switcher).getByRole("radio", { name: "My real plan" }),
    );
    await waitFor(() => expect(tools).toHaveTextContent("Acting as guest"));
  });

  it("creates the test account once, hashed, and it can log in", async () => {
    render(
      <AppShell
        news={panelNewsFixture}
        initialTheme="system"
        viewer={null}
        providers={{ google: false, github: false }}
        devAccount={ACCOUNT}
      >
        <p>page</p>
      </AppShell>,
    );

    await waitFor(() => {
      expect(
        window.localStorage.getItem("whichai:preview-accounts"),
      ).not.toBeNull();
    });
    const stored =
      window.localStorage.getItem("whichai:preview-accounts") ?? "";
    expect(stored).toContain(ACCOUNT.email);
    expect(stored).not.toContain(ACCOUNT.password);

    const service = createLocalPreviewService({
      kind: "localstorage",
      get: async (key) => window.localStorage.getItem(`whichai:${key}`),
      set: async (key, value) =>
        window.localStorage.setItem(`whichai:${key}`, value),
      remove: async (key) => window.localStorage.removeItem(`whichai:${key}`),
    });
    const result = await service.login({
      email: ACCOUNT.email,
      password: ACCOUNT.password,
    });
    expect(result.ok).toBe(true);
    window.localStorage.clear();
  }, 20_000);
});
