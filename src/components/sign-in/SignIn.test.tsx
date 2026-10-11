import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/app-shell/AppShell";
import { getPasswordIterations } from "@/lib/auth/password-hash";
import { panelNewsFixture } from "@/test/news";
import type { Viewer } from "@/lib/auth/get-session";
import { seriousViolations } from "@/test/axe";
import { AppProviders } from "@/test/wrappers";
import { SignInPanel } from "./SignInPanel";

vi.mock("next/navigation", async () =>
  (await import("@/test/navigation")).navigationMock("/projects"),
);

const both = { google: true, github: true };
const none = { google: false, github: false };

const PASSWORD = "violet lantern ocean";
const ACCOUNT_KEY = "whichai:preview-accounts";
/* A slow CI runner needs more than the 1 second findBy default. */
const SLOW = 10_000;

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function renderPanel(
  overrides: Partial<React.ComponentProps<typeof SignInPanel>> = {},
) {
  return render(
    <AppProviders>
      <div data-testid="host">
        <SignInPanel
          providers={both}
          next="/"
          headingLevel="h1"
          titleId="title"
          {...overrides}
        />
      </div>
    </AppProviders>,
  );
}

const host = () => within(screen.getByTestId("host"));

function renderShell(viewer: Viewer | null = null) {
  return render(
    <AppShell
      news={panelNewsFixture}
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

async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  const [signIn] = screen.getAllByRole("button", { name: "Sign in" });
  await user.click(signIn as HTMLElement);
  return within(signInDialog());
}

type View = ReturnType<typeof within>;

/*
 * Hashing is fast in tests, so the busy state would be over before it could be
 * looked at. A gate holds every derivation while closed. Closing it before a
 * click makes "Logging in…" observable on any machine, which also proves that
 * the attempt really started, whatever message was left on screen before it.
 */
function hashingGate() {
  const derive = crypto.subtle.deriveBits.bind(crypto.subtle);
  let open = true;
  let waiting: (() => void)[] = [];
  vi.spyOn(crypto.subtle, "deriveBits").mockImplementation(
    async (...args: Parameters<typeof derive>) => {
      if (!open) await new Promise<void>((resolve) => waiting.push(resolve));
      return derive(...args);
    },
  );
  return {
    close() {
      open = false;
    },
    release() {
      open = true;
      for (const resume of waiting) resume();
      waiting = [];
    },
  };
}

/** Waits until a login attempt has really finished, not just until some text shows. */
async function attemptFinished(view: View, message: string) {
  await waitFor(
    () => {
      expect(view.getByRole("button", { name: "Log in" })).toBeEnabled();
      expect(view.getByText(message)).toBeInTheDocument();
      expect(view.getByLabelText("Password")).toHaveValue("");
    },
    { timeout: SLOW },
  );
}

async function register(
  user: ReturnType<typeof userEvent.setup>,
  view: View,
  details: { email?: string; password?: string } = {},
) {
  await user.type(
    view.getByLabelText("Email"),
    details.email ?? "ada@example.org",
  );
  await user.type(
    view.getByLabelText("Password"),
    details.password ?? PASSWORD,
  );
  await user.type(view.getByLabelText("First name"), "Ada");
  await user.type(view.getByLabelText("Last name"), "Lovelace");
  await user.click(view.getByRole("checkbox"));
  await user.click(view.getByRole("button", { name: "Register now" }));
}

async function createAccountAndReturnToLogin(
  user: ReturnType<typeof userEvent.setup>,
  view: View,
) {
  await user.click(view.getByRole("button", { name: "Register" }));
  await register(user, view);
  await view.findByText("Account created. Log in to continue.", undefined, {
    timeout: SLOW,
  });
}

describe("login view", () => {
  it("shows the title, Google, an or divider, the fields and the footer", () => {
    renderPanel();
    const view = host();

    expect(
      view.getByRole("heading", { level: 1, name: "Log in to WhichAI" }),
    ).toBeInTheDocument();
    expect(
      view.getByRole("link", { name: "Continue with Google" }),
    ).toHaveAttribute("href", "/api/auth/sign-in/google?next=%2F");
    expect(view.getByText("or")).toBeInTheDocument();
    expect(view.getByLabelText("Email")).toHaveAttribute("type", "email");
    expect(view.getByLabelText("Email")).toHaveAttribute(
      "autocomplete",
      "email",
    );
    expect(view.getByLabelText("Password")).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
    expect(
      view.getByRole("button", { name: "Forgot password?" }),
    ).toBeInTheDocument();
    expect(view.getByRole("button", { name: "Log in" })).toBeInTheDocument();
    expect(view.getByText(/New to WhichAI\?/)).toBeInTheDocument();
    expect(
      view.getByRole("button", { name: "Continue without signing in" }),
    ).toBeInTheDocument();
    expect(
      view.getByText("Accounts are saved only in this browser for now."),
    ).toBeInTheDocument();
  });

  it("no longer offers GitHub, Microsoft, Apple, email or phone", () => {
    renderPanel();

    for (const name of [
      /GitHub/,
      /Microsoft/,
      /Apple/,
      /Continue with email/,
      /phone/i,
    ]) {
      expect(host().queryByRole("link", { name })).toBeNull();
      expect(host().queryByRole("button", { name })).toBeNull();
    }
  });

  it("keeps Google's behaviour: a link when configured, a notice when not", async () => {
    const user = userEvent.setup();
    const { unmount } = renderPanel({ providers: both, next: "/projects" });
    expect(
      host().getByRole("link", { name: "Continue with Google" }),
    ).toHaveAttribute("href", "/api/auth/sign-in/google?next=%2Fprojects");
    unmount();

    renderPanel({ providers: none });
    expect(host().queryByRole("link", { name: /Google/ })).toBeNull();
    await user.click(
      host().getByRole("button", { name: "Continue with Google" }),
    );
    expect(
      host().getByText("Google sign-in is coming in an upcoming update."),
    ).toBeInTheDocument();
  });

  it("disables Google and the Log in button while Google is opening", async () => {
    const user = userEvent.setup();
    renderPanel();
    const google = host().getByRole("link", { name: "Continue with Google" });
    // The browser would navigate; jsdom only logs it, so stop the click here.
    google.addEventListener("click", (event) => event.preventDefault());

    await user.click(google);

    expect(google).toHaveAttribute("aria-disabled", "true");
    expect(google).toHaveAttribute("data-loading", "true");
    expect(host().getByRole("button", { name: "Log in" })).toBeDisabled();
    expect(host().getByText("Opening Google sign-in")).toBeInTheDocument();
  });

  it("shows a friendly sign-in error from the server, but not a setup error", () => {
    const { unmount } = renderPanel({ error: "failed" });
    expect(host().getByRole("alert")).toHaveTextContent(
      "We couldn't sign you in. Please try again.",
    );
    unmount();

    renderPanel({ error: "not-configured" });
    expect(host().queryByRole("alert")).toBeNull();
  });

  it("reveals and hides the password with a labelled button", async () => {
    const user = userEvent.setup();
    renderPanel();
    const password = host().getByLabelText("Password");
    expect(password).toHaveAttribute("type", "password");

    await user.click(host().getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");

    await user.click(host().getByRole("button", { name: "Hide password" }));
    expect(password).toHaveAttribute("type", "password");
  });

  it("explains that password reset is coming", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(host().getByRole("button", { name: "Forgot password?" }));

    expect(
      host().getByText(
        "Password reset arrives with accounts in an upcoming update.",
      ),
    ).toBeInTheDocument();
  });

  it("explains each empty field and focuses the summary", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(host().getByRole("button", { name: "Log in" }));

    const summary = host().getByRole("alert");
    await waitFor(() => expect(summary).toHaveFocus());
    expect(
      within(summary).getByRole("link", { name: "Email" }),
    ).toBeInTheDocument();
    expect(
      within(summary).getByRole("link", { name: "Password" }),
    ).toBeInTheDocument();
    const email = host().getByLabelText("Email");
    expect(email).toHaveAttribute("aria-invalid", "true");
    const describedBy = email.getAttribute("aria-describedby") as string;
    expect(document.getElementById(describedBy)).toHaveTextContent(
      "Enter your email address.",
    );
  });

  it("moves focus to a field when its summary link is chosen", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(host().getByRole("button", { name: "Log in" }));

    await user.click(host().getByRole("link", { name: "Password" }));

    expect(host().getByLabelText("Password")).toHaveFocus();
  });

  it("rejects an invalid email before anything is checked", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.type(host().getByLabelText("Email"), "not-an-email");
    await user.type(host().getByLabelText("Password"), "whatever1");

    await user.click(host().getByRole("button", { name: "Log in" }));

    expect(
      host().getAllByText("Enter a valid email address, like name@example.com.")
        .length,
    ).toBeGreaterThan(0);
  });
});

