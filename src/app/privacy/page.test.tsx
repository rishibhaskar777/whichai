import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { headingViolations, seriousViolations } from "@/test/axe";
import Page from "./page";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("privacy page", () => {
  it("covers what is received, stored, not done, sign-out and contact", () => {
    render(<Page />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Privacy" }),
    ).toBeInTheDocument();
    for (const name of [
      "What we receive",
      "Preview accounts",
      "Guest profile",
      "What we store",
      "Cookies",
      "What stays on your device",
      "AI news",
      "What we don't do",
      "Your rights under India's DPDP Act, 2023",
      "Deleting your data",
      "Signing out and leaving",
      "Contact",
    ]) {
      expect(
        screen.getByRole("heading", { level: 2, name }),
      ).toBeInTheDocument();
    }
    expect(screen.queryByRole("link", { name: /@/ })).not.toBeInTheDocument();
  });

  it("carries the draft note and describes preview accounts honestly", () => {
    render(<Page />);

    expect(screen.getByRole("note")).toHaveTextContent(
      "Draft, pending legal review.",
    );
    expect(screen.getByText(/exists only in this browser/)).toBeInTheDocument();
    expect(screen.getByText(/PBKDF2/)).toBeInTheDocument();
    expect(
      screen.getByText(/Delete local account and data/, { selector: "p" }),
    ).toBeInTheDocument();
  });

  it("shows a contact address only when one is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_CONTACT_EMAIL", "hello@example.org");
    render(<Page />);
    expect(
      screen.getByRole("link", { name: "hello@example.org" }),
    ).toHaveAttribute("href", "mailto:hello@example.org");
  });

  it("has no accessibility or heading-order violations", async () => {
    const { container } = render(<Page />);
    expect(await seriousViolations(container)).toEqual([]);
    expect(await headingViolations(container)).toEqual([]);
  });
});
