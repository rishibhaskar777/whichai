import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LoginResult } from "@/lib/auth/local-preview";
import { I18nProvider } from "@/lib/i18n/provider";
import { LoginForm } from "./LoginForm";

/*
 * The account service is replaced, so these tests say what the form does with
 * each answer and never wait on hashing or on a clock.
 */
const login = vi.fn<(input: unknown) => Promise<LoginResult>>();

vi.mock("@/components/account/AccountProvider", async () => ({
  ...(await vi.importActual<object>("@/components/account/AccountProvider")),
  useAccount: () => ({ login }),
}));

vi.mock("next/navigation", async () =>
  (await import("@/test/navigation")).navigationMock("/"),
);

beforeEach(() => {
  login.mockReset();
});

function renderForm() {
  render(
    <I18nProvider locale="en">
      <LoginForm
        initialEmail="ada@example.org"
        disabled={false}
        onSignedIn={() => {}}
        onRegister={() => {}}
      />
    </I18nProvider>,
  );
  return {
    user: userEvent.setup(),
    password: () => screen.getByLabelText("Password") as HTMLInputElement,
    submit: () => screen.getByRole("button", { name: /^Log\s?in/ }),
  };
}

async function failOnce(
  form: ReturnType<typeof renderForm>,
  result: LoginResult,
  typed = "wrong password",
) {
  login.mockResolvedValueOnce(result);
  await form.user.type(form.password(), typed);
  await form.user.click(form.submit());
}

/** Lets every pending promise, timer and animation frame run. */
async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    await Promise.resolve();
  });
}

describe("a failed login", () => {
  it("shows one message and leaves the password field empty", async () => {
    const form = renderForm();

    await failOnce(form, { ok: false, reason: "invalid" });

    expect(
      await screen.findByText("Email or password is incorrect."),
    ).toBeInTheDocument();
    expect(form.password()).toHaveValue("");
  });

  it("says how long to wait when the service has locked the account", async () => {
    const form = renderForm();

    await failOnce(form, {
      ok: false,
      reason: "locked",
      retryAfterSeconds: 30,
    });

    expect(
      await screen.findByText("Too many attempts. Try again in 30 seconds."),
    ).toBeInTheDocument();
    expect(form.password()).toHaveValue("");
  });

  it("keeps the same password input element through a failed attempt", async () => {
    const form = renderForm();
    const input = form.password();
    const forgot = screen.getByRole("button", { name: "Forgot password?" });
    await form.user.click(forgot);

    await failOnce(form, { ok: false, reason: "invalid" });
    await screen.findByText("Email or password is incorrect.");
    await form.user.type(form.password(), "again");
    await flush();

    expect(form.password()).toBe(input);
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("again");
  });

  it("keeps the next password that is typed", async () => {
    const form = renderForm();
    await failOnce(form, { ok: false, reason: "invalid" });
    await screen.findByText("Email or password is incorrect.");

    await form.user.type(form.password(), "second try");

    // This is the value the next click will send.
    expect(form.password()).toHaveValue("second try");
    login.mockResolvedValueOnce({ ok: false, reason: "invalid" });
    await form.user.click(form.submit());
    expect(login).toHaveBeenLastCalledWith({
      email: "ada@example.org",
      password: "second try",
    });
  });

  it("never clears a password typed after the failure, however long it waits", async () => {
    const form = renderForm();
    await failOnce(form, { ok: false, reason: "invalid" });
    await screen.findByText("Email or password is incorrect.");

    await form.user.type(form.password(), "typed afterwards");
    await flush();
    await flush();

    expect(form.password()).toHaveValue("typed afterwards");
    expect(screen.queryByText("Enter your password.")).toBeNull();
  });

  it("ignores a second submit while one is still running", async () => {
    const form = renderForm();
    let finish!: (result: LoginResult) => void;
    login.mockReturnValueOnce(
      new Promise<LoginResult>((resolve) => {
        finish = resolve;
      }),
    );
    await form.user.type(form.password(), "wrong password");

    await form.user.click(form.submit());
    await form.user.keyboard("{Enter}");
    expect(login).toHaveBeenCalledTimes(1);

    await act(async () => finish({ ok: false, reason: "invalid" }));
    expect(
      await screen.findByText("Email or password is incorrect."),
    ).toBeTruthy();
  });
});