describe("register view", () => {
  async function openRegister() {
    const user = userEvent.setup();
    renderPanel();
    await user.click(host().getByRole("button", { name: "Register" }));
    return user;
  }

  it("shows every field with the right autocomplete values", async () => {
    await openRegister();
    const view = host();

    expect(
      view.getByRole("heading", { name: "Create your WhichAI account" }),
    ).toBeInTheDocument();
    expect(
      view.getByRole("link", { name: "Register with Google" }),
    ).toBeInTheDocument();
    expect(view.getByText("or")).toBeInTheDocument();
    expect(view.getByLabelText("Email")).toHaveAttribute(
      "autocomplete",
      "email",
    );
    expect(view.getByLabelText("Password")).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
    expect(view.getByLabelText("First name")).toHaveAttribute(
      "autocomplete",
      "given-name",
    );
    expect(view.getByLabelText("Last name")).toHaveAttribute(
      "autocomplete",
      "family-name",
    );
    expect(view.getByText(/Already on WhichAI\?/)).toBeInTheDocument();
    expect(
      view.getByText("Accounts are saved only in this browser for now."),
    ).toBeInTheDocument();
  });

  it("links the Terms and Privacy Policy, each in a new tab", async () => {
    await openRegister();

    const terms = host().getByRole("link", { name: /Terms of Service/ });
    const privacy = host().getByRole("link", { name: /Privacy Policy/ });
    expect(terms).toHaveAttribute("href", "/terms");
    expect(privacy).toHaveAttribute("href", "/privacy");
    for (const link of [terms, privacy]) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  it("keeps Register disabled until the terms are ticked", async () => {
    const user = await openRegister();
    const submit = host().getByRole("button", { name: "Register now" });
    expect(submit).toBeDisabled();

    await user.click(host().getByRole("checkbox"));
    expect(submit).toBeEnabled();

    await user.click(host().getByRole("checkbox"));
    expect(submit).toBeDisabled();
  });

  it("updates the password hint as you type", async () => {
    const user = await openRegister();
    const password = host().getByLabelText("Password");
    expect(
      host().getByText("At least 8 characters, up to 128. No symbol rules."),
    ).toBeInTheDocument();

    await user.type(password, "abc");
    expect(
      host().getByText(/5 more needed\. Up to 128 characters/),
    ).toBeInTheDocument();

    await user.type(password, "defghij");
    expect(
      host().getByText("Long enough. Up to 128 characters."),
    ).toBeInTheDocument();
  });

  it("lists every problem in a summary and ties each to its field", async () => {
    const user = await openRegister();
    await user.type(host().getByLabelText("Email"), "ada@example.org");
    await user.type(host().getByLabelText("Password"), "short");
    await user.type(host().getByLabelText("First name"), "Ada1");
    await user.click(host().getByRole("checkbox"));

    await user.click(host().getByRole("button", { name: "Register now" }));

    const summary = host().getByRole("alert");
    await waitFor(() => expect(summary).toHaveFocus());
    for (const name of ["Password", "First name", "Last name"]) {
      expect(within(summary).getByRole("link", { name })).toBeInTheDocument();
    }
    expect(within(summary).queryByRole("link", { name: "Email" })).toBeNull();
    const password = host().getByLabelText("Password");
    expect(password).toHaveAttribute("aria-invalid", "true");
    const ids = (password.getAttribute("aria-describedby") ?? "").split(" ");
    expect(
      ids.map((id) => document.getElementById(id)?.textContent).join(" "),
    ).toContain("Use at least 8 characters.");
  });

  it("rejects a common password", async () => {
    const user = await openRegister();
    await register(user, host(), { password: "Password123" });

    expect(
      await host().findByText(
        "That password is too common. Choose a different one.",
      ),
    ).toBeInTheDocument();
  });

  it("accepts a Hindi name", async () => {
    const user = await openRegister();
    await user.type(host().getByLabelText("Email"), "rishi@example.org");
    await user.type(host().getByLabelText("Password"), PASSWORD);
    await user.type(host().getByLabelText("First name"), "ऋषि");
    await user.type(host().getByLabelText("Last name"), "भास्कर");
    await user.click(host().getByRole("checkbox"));

    await user.click(host().getByRole("button", { name: "Register now" }));

    expect(
      await host().findByText("Account created. Log in to continue."),
    ).toBeInTheDocument();
  });
});

describe("dialog polish", () => {
  it.each([
    ["login", "Log in to WhichAI", "Welcome back. Pick up where you left off."],
    [
      "register",
      "Create your WhichAI account",
      "Free forever. No card needed.",
    ],
  ])(
    "centres a header of logo mark, title and subtitle in the %s view",
    async (view, title, subtitle) => {
      const user = userEvent.setup();
      renderPanel();
      if (view === "register") {
        await user.click(host().getByRole("button", { name: "Register" }));
      }

      const heading = host().getByRole("heading", { name: title });
      const header = heading.parentElement as HTMLElement;
      expect(header.className).toMatch(/header/);
      const parts = Array.from(header.children);
      expect(parts).toHaveLength(3);
      expect(parts[0]?.querySelector("svg")).not.toBeNull();
      expect(parts[0]).toHaveAttribute("aria-hidden", "true");
      expect(parts[1]).toBe(heading);
      expect(parts[2]).toHaveTextContent(subtitle);
    },
  );

  it.each(["login", "register"])(
    'draws a line on both sides of a centred "or" in the %s view',
    async (view) => {
      const user = userEvent.setup();
      renderPanel();
      if (view === "register") {
        await user.click(host().getByRole("button", { name: "Register" }));
      }

      const divider = host().getByText("or").parentElement as HTMLElement;
      const parts = Array.from(divider.children);
      expect(parts).toHaveLength(3);
      expect(parts[0]?.className).toMatch(/rule/);
      expect(parts[1]).toHaveTextContent("or");
      expect(parts[2]?.className).toMatch(/rule/);
    },
  );

  it("shows the placeholders and focuses the email field", async () => {
    const user = userEvent.setup();
    renderPanel();
    expect(host().getByLabelText("Email")).toHaveAttribute(
      "placeholder",
      "you@example.com",
    );
    expect(host().getByLabelText("Password")).toHaveAttribute(
      "placeholder",
      "Your password",
    );
    expect(host().getByLabelText("Email")).toHaveFocus();

    await user.click(host().getByRole("button", { name: "Register" }));
    expect(host().getByLabelText("Password")).toHaveAttribute(
      "placeholder",
      "At least 8 characters",
    );
  });

  it("focuses the email field when the popup opens", async () => {
    const user = userEvent.setup();
    renderShell();
    const view = await openDialog(user);

    expect(view.getByLabelText("Email")).toHaveFocus();
  });

  it("warns that Caps Lock is on, and stops when it is off or the field is left", async () => {
    const user = userEvent.setup();
    renderPanel();
    const password = host().getByLabelText("Password");
    await user.click(password);
    expect(host().queryByText("Caps Lock is on")).toBeNull();

    fireEvent.keyDown(password, { key: "a", modifierCapsLock: true });
    expect(host().getByText("Caps Lock is on")).toBeInTheDocument();

    fireEvent.keyUp(password, { key: "a", modifierCapsLock: false });
    expect(host().queryByText("Caps Lock is on")).toBeNull();

    fireEvent.keyDown(password, { key: "a", modifierCapsLock: true });
    fireEvent.blur(password);
    expect(host().queryByText("Caps Lock is on")).toBeNull();
  });

  it("shows the Caps Lock hint on the register password too", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(host().getByRole("button", { name: "Register" }));

    fireEvent.keyDown(host().getByLabelText("Password"), {
      key: "a",
      modifierCapsLock: true,
    });

    expect(host().getByText("Caps Lock is on")).toBeInTheDocument();
  });

  it("shows a spinner and Logging in… while the login is busy", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.type(host().getByLabelText("Email"), "nobody@example.org");
    await user.type(host().getByLabelText("Password"), PASSWORD);
    const gate = hashingGate();
    gate.close();

    await user.click(host().getByRole("button", { name: "Log in" }));

    const busy = host().getByRole("button", { name: "Logging in…" });
    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute("data-loading", "true");

    gate.release();
    await waitFor(() =>
      expect(host().getByRole("button", { name: "Log in" })).toBeEnabled(),
    );
  }, 20_000);

  it("shows Creating account… while registering", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(host().getByRole("button", { name: "Register" }));
    const gate = hashingGate();
    gate.close();

    await register(user, host(), { email: "busy@example.org" });

    expect(
      host().getByRole("button", { name: "Creating account…" }),
    ).toBeDisabled();

    gate.release();
    await host().findByText("Account created. Log in to continue.");
  }, 20_000);

  it("ends the login view with the Preview badge, Continue without signing in and its limit", () => {
    renderPanel();

    expect(host().getByText("Preview")).toBeInTheDocument();
    const guest = host().getByRole("button", {
      name: "Continue without signing in",
    });
    expect(guest.nextElementSibling).toHaveTextContent(
      "Limited to 5 plans a day",
    );
    const all = Array.from(
      screen.getByTestId("host").querySelectorAll("button"),
    );
    expect(all[all.length - 1]).toBe(guest);
  });

  it("keeps the same footer note but no guest link in the register view", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(host().getByRole("button", { name: "Register" }));

    expect(host().getByText("Preview")).toBeInTheDocument();
    expect(
      host().queryByRole("button", { name: "Continue without signing in" }),
    ).toBeNull();
  });

  it("styles Forgot password? as a small link-like button", () => {
    renderPanel();
    expect(
      host().getByRole("button", { name: "Forgot password?" }).className,
    ).toMatch(/forgot/);
  });
});

