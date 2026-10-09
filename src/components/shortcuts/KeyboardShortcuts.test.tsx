import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useNewPlanSignal } from "@/lib/new-plan-signal";
import { router } from "@/test/navigation";
import { seriousViolations } from "@/test/axe";
import { AppProviders } from "@/test/wrappers";
import { KeyboardShortcuts, isTypingTarget } from "./KeyboardShortcuts";

const pathname = vi.hoisted(() => ({ current: "/" }));

vi.mock("next/navigation", async () => {
  const { navigationMock } = await import("@/test/navigation");
  return {
    ...navigationMock("/"),
    usePathname: () => pathname.current,
  };
});

function NewPlanCount() {
  return <p data-testid="count">{useNewPlanSignal().count}</p>;
}

function renderShortcuts({ withSearch = true } = {}) {
  return render(
    <AppProviders>
      <KeyboardShortcuts />
      <NewPlanCount />
      {withSearch ? <textarea id="goal" aria-label="Goal" /> : null}
      <input aria-label="Other field" />
      <button type="button">A button</button>
    </AppProviders>,
  );
}

function dialog() {
  return document.querySelector("dialog") as HTMLDialogElement;
}

beforeEach(() => {
  pathname.current = "/";
});

describe("keyboard shortcuts", () => {
  it("/ focuses the search", async () => {
    const user = userEvent.setup();
    renderShortcuts();

    await user.keyboard("/");

    expect(screen.getByLabelText("Goal")).toHaveFocus();
    expect(screen.getByLabelText("Goal")).toHaveValue("");
  });

  it("/ goes home and starts fresh when the search is not on the page", async () => {
    pathname.current = "/projects";
    const user = userEvent.setup();
    renderShortcuts({ withSearch: false });

    await user.keyboard("/");

    expect(router.push).toHaveBeenCalledWith("/");
    expect(screen.getByTestId("count")).toHaveTextContent("1");
  });

  it("Ctrl+Shift+O starts a new plan", async () => {
    const user = userEvent.setup();
    renderShortcuts();

    await user.keyboard("{Control>}{Shift>}o{/Shift}{/Control}");

    expect(screen.getByTestId("count")).toHaveTextContent("1");
  });

  it("? opens the shortcuts dialog listing every shortcut", async () => {
    const user = userEvent.setup();
    renderShortcuts();
    expect(dialog()).not.toHaveAttribute("open");

    await user.keyboard("?");

    expect(dialog()).toHaveAttribute("open");
    expect(
      screen.getByRole("heading", { name: "Keyboard shortcuts" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Focus the search")).toBeInTheDocument();
    expect(screen.getByText("Start a new plan")).toBeInTheDocument();
    expect(screen.getByText("Show this list")).toBeInTheDocument();
  });

  it("closes the dialog with the Close button", async () => {
    const user = userEvent.setup();
    renderShortcuts();
    await user.keyboard("?");

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(dialog()).not.toHaveAttribute("open");
  });

  it("does nothing while typing in a text field", async () => {
    const user = userEvent.setup();
    renderShortcuts();
    const field = screen.getByLabelText("Other field");
    await user.click(field);

    await user.keyboard("/ ? ");
    await user.keyboard("{Control>}{Shift>}o{/Shift}{/Control}");

    expect(field).toHaveFocus();
    expect(field).toHaveValue("/ ? ");
    expect(dialog()).not.toHaveAttribute("open");
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("does nothing while typing in the search itself", async () => {
    const user = userEvent.setup();
    renderShortcuts();
    await user.click(screen.getByLabelText("Goal"));

    await user.keyboard("a/b?c");

    expect(screen.getByLabelText("Goal")).toHaveValue("a/b?c");
    expect(dialog()).not.toHaveAttribute("open");
  });

  it("ignores keys pressed with Ctrl, Cmd or Alt", async () => {
    const user = userEvent.setup();
    renderShortcuts();

    await user.keyboard("{Control>}/{/Control}");
    await user.keyboard("{Alt>}?{/Alt}");

    expect(screen.getByLabelText("Goal")).not.toHaveFocus();
    expect(dialog()).not.toHaveAttribute("open");
  });

  it("recognises text fields, selects and editable regions as typing", () => {
    expect(isTypingTarget(document.createElement("input"))).toBe(true);
    expect(isTypingTarget(document.createElement("textarea"))).toBe(true);
    expect(isTypingTarget(document.createElement("select"))).toBe(true);
    expect(isTypingTarget(document.createElement("button"))).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });

  it("has no serious accessibility violations when open", async () => {
    const user = userEvent.setup();
    const { container } = renderShortcuts();
    await user.keyboard("?");
    expect(await seriousViolations(container)).toEqual([]);
  });
});
