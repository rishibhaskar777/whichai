import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CopyButton } from "./CopyButton";

function mockClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
}

afterEach(() => {
  vi.useRealTimers();
  Reflect.deleteProperty(navigator, "clipboard");
});

describe("CopyButton", () => {
  it("copies the text and shows a Copied state", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    render(<CopyButton text="hello brief" label="Copy starter brief" />);

    await user.click(
      screen.getByRole("button", { name: "Copy starter brief" }),
    );

    expect(writeText).toHaveBeenCalledExactlyOnceWith("hello brief");
    expect(await screen.findByText("Copied")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Copied to clipboard.",
    );
  });

  it("returns to Copy after a moment", async () => {
    const user = userEvent.setup();
    mockClipboard(vi.fn().mockResolvedValue(undefined));
    render(<CopyButton text="x" label="Copy example prompt" />);

    await user.click(
      screen.getByRole("button", { name: "Copy example prompt" }),
    );
    expect(await screen.findByText("Copied")).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText("Copy")).toBeInTheDocument(), {
      timeout: 3000,
    });
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("shows a visible fallback message when clipboard access is denied", async () => {
    const user = userEvent.setup();
    mockClipboard(vi.fn().mockRejectedValue(new DOMException("denied")));
    render(<CopyButton text="x" label="Copy starter brief" />);

    await user.click(
      screen.getByRole("button", { name: "Copy starter brief" }),
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Select the text and copy it yourself.",
    );
    expect(screen.queryByText("Copied")).not.toBeInTheDocument();
  });

  it("falls back to the message when the Clipboard API is missing", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
    });
    render(<CopyButton text="x" label="Copy starter brief" />);

    await user.click(
      screen.getByRole("button", { name: "Copy starter brief" }),
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Couldn't copy automatically.",
    );
  });

  it("recovers after a failed attempt when the next one works", async () => {
    const user = userEvent.setup();
    mockClipboard(
      vi
        .fn()
        .mockRejectedValueOnce(new Error("denied"))
        .mockResolvedValueOnce(undefined),
    );
    render(<CopyButton text="x" label="Copy starter brief" />);
    const button = screen.getByRole("button", { name: "Copy starter brief" });

    await user.click(button);
    await screen.findByText(/Couldn't copy/);
    await user.click(button);

    expect(await screen.findByText("Copied")).toBeInTheDocument();
    expect(screen.queryByText(/Couldn't copy/)).not.toBeInTheDocument();
  });
});