describe("switching views", () => {
  it("moves between login and register and puts focus on the new title", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(host().getByRole("button", { name: "Register" }));
    const registerTitle = host().getByRole("heading", {
      name: "Create your WhichAI account",
    });
    expect(registerTitle).toHaveFocus();
    expect(
      host().queryByRole("heading", { name: "Log in to WhichAI" }),
    ).toBeNull();

    await user.click(host().getByRole("button", { name: "Log in" }));
    expect(
      host().getByRole("heading", { name: "Log in to WhichAI" }),
    ).toHaveFocus();
  });

  describe("height animation", () => {
    function stubHeights() {
      vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(
        function (this: HTMLElement) {
          return this.textContent?.includes("Create your WhichAI account")
            ? 560
            : 380;
        },
      );
    }

    it("animates the height and fades the new view in", async () => {
      stubHeights();
      const user = userEvent.setup();
      const { container } = renderPanel();

      await user.click(host().getByRole("button", { name: "Register" }));

      const viewport = container.querySelector(
        '[class*="viewport"]',
      ) as HTMLElement;
      expect(viewport.style.height).toBe("560px");
      expect(container.querySelector('[data-fade="true"]')).not.toBeNull();
    });

    it("does not animate under reduced motion", async () => {
      stubHeights();
      vi.stubGlobal("matchMedia", (query: string) => ({
        matches: query.includes("prefers-reduced-motion"),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
        onchange: null,
      }));
      const user = userEvent.setup();
      const { container } = renderPanel();

      await user.click(host().getByRole("button", { name: "Register" }));

      const viewport = container.querySelector(
        '[class*="viewport"]',
      ) as HTMLElement;
      expect(viewport.style.height).toBe("");
      expect(
        host().getByRole("heading", { name: "Create your WhichAI account" }),
      ).toHaveFocus();
    });
  });
});

