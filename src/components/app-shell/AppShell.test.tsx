import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { sampleNews } from "@/data/sample/news";
import { AppShell } from "./AppShell";

vi.mock("next/navigation", async () =>
  (await import("@/test/navigation")).navigationMock("/"),
);

function renderShell() {
  return render(
    <AppShell
      news={sampleNews}
      initialTheme="system"
      viewer={null}
      providers={{ google: true, github: true }}
    >
      <h1>Page</h1>
    </AppShell>,
  );
}

function drawer() {
  return document.querySelector(
    'dialog[aria-label="Main menu"]',
  ) as HTMLDialogElement;
}

function primaryNav() {
  return screen.getAllByRole("navigation", {
    name: "Primary",
  })[0] as HTMLElement;
}

describe("AppShell sidebar", () => {
  it("collapses to a rail and expands again", async () => {
    const user = userEvent.setup();
    renderShell();

    const collapse = screen.getByRole("button", { name: "Collapse sidebar" });
    expect(collapse).toHaveAttribute("aria-expanded", "true");

    await user.click(collapse);
    const expand = screen.getByRole("button", { name: "Expand sidebar" });
    expect(expand).toHaveAttribute("aria-expanded", "false");

    await user.click(expand);
    expect(
      screen.getByRole("button", { name: "Collapse sidebar" }),
    ).toBeInTheDocument();
  });

  it("keeps link names available when collapsed", async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));

    expect(
      within(primaryNav()).getByRole("link", { name: "Tool Library" }),
    ).toBeInTheDocument();
  });

  it("marks the current page", () => {
    renderShell();
    expect(
      within(primaryNav()).getByRole("link", { name: "Home" }),
    ).toHaveAttribute("aria-current", "page");
  });
});

describe("AppShell drawer", () => {
  it("opens as a modal dialog from the menu button", async () => {
    const user = userEvent.setup();
    renderShell();
    expect(drawer()).not.toHaveAttribute("open");

    await user.click(screen.getByRole("button", { name: "Open menu" }));

    expect(drawer()).toHaveAttribute("open");
  });

  it("closes from the close button", async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(screen.getByRole("button", { name: "Open menu" }));

    await user.click(screen.getByRole("button", { name: "Close menu" }));

    expect(drawer()).not.toHaveAttribute("open");
  });

  it("closes when the backdrop is clicked", async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(screen.getByRole("button", { name: "Open menu" }));

    await user.click(drawer());

    expect(drawer()).not.toHaveAttribute("open");
  });

  it("can be reopened after the browser closes it with Escape", async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(screen.getByRole("button", { name: "Open menu" }));

    drawer().close();
    await user.click(screen.getByRole("button", { name: "Open menu" }));

    expect(drawer()).toHaveAttribute("open");
  });

  it("closes after following a link", async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(screen.getByRole("button", { name: "Open menu" }));

    await user.click(within(drawer()).getByRole("link", { name: "Projects" }));

    expect(drawer()).not.toHaveAttribute("open");
  });
});

describe("AppShell news panel", () => {
  it("starts collapsed on narrow screens and opens on demand", async () => {
    const user = userEvent.setup();
    renderShell();

    const expand = screen.getByRole("button", { name: "Expand AI news" });
    expect(expand).toHaveAttribute("aria-expanded", "false");

    await user.click(expand);

    expect(
      screen.getByRole("button", { name: "Collapse AI news" }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("marks the panel as sample content and opens links safely", () => {
    renderShell();

    expect(screen.getByText("Sample content")).toBeInTheDocument();
    const links = screen.getAllByRole("link", { name: /^Visit / });
    expect(links).toHaveLength(5);
    for (const link of links) {
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(link).toHaveAttribute("target", "_blank");
    }
  });
});
