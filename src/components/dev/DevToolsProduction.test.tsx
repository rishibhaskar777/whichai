import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/app-shell/AppShell";
import { SettingsView } from "@/components/settings/SettingsView";
import { getDevTestAccount, parseDevTestAccount } from "@/lib/env";
import { panelNewsFixture } from "@/test/news";
import { AppProviders } from "@/test/wrappers";

vi.mock("next/navigation", async () =>
  (await import("@/test/navigation")).navigationMock("/settings"),
);

afterEach(() => {
  vi.unstubAllEnvs();
  window.localStorage.clear();
});

describe("developer tools outside development", () => {
  it("does not show the plan switcher or the usage reset", async () => {
    render(
      <AppProviders>
        <SettingsView viewer={null} version="1.0.0" />
      </AppProviders>,
    );

    await screen.findByRole("heading", { level: 1, name: "Settings" });
    expect(screen.queryByText("Developer tools")).toBeNull();
    expect(screen.queryByText(/Reset today's usage/)).toBeNull();
  });

  it("does not create the test account", async () => {
    render(
      <AppShell
        news={panelNewsFixture}
        initialTheme="system"
        viewer={null}
        providers={{ google: false, github: false }}
        devAccount={{
          email: "dev@example.org",
          password: "violet lantern ocean",
        }}
      >
        <p>page</p>
      </AppShell>,
    );

    await screen.findByText("page");
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(window.localStorage.getItem("whichai:preview-accounts")).toBeNull();
  });

  it("reads the test variables only in development", () => {
    vi.stubEnv("DEV_TEST_EMAIL", "dev@example.org");
    vi.stubEnv("DEV_TEST_PASSWORD", "violet lantern ocean");

    vi.stubEnv("NODE_ENV", "production");
    expect(getDevTestAccount()).toBeNull();
    vi.stubEnv("NODE_ENV", "development");
    expect(getDevTestAccount()).toEqual({
      email: "dev@example.org",
      password: "violet lantern ocean",
    });
  });

  it("ignores missing or malformed values", () => {
    expect(parseDevTestAccount(undefined, undefined)).toBeNull();
    expect(parseDevTestAccount("", "")).toBeNull();
    expect(parseDevTestAccount("not-an-email", "violet lantern")).toBeNull();
    expect(parseDevTestAccount("dev@example.org", "x".repeat(200))).toBeNull();
    expect(parseDevTestAccount(" Dev@Example.org ", "pw")).toEqual({
      email: "Dev@Example.org",
      password: "pw",
    });
  });
});