describe("accounts in the popup", () => {
  it("registers, shows the success message, prefills the email and does not log in", async () => {
    const user = userEvent.setup();
    renderShell();
    const view = await openDialog(user);

    await createAccountAndReturnToLogin(user, view);

    expect(
      view.getByRole("heading", { name: "Log in to WhichAI" }),
    ).toBeInTheDocument();
    expect(view.getByLabelText("Email")).toHaveValue("ada@example.org");
    expect(signInDialog()).toHaveAttribute("open");
    expect(
      screen.queryByRole("button", { name: /Ada/ }),
    ).not.toBeInTheDocument();
  }, 20_000);

  it("logs in with the same details, closes, and shows the first name and Free plan", async () => {
    const user = userEvent.setup();
    renderShell();
    const view = await openDialog(user);
    await createAccountAndReturnToLogin(user, view);

    await user.type(view.getByLabelText("Password"), PASSWORD);
    await user.click(view.getByRole("button", { name: "Log in" }));

    await waitFor(() => expect(signInDialog()).not.toHaveAttribute("open"));
    const [account] = await screen.findAllByRole("button", { name: /Ada/ });
    expect(account).toHaveTextContent("AL");
    expect(account).toHaveTextContent("Free plan");
    expect(account).not.toHaveTextContent("Lovelace");
  }, 20_000);

  it("gives one generic message for a wrong password", async () => {
    const user = userEvent.setup();
    renderShell();
    const view = await openDialog(user);
    await createAccountAndReturnToLogin(user, view);

    await user.type(view.getByLabelText("Password"), "not the password");
    await user.click(view.getByRole("button", { name: "Log in" }));

    await attemptFinished(view, "Email or password is incorrect.");
  }, 20_000);

  it("gives the same message for an email that has no account", async () => {
    const user = userEvent.setup();
    renderShell();
    const view = await openDialog(user);
    await user.type(view.getByLabelText("Email"), "nobody@example.org");
    await user.type(view.getByLabelText("Password"), PASSWORD);

    await user.click(view.getByRole("button", { name: "Log in" }));

    await attemptFinished(view, "Email or password is incorrect.");
  }, 20_000);

  it("makes the person wait after five failed attempts, then lets them try again", async () => {
    const user = userEvent.setup();
    renderShell();
    const view = await openDialog(user);
    await user.type(view.getByLabelText("Email"), "nobody@example.org");
    const gate = hashingGate();
    const wrong = "Email or password is incorrect.";

    async function attempt(message: string, hashes: boolean) {
      if (hashes) gate.close();
      await user.type(view.getByLabelText("Password"), "wrong password");
      await user.click(view.getByRole("button", { name: "Log in" }));
      if (hashes) {
        // Busy proves this attempt began, and its predecessor's message is gone.
        await view.findByRole(
          "button",
          { name: "Logging in…" },
          { timeout: SLOW },
        );
        expect(view.queryByText(message)).toBeNull();
        gate.release();
      }
      await attemptFinished(view, message);
    }

    for (let count = 0; count < 5; count += 1) await attempt(wrong, true);
    // The lockout answers without hashing.
    await attempt("Too many attempts. Try again in 30 seconds.", false);

    // Only the clock moves; nobody waits half a minute.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.now() + 31_000);
    await attempt(wrong, true);
  }, 60_000);

  it("refuses a second account with the same email", async () => {
    const user = userEvent.setup();
    renderShell();
    const view = await openDialog(user);
    await createAccountAndReturnToLogin(user, view);

    await user.click(view.getByRole("button", { name: "Register" }));
    await register(user, view, { email: "ADA@example.org" });

    expect(
      await view.findByText(
        "An account with this email already exists in this browser. Log in instead.",
        undefined,
        { timeout: SLOW },
      ),
    ).toBeInTheDocument();
  }, 20_000);

  it("stores a hash and never the password or the email in plain view of the session", async () => {
    const user = userEvent.setup();
    renderShell();
    const view = await openDialog(user);
    await createAccountAndReturnToLogin(user, view);

    const stored = window.localStorage.getItem(ACCOUNT_KEY) as string;
    expect(stored).not.toContain(PASSWORD);
    expect(stored).toContain("PBKDF2-SHA-256");
    expect(stored).toContain(String(getPasswordIterations()));
  }, 20_000);

  it("never logs the email or password", async () => {
    const spies = (["log", "info", "warn", "error", "debug"] as const).map(
      (method) => vi.spyOn(console, method).mockImplementation(() => {}),
    );
    const user = userEvent.setup();
    renderShell();
    const view = await openDialog(user);
    await createAccountAndReturnToLogin(user, view);

    for (const spy of spies) {
      expect(JSON.stringify(spy.mock.calls)).not.toContain(PASSWORD);
      expect(JSON.stringify(spy.mock.calls)).not.toContain("ada@example.org");
    }
  }, 20_000);

  it("makes no network request from the forms", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderShell();
    const view = await openDialog(user);

    await createAccountAndReturnToLogin(user, view);

    expect(fetchMock).not.toHaveBeenCalled();
  }, 20_000);

  it("logs out and keeps the account", async () => {
    const user = userEvent.setup();
    renderShell();
    const view = await openDialog(user);
    await createAccountAndReturnToLogin(user, view);
    await user.type(view.getByLabelText("Password"), PASSWORD);
    await user.click(view.getByRole("button", { name: "Log in" }));
    const [account] = await screen.findAllByRole("button", { name: /Ada/ });

    await user.click(account as HTMLElement);
    await user.click(screen.getByRole("menuitem", { name: "Sign out" }));

    await waitFor(() =>
      expect(
        screen.getAllByRole("button", { name: "Sign in" }).length,
      ).toBeGreaterThan(0),
    );
    expect(window.localStorage.getItem(ACCOUNT_KEY)).toContain(
      "ada@example.org",
    );
  }, 20_000);
});

