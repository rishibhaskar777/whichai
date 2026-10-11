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
      "What we store",
      "What we don't do",
      "Signing out and leaving",
      "Contact",
    ]) {
      expect(
        screen.getByRole("heading", { level: 2, name }),
      ).toBeInTheDocument();
    }
    expect(screen.queryByRole("link", { name: /@/ })).not.toBeInTheDocument();
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
