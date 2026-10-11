import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SettingsView } from "@/components/settings/SettingsView";
import { createMemoryBackend } from "@/lib/storage/backend";
import { seriousViolations } from "@/test/axe";
import { AppProviders } from "@/test/wrappers";
import { SidebarContent } from "./SidebarContent";

vi.mock("next/navigation", async () =>
  (await import("@/test/navigation")).navigationMock("/"),
);

afterEach(() => {
  delete document.documentElement.dataset.theme;
  delete document.documentElement.dataset.motion;
  document.cookie = "theme=; Max-Age=0; Path=/";
  vi.unstubAllGlobals();
});

function stubSystemDark(dark: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: dark && query.includes("dark"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

function Sidebar() {
  return (
    <SidebarContent collapsed={false} initialTheme="system" viewer={null} />
  );
}

const toDark = () =>
  screen.getByRole("button", { name: "Switch to dark mode" });
const toLight = () =>
  screen.getByRole("button", { name: "Switch to light mode" });

describe("theme toggle", () => {
  it("switches from light to dark and back, with label and icon following", async () => {
    const user = userEvent.setup();
    render(
      <AppProviders>
        <Sidebar />
      </AppProviders>,
    );

    const icons = () =>
      Array.from(
        screen
          .getByRole("button", { name: /Switch to/ })
          .querySelectorAll("svg"),
      ).map((svg) => svg.getAttribute("data-active"));
    // Moon (the mode you switch to) is active in light mode, the sun is not.
    expect(icons()).toEqual(["true", "false"]);

    await user.click(toDark());
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.cookie).toContain("theme=dark");
    expect(icons()).toEqual(["false", "true"]);

    await user.click(toLight());
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(document.cookie).toContain("theme=light");
  });

  it("flips to the opposite of the system theme and saves it explicitly", async () => {
    stubSystemDark(true);
    const user = userEvent.setup();
    render(
      <AppProviders>
        <Sidebar />
      </AppProviders>,
    );

    await user.click(toLight());

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(document.cookie).toContain("theme=light");
  });

  it("works with Enter and Space", async () => {
    const user = userEvent.setup();
    render(
      <AppProviders>
        <Sidebar />
      </AppProviders>,
    );

    toDark().focus();
    await user.keyboard("{Enter}");
    expect(document.documentElement.dataset.theme).toBe("dark");

    toLight().focus();
    await user.keyboard(" ");
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("shows a tooltip on keyboard focus", async () => {
    const user = userEvent.setup();
    render(
      <AppProviders>
        <Sidebar />
      </AppProviders>,
    );

    await user.tab();
    toDark().focus();
    await user.hover(toDark());

    expect(screen.getAllByText("Switch to dark mode").length).toBeGreaterThan(
      0,
    );
  });

  it("still switches when the person asked for reduced motion", async () => {
    document.documentElement.dataset.motion = "reduce";
    const user = userEvent.setup();
    render(
      <AppProviders>
        <Sidebar />
      </AppProviders>,
    );

    await user.click(toDark());

    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("persists across a reload through the stored settings", async () => {
    const backend = createMemoryBackend();
    const user = userEvent.setup();
    const first = render(
      <AppProviders backend={backend}>
        <Sidebar />
      </AppProviders>,
    );
    await user.click(toDark());
    // Let the queued write reach the backend before the "reload".
    await new Promise((resolve) => setTimeout(resolve, 50));
    first.unmount();
    delete document.documentElement.dataset.theme;

    render(
      <AppProviders backend={backend}>
        <Sidebar />
      </AppProviders>,
    );

    expect(
      await screen.findByRole("button", { name: "Switch to light mode" }),
    ).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("stays in sync with the choice in Settings", async () => {
    const user = userEvent.setup();
    render(
      <AppProviders>
        <Sidebar />
        <SettingsView viewer={null} version="1.0.0" />
      </AppProviders>,
    );
    const theme = async () =>
      within(await screen.findByRole("radiogroup", { name: "Theme" }));
    await theme();

    await user.click(toDark());
    expect((await theme()).getByRole("radio", { name: "Dark" })).toBeChecked();

    await user.click((await theme()).getByRole("radio", { name: "Light" }));
    expect(
      await screen.findByRole("button", { name: "Switch to dark mode" }),
    ).toBeInTheDocument();
  });

  it("has no serious violations in light and dark, expanded and collapsed", async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(
      <AppProviders>
        <Sidebar />
      </AppProviders>,
    );
    expect(await seriousViolations(container)).toEqual([]);

    await user.click(toDark());
    expect(await seriousViolations(container)).toEqual([]);

    rerender(
      <AppProviders>
        <SidebarContent collapsed initialTheme="dark" viewer={null} />
      </AppProviders>,
    );
    expect(await seriousViolations(container)).toEqual([]);
  });
});
