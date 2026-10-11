import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Viewer } from "@/lib/auth/get-session";
import { seriousViolations } from "@/test/axe";
import { AppProviders } from "@/test/wrappers";
import { SidebarContent } from "./SidebarContent";

vi.mock("next/navigation", async () =>
  (await import("@/test/navigation")).navigationMock("/"),
);

afterEach(() => {
  delete document.documentElement.dataset.theme;
  document.cookie = "theme=; Max-Age=0; Path=/";
  document.cookie = "lang=; Max-Age=0; Path=/";
});

const VIEWER: Viewer = {
  name: "Ada Lovelace",
  provider: "github",
  signOutToken: "token-123",
};

interface RenderOptions {
  collapsed?: boolean;
  locale?: "en" | "hi";
}

function renderSidebar(
  viewer: Viewer | null,
  { collapsed = false, locale = "en" }: RenderOptions = {},
) {
  return render(
    <AppProviders locale={locale} tier="free">
      <SidebarContent
        collapsed={collapsed}
        initialTheme="system"
        viewer={viewer}
      />
    </AppProviders>,
  );
}

const trigger = () => screen.getByRole("button", { name: /Ada Lovelace/ });

describe("sidebar footer, signed out", () => {
  it("shows Sign in, the theme toggle and More, and no settings icon or Guest label", () => {
    renderSidebar(null);

    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Switch to dark mode" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "More" })).toHaveAttribute(
      "aria-haspopup",
      "menu",
    );
    expect(
      screen.queryByRole("link", { name: "Settings" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Guest")).not.toBeInTheDocument();
  });

  it("opens the sign-in popup", async () => {
    const user = userEvent.setup();
    renderSidebar(null);
    const dialog = document.querySelector("dialog") as HTMLDialogElement;
    dialog.showModal = vi.fn(() => dialog.setAttribute("open", ""));

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(dialog.showModal).toHaveBeenCalled();
  });

  it("opens More with Settings, Help, Plans & pricing and Language", async () => {
    const user = userEvent.setup();
    renderSidebar(null);

    await user.click(screen.getByRole("button", { name: "More" }));

    const menu = screen.getByRole("menu", { name: "More" });
    expect(
      within(menu)
        .getAllByRole("menuitem")
        .map((item) => item.textContent),
    ).toEqual(["Settings", "Help", "Plans & pricing"]);
    expect(
      within(menu).getByRole("menuitem", { name: "Plans & pricing" }),
    ).toHaveAttribute("href", "/pricing");
    expect(
      within(menu).getByRole("menuitemradio", { name: "English" }),
    ).toBeChecked();
    expect(
      within(menu).queryByRole("menuitemradio", { name: "Dark" }),
    ).not.toBeInTheDocument();
  });

  it("closes More with Escape and returns focus; arrows move", async () => {
    const user = userEvent.setup();
    renderSidebar(null);
    const more = screen.getByRole("button", { name: "More" });
    more.focus();

    await user.keyboard("{Enter}");
    const menu = screen.getByRole("menu");
    expect(
      within(menu).getByRole("menuitem", { name: "Settings" }),
    ).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(within(menu).getByRole("menuitem", { name: "Help" })).toHaveFocus();
    await user.keyboard("{ArrowUp}{ArrowUp}");
    expect(
      within(menu).getByRole("menuitemradio", { name: "हिन्दी" }),
    ).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(more).toHaveFocus();
  });

  it("stacks sign in, theme and More as icon buttons on the rail", () => {
    renderSidebar(null, { collapsed: true });

    for (const name of ["Sign in", "Switch to dark mode", "More"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
    expect(screen.queryByText("Sign in")).not.toBeInTheDocument();
  });

  it("has no serious accessibility violations", async () => {
    const { container } = renderSidebar(null);
    expect(await seriousViolations(container)).toEqual([]);
  });
});

describe("sidebar footer, signed in", () => {
  it("shows the name and plan, with no legal links or theme switch", () => {
    renderSidebar(VIEWER);

    expect(trigger()).toHaveTextContent("Ada Lovelace");
    expect(trigger()).toHaveTextContent("Free plan");
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("navigation", { name: "Legal and contact" }),
    ).not.toBeInTheDocument();
    for (const name of ["Terms", "Refund policy", "Privacy", "Contact"]) {
      expect(screen.queryByRole("link", { name })).not.toBeInTheDocument();
    }
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Switch to dark mode" }),
    ).toBeInTheDocument();
  });

  it("opens with the mouse and closes on a click outside", async () => {
    const user = userEvent.setup();
    renderSidebar(VIEWER);

    await user.click(trigger());

    const menu = screen.getByRole("menu", { name: "Account menu" });
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(
      within(menu)
        .getAllByRole("menuitem")
        .map((item) => item.textContent),
    ).toEqual(["Settings", "Upgrade plan", "Help", "Sign out"]);
    expect(
      within(menu).queryByRole("menuitemradio", { name: "Dark" }),
    ).not.toBeInTheDocument();
    const hrefs = Object.fromEntries(
      within(menu)
        .getAllByRole("menuitem")
        .filter((item) => item.tagName === "A")
        .map((item) => [item.textContent, item.getAttribute("href")]),
    );
    expect(hrefs).toEqual({
      Settings: "/settings",
      "Upgrade plan": "/pricing",
      Help: "/help",
    });

    await user.click(document.body);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens with the keyboard, moves with arrows and closes on Escape", async () => {
    const user = userEvent.setup();
    renderSidebar(VIEWER);

    trigger().focus();
    await user.keyboard("{Enter}");
    const menu = screen.getByRole("menu");
    expect(
      within(menu).getByRole("menuitem", { name: "Settings" }),
    ).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(
      within(menu).getByRole("menuitem", { name: "Upgrade plan" }),
    ).toHaveFocus();
    await user.keyboard("{End}");
    expect(
      within(menu).getByRole("menuitem", { name: "Sign out" }),
    ).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(
      within(menu).getByRole("menuitem", { name: "Settings" }),
    ).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger()).toHaveFocus();
  });

  it("changes the language from the menu", async () => {
    const user = userEvent.setup();
    renderSidebar(VIEWER);
    await user.click(trigger());

    await user.click(screen.getByRole("menuitemradio", { name: "हिन्दी" }));

    expect(document.cookie).toContain("lang=hi");
  });

  it("signs out with a POST form that carries the CSRF token", async () => {
    const user = userEvent.setup();
    renderSidebar(VIEWER);
    await user.click(trigger());

    const signOut = screen.getByRole("menuitem", { name: "Sign out" });
    const form = signOut.closest("form") as HTMLFormElement;
    expect(form).toHaveAttribute("method", "post");
    expect(form).toHaveAttribute("action", "/api/auth/sign-out");
    expect(form.querySelector('input[name="csrf"]')).toHaveValue("token-123");
    expect(signOut).toHaveAttribute("type", "submit");
  });

  it("works from the collapsed rail, with the name still available", async () => {
    const user = userEvent.setup();
    renderSidebar(VIEWER, { collapsed: true });

    await user.click(trigger());

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Sign out" })).toBeVisible();
  });

  it("reads in Hindi", async () => {
    const user = userEvent.setup();
    renderSidebar(VIEWER, { locale: "hi" });

    expect(trigger()).toHaveTextContent("फ्री प्लान");
    await user.click(trigger());
    const menu = screen.getByRole("menu", { name: "खाता मेन्यू" });
    expect(
      within(menu).getByRole("menuitem", { name: "सेटिंग" }),
    ).toBeInTheDocument();
  });

  it("has no serious accessibility violations with the menu open", async () => {
    const user = userEvent.setup();
    const { container } = renderSidebar(VIEWER);
    await user.click(trigger());

    expect(await seriousViolations(container)).toEqual([]);
  });
});
