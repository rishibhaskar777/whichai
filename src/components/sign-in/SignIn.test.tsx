import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/app-shell/AppShell";
import { sampleNews } from "@/data/sample/news";
import { seriousViolations } from "@/test/axe";
import { SignInPanel } from "./SignInPanel";

vi.mock("next/navigation", () => ({ usePathname: () => "/projects" }));

const both = { google: true, github: true };
const none = { google: false, github: false };

function renderPanel(
  overrides: Partial<React.ComponentProps<typeof SignInPanel>> = {},
) {
  return render(
    <SignInPanel
      providers={both}
      next="/"
      headingLevel="h1"
      titleId="title"
      {...overrides}
    />,
  );
}

describe("SignInPanel", () => {
  it("shows the title, the short line and the small print", () => {
    renderPanel();
    expect(
      screen.getByRole("heading", { name: "Sign in to WhichAI" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Sign in to keep your plans. For now your plans stay in this browser.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/We only receive your name from Google or GitHub/),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute(
      "href",
      "/privacy",
    );
  });

  it("offers both providers as plain links that carry the return path", () => {
    renderPanel({ next: "/projects" });
    expect(
      screen.getByRole("link", { name: "Continue with Google" }),
    ).toHaveAttribute("href", "/api/auth/sign-in/google?next=%2Fprojects");
    expect(
      screen.getByRole("link", { name: "Continue with GitHub" }),
    ).toHaveAttribute("href", "/api/auth/sign-in/github?next=%2Fprojects");
  });

  it("shows only the providers that are set up", () => {
    renderPanel({ providers: { google: false, github: true } });
    expect(
      screen.queryByRole("link", { name: "Continue with Google" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Continue with GitHub" }),
    ).toBeInTheDocument();
  });

  it("says sign-in is not configured instead of showing buttons", () => {
    renderPanel({ providers: none });
    expect(
      screen.getByText("Sign-in is not configured on this server."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Continue with/ })).toBeNull();
  });

  it("shows a friendly error", () => {
    renderPanel({ error: "failed" });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "We couldn't sign you in. Please try again.",
    );
  });

  it("disables both buttons while one is loading", async () => {
    const user = userEvent.setup();
    renderPanel();
    const google = screen.getByRole("link", { name: "Continue with Google" });
    const github = screen.getByRole("link", { name: "Continue with GitHub" });
    // The browser would navigate; jsdom only logs it, so stop the click here.
    google.addEventListener("click", (event) => event.preventDefault());

    await user.click(google);

    expect(google).toHaveAttribute("aria-disabled", "true");
    expect(google).toHaveAttribute("data-loading", "true");
    expect(github).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Opening Google sign-in",
    );
  });

  it("has no serious accessibility violations", async () => {
    const { container } = renderPanel();
    expect(await seriousViolations(container)).toEqual([]);
  });
});

function renderShell(viewer: { name: string; signOutToken: string } | null) {
  return render(
    <AppShell
      news={sampleNews}
      initialTheme="system"
      viewer={viewer}
      providers={both}
    >
      <h1>Page</h1>
    </AppShell>,
  );
}

function signInDialog() {
  return document.querySelector(
    'dialog[aria-labelledby="sign-in-dialog-title"]',
  ) as HTMLDialogElement;
}

describe("sign-in popup", () => {
  it("opens from the sidebar and returns focus to the button on close", async () => {
    const user = userEvent.setup();
    renderShell(null);
    expect(signInDialog()).not.toHaveAttribute("open");

    const [signIn] = screen.getAllByRole("button", { name: "Sign in" });
    await user.click(signIn as HTMLElement);
    expect(signInDialog()).toHaveAttribute("open");

    await user.click(
      within(signInDialog()).getByRole("button", { name: "Close sign-in" }),
    );
    expect(signInDialog()).not.toHaveAttribute("open");
    expect(signIn).toHaveFocus();
  });

  it("closes when the backdrop is clicked", async () => {
    const user = userEvent.setup();
    renderShell(null);
    await user.click(
      screen.getAllByRole("button", { name: "Sign in" })[0] as HTMLElement,
    );

    await user.click(signInDialog());

    expect(signInDialog()).not.toHaveAttribute("open");
  });

  it("returns to the current page after sign-in", async () => {
    const user = userEvent.setup();
    renderShell(null);
    await user.click(
      screen.getAllByRole("button", { name: "Sign in" })[0] as HTMLElement,
    );

    expect(
      within(signInDialog()).getByRole("link", {
        name: "Continue with GitHub",
      }),
    ).toHaveAttribute("href", "/api/auth/sign-in/github?next=%2Fprojects");
  });

  it("has no serious accessibility violations when open", async () => {
    const user = userEvent.setup();
    renderShell(null);
    await user.click(
      screen.getAllByRole("button", { name: "Sign in" })[0] as HTMLElement,
    );

    expect(await seriousViolations(signInDialog())).toEqual([]);
  });
});

describe("account menu", () => {
  const viewer = { name: "Ada Lovelace", signOutToken: "token-123" };

  it("shows initials and the name instead of the Sign in button", () => {
    renderShell(viewer);
    expect(screen.queryByRole("button", { name: "Sign in" })).toBeNull();
    const [account] = screen.getAllByRole("button", { name: /Ada Lovelace/ });
    expect(account).toHaveTextContent("AL");
  });

  it("offers Sign out as a POST form with the CSRF token", async () => {
    const user = userEvent.setup();
    renderShell(viewer);
    const [account] = screen.getAllByRole("button", { name: /Ada Lovelace/ });

    await user.click(account as HTMLElement);

    expect(account).toHaveAttribute("aria-expanded", "true");
    const signOut = screen.getByRole("button", { name: "Sign out" });
    const form = signOut.closest("form") as HTMLFormElement;
    expect(form.method).toBe("post");
    expect(form.getAttribute("action")).toBe("/api/auth/sign-out");
    expect(form.querySelector('input[name="csrf"]')).toHaveValue("token-123");
  });

  it("closes with Escape and returns focus to the button", async () => {
    const user = userEvent.setup();
    renderShell(viewer);
    const [account] = screen.getAllByRole("button", { name: /Ada Lovelace/ });
    await user.click(account as HTMLElement);

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("button", { name: "Sign out" })).toBeNull();
    expect(account).toHaveFocus();
  });
});