describe("guest", () => {
  it("Continue without signing in makes a guest profile, closes and shows Guest", async () => {
    const user = userEvent.setup();
    renderShell();
    const view = await openDialog(user);

    await user.click(
      view.getByRole("button", { name: "Continue without signing in" }),
    );

    await waitFor(() => expect(signInDialog()).not.toHaveAttribute("open"));
    const [guest] = await screen.findAllByRole("button", { name: /Guest/ });
    expect(guest).toHaveTextContent("5 plans a day");
    expect(guest).not.toHaveTextContent("Free plan");
    const profile = JSON.parse(
      window.localStorage.getItem("whichai:preview-guest") as string,
    ) as Record<string, unknown>;
    expect(Object.keys(profile).sort()).toEqual(["createdAt", "id"]);
  });

  it("offers Sign in from the guest menu", async () => {
    const user = userEvent.setup();
    renderShell();
    const view = await openDialog(user);
    await user.click(
      view.getByRole("button", { name: "Continue without signing in" }),
    );
    const [guest] = await screen.findAllByRole("button", { name: /Guest/ });

    await user.click(guest as HTMLElement);
    await user.click(screen.getByRole("menuitem", { name: "Sign in" }));

    expect(signInDialog()).toHaveAttribute("open");
  });
});

describe("popup", () => {
  it("opens from the sidebar and returns focus to the button on close", async () => {
    const user = userEvent.setup();
    renderShell();
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
    renderShell();
    await user.click(
      screen.getAllByRole("button", { name: "Sign in" })[0] as HTMLElement,
    );

    await user.click(signInDialog());

    expect(signInDialog()).not.toHaveAttribute("open");
  });

  it("returns to the current page after Google sign-in", async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(
      screen.getAllByRole("button", { name: "Sign in" })[0] as HTMLElement,
    );

    expect(
      within(signInDialog()).getByRole("link", {
        name: "Continue with Google",
      }),
    ).toHaveAttribute("href", "/api/auth/sign-in/google?next=%2Fprojects");
  });

  it.each([
    ["login", "Log in to WhichAI"],
    ["register", "Create your WhichAI account"],
  ])(
    "opens in the %s view for ?auth=%s and cleans the address",
    async (view, title) => {
      window.history.replaceState(null, "", `/?auth=${view}&keep=1#top`);
      renderShell();

      await waitFor(() => expect(signInDialog()).toHaveAttribute("open"));
      expect(
        within(signInDialog()).getByRole("heading", { name: title }),
      ).toBeInTheDocument();
      expect(window.location.search).toBe("?keep=1");
      expect(window.location.hash).toBe("#top");
    },
  );

  it("ignores an unknown ?auth value", () => {
    window.history.replaceState(null, "", "/?auth=admin");
    renderShell();

    expect(signInDialog()).not.toHaveAttribute("open");
    expect(window.location.search).toBe("?auth=admin");
  });

  it("has no serious accessibility violations in the login view", async () => {
    const user = userEvent.setup();
    renderShell();
    await openDialog(user);

    expect(await seriousViolations(signInDialog())).toEqual([]);
  });

  it("has no serious accessibility violations in the register view", async () => {
    const user = userEvent.setup();
    renderShell();
    const view = await openDialog(user);
    await user.click(view.getByRole("button", { name: "Register" }));

    expect(await seriousViolations(signInDialog())).toEqual([]);
  });

  it("has no serious accessibility violations with errors showing", async () => {
    const user = userEvent.setup();
    renderShell();
    const view = await openDialog(user);
    await user.click(view.getByRole("button", { name: "Register" }));
    await user.click(view.getByRole("checkbox"));
    await user.click(view.getByRole("button", { name: "Register now" }));
    await view.findByRole("alert");

    expect(await seriousViolations(signInDialog())).toEqual([]);
  });
});

describe("account menu for a Google sign-in", () => {
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
    const signOut = screen.getByRole("menuitem", { name: "Sign out" });
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

    expect(screen.queryByRole("menuitem", { name: "Sign out" })).toBeNull();
    expect(account).toHaveFocus();
  });
});
