import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/app-shell/AppShell";
import { sampleNews } from "@/data/sample/news";
import type { Viewer } from "@/lib/auth/get-session";
import { seriousViolations } from "@/test/axe";
import { SignInPanel } from "./SignInPanel";

vi.mock("next/navigation", async () =>
  (await import("@/test/navigation")).navigationMock("/projects"),
);

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

  it("always lists every option in order, with an or divider", () => {
    renderPanel({ providers: none });
    const labels = [...document.querySelectorAll("a, button")]
      .map((element) => element.textContent)
      .filter((text) => text?.startsWith("Continue with "));
    expect(labels).toEqual([
      "Continue with Google",
      "Continue with GitHub",
      "Continue with Microsoft",
      "Continue with Apple",
      "Continue with email",
      "Continue with phone number",
    ]);
    expect(screen.getByText("or")).toBeInTheDocument();
  });

  it("never shows a configuration error in the popup", () => {
    renderPanel({ providers: none, error: "not-configured" });
    expect(screen.queryByText(/not configured/i)).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows coming soon for Google and GitHub when they are not configured", async () => {
    const user = userEvent.setup();
    renderPanel({ providers: none });
    expect(
      screen.queryByRole("link", { name: /Continue with (Google|GitHub)/ }),
    ).toBeNull();

    await user.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );
    expect(
      screen.getByText("Google sign-in is coming in an upcoming update."),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Continue with GitHub" }),
    );
    expect(
      screen.getByText("GitHub sign-in is coming in an upcoming update."),
    ).toBeInTheDocument();
  });

  it("starts OAuth for Google and GitHub when they are configured", () => {
    renderPanel({ providers: both });
    expect(
      screen.getByRole("link", { name: "Continue with Google" }),
    ).toHaveAttribute("href", "/api/auth/sign-in/google?next=%2F");
    expect(
      screen.getByRole("link", { name: "Continue with GitHub" }),
    ).toHaveAttribute("href", "/api/auth/sign-in/github?next=%2F");
  });

  it.each([
    [
      "Continue with Microsoft",
      "Microsoft sign-in is coming in an upcoming update.",
    ],
    ["Continue with Apple", "Apple sign-in is coming in an upcoming update."],
    ["Continue with email", "Email sign-in is coming in an upcoming update."],
    [
      "Continue with phone number",
      "Phone number sign-in is coming in an upcoming update.",
    ],
  ])(
    "%s shows its message and makes no network request",
    async (name, message) => {
      const user = userEvent.setup();
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      renderPanel();

      await user.click(screen.getByRole("button", { name }));

      expect(screen.getByText(message)).toBeInTheDocument();
      expect(fetchMock).not.toHaveBeenCalled();
      expect(document.querySelector("input")).toBeNull();
      vi.unstubAllGlobals();
    },
  );

  it("announces the message politely and replaces the previous one", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(
      screen.getByRole("button", { name: "Continue with Microsoft" }),
    );
    const live = screen
      .getByText(/Microsoft sign-in is coming/)
      .closest("[aria-live]");
    expect(live).toHaveAttribute("aria-live", "polite");

    await user.click(
      screen.getByRole("button", { name: "Continue with Apple" }),
    );
    expect(screen.queryByText(/Microsoft sign-in is coming/)).toBeNull();
    expect(screen.getAllByText(/is coming in an upcoming update/)).toHaveLength(
      1,
    );
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
    expect(
      screen.getByRole("button", { name: "Continue with Microsoft" }),
    ).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("Opening Google sign-in")).toBeInTheDocument();
  });

  it("has no serious accessibility violations", async () => {
    const { container } = renderPanel();
    expect(await seriousViolations(container)).toEqual([]);
  });
});

function renderShell(viewer: Viewer | null) {
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

  it("Continue without signing in closes the popup and returns focus", async () => {
    const user = userEvent.setup();
    renderShell(null);
    const [signIn] = screen.getAllByRole("button", { name: "Sign in" });
    await user.click(signIn as HTMLElement);

    await user.click(
      within(signInDialog()).getByRole("button", {
        name: "Continue without signing in",
      }),
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
  const viewer: Viewer = {
    name: "Ada Lovelace",
    provider: "github",
    signOutToken: "token-123",
  };

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
