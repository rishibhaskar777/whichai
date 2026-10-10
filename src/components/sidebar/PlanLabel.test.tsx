import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Viewer } from "@/lib/auth/get-session";
import { AppProviders } from "@/test/wrappers";
import { SidebarContent } from "./SidebarContent";

vi.mock("next/navigation", async () =>
  (await import("@/test/navigation")).navigationMock("/"),
);

const VIEWER: Viewer = {
  name: "Rishi Bhaskar",
  provider: "github",
  signOutToken: "token",
};

function renderSidebar(viewer: Viewer | null, collapsed = false) {
  return render(
    <AppProviders>
      <SidebarContent
        collapsed={collapsed}
        initialTheme="system"
        viewer={viewer}
      />
    </AppProviders>,
  );
}

describe("sidebar plan label", () => {
  it("shows Guest and the Free plan link for guests", () => {
    renderSidebar(null);

    expect(screen.getByText("Guest")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Free plan" })).toHaveAttribute(
      "href",
      "/pricing",
    );
  });

  it("shows the name and the Free plan link when signed in", () => {
    renderSidebar(VIEWER);

    expect(
      screen.getByRole("button", { name: "Rishi Bhaskar" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Free plan" })).toHaveAttribute(
      "href",
      "/pricing",
    );
    expect(screen.queryByText("Guest")).not.toBeInTheDocument();
  });

  it("adds Upgrade plan and Subscription to the account menu", async () => {
    const user = userEvent.setup();
    renderSidebar(VIEWER);

    await user.click(screen.getByRole("button", { name: "Rishi Bhaskar" }));

    expect(screen.getByRole("link", { name: "Upgrade plan" })).toHaveAttribute(
      "href",
      "/pricing",
    );
    expect(screen.getByRole("link", { name: "Subscription" })).toHaveAttribute(
      "href",
      "/settings#subscription",
    );
    // The sidebar has its own Settings link, so the menu adds a second one.
    expect(screen.getAllByRole("link", { name: "Settings" })).toHaveLength(2);
  });

  it("links Terms, Refund policy, Privacy and Contact in the footer", () => {
    renderSidebar(null);

    const nav = screen.getByRole("navigation", { name: "Legal and contact" });
    expect(
      within(nav)
        .getAllByRole("link")
        .map((link) => link.getAttribute("href")),
    ).toEqual(["/terms", "/refund-policy", "/privacy", "/contact"]);
  });

  it("leaves the label out of the collapsed rail", () => {
    renderSidebar(null, true);

    expect(
      screen.queryByRole("link", { name: "Free plan" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Legal and contact" }),
    ).not.toBeInTheDocument();
  });

  it("reads the plan name in Hindi", () => {
    render(
      <AppProviders locale="hi">
        <SidebarContent collapsed={false} initialTheme="system" viewer={null} />
      </AppProviders>,
    );

    expect(screen.getByText("अतिथि")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "फ्री प्लान" })).toHaveAttribute(
      "href",
      "/pricing",
    );
  });
});
