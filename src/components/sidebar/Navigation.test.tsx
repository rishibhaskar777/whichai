import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createMemoryBackend } from "@/lib/storage/backend";
import { seriousViolations } from "@/test/axe";
import { planNamed, seed } from "@/test/seed";
import { AppProviders } from "@/test/wrappers";
import { SidebarContent } from "./SidebarContent";

vi.mock("next/navigation", async () =>
  (await import("@/test/navigation")).navigationMock("/searches"),
);

function renderSidebar({
  collapsed = false,
  locale = "en" as "en" | "hi",
  backend = createMemoryBackend(),
} = {}) {
  return render(
    <AppProviders backend={backend} locale={locale}>
      <SidebarContent
        collapsed={collapsed}
        initialTheme="system"
        viewer={null}
      />
    </AppProviders>,
  );
}

describe("sidebar navigation", () => {
  it("groups links under Your work and Explore, with Home on top", () => {
    renderSidebar();

    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(within(nav).getByText("Your work")).toBeInTheDocument();
    expect(within(nav).getByText("Explore")).toBeInTheDocument();

    const work = within(nav).getByRole("list", { name: "Your work" });
    expect(
      within(work)
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual(["Projects", "Searches"]);
    const explore = within(nav).getByRole("list", { name: "Explore" });
    expect(
      within(explore)
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual(["Tool Library", "What Changed", "Compare tools"]);
    expect(within(nav).getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("marks the current page", () => {
    renderSidebar();

    expect(screen.getByRole("link", { name: "Searches" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Projects" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("hints the new plan shortcut without changing the link name", () => {
    renderSidebar();

    const link = screen.getByRole("link", { name: "New plan" });
    expect(link).toHaveAttribute("aria-keyshortcuts", "Control+Shift+O");
    expect(link.querySelector("kbd")).toHaveTextContent("Ctrl+Shift+O");
  });

  it("hides the recent list when there are no saved plans", async () => {
    renderSidebar();

    await screen.findByRole("link", { name: "Projects" });
    expect(
      screen.queryByRole("list", { name: "Recent projects" }),
    ).not.toBeInTheDocument();
  });

  it("lists up to five recent plans with a menu on each", async () => {
    const backend = createMemoryBackend();
    const plans = Array.from({ length: 7 }, (_, index) =>
      planNamed(
        `Plan ${index + 1}`,
        "portfolio website with animations",
        new Date(2026, 0, index + 1),
      ),
    );
    await seed(backend, { plans });
    const user = userEvent.setup();
    renderSidebar({ backend });

    const list = await screen.findByRole("list", { name: "Recent projects" });
    const rows = within(list).getAllByRole("listitem");
    expect(rows).toHaveLength(5);
    expect(within(rows[0] as HTMLElement).getByRole("link")).toHaveTextContent(
      "Plan 7",
    );

    await user.click(
      within(rows[0] as HTMLElement).getByRole("button", { name: /Plan 7/ }),
    );
    expect(screen.getByRole("button", { name: "Rename" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("keeps link names and drops the section labels on the rail", () => {
    renderSidebar({ collapsed: true });

    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(within(nav).queryByText("Your work")).not.toBeInTheDocument();
    expect(
      within(nav).getByRole("link", { name: "Tool Library" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "New plan" }).querySelector("kbd"),
    ).toBeNull();
  });

  it("reads the new labels in Hindi", () => {
    renderSidebar({ locale: "hi" });

    expect(screen.getByText("आपका काम")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "खोजें" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "डार्क मोड पर जाएँ" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "और" })).toBeInTheDocument();
  });

  it("has no serious accessibility violations, expanded or collapsed", async () => {
    const expanded = renderSidebar();
    expect(await seriousViolations(expanded.container)).toEqual([]);
    expanded.unmount();

    const rail = renderSidebar({ collapsed: true });
    expect(await seriousViolations(rail.container)).toEqual([]);
  });
});
