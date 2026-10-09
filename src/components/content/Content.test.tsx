import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { seriousViolations, headingViolations } from "@/test/axe";
import { AppProviders } from "@/test/wrappers";
import { AboutContent } from "./AboutContent";
import { HelpContent } from "./HelpContent";

vi.mock("next/navigation", async () =>
  (await import("@/test/navigation")).navigationMock("/help"),
);

vi.mock("@/lib/i18n/server", async () => {
  const { createI18n } = await import("@/lib/i18n/translate");
  return { getI18n: async () => createI18n("en") };
});

describe("Help page", () => {
  it("answers the six common questions", () => {
    render(<HelpContent />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Help" }),
    ).toBeInTheDocument();
    for (const question of [
      "What does WhichAI do?",
      'Why do tools say "Not verified"?',
      "Where is my data stored?",
      "How do I share a plan?",
      "How do I delete my data?",
      "Is it free?",
    ]) {
      expect(screen.getByText(question)).toBeInTheDocument();
    }
  });

  it("links to feedback on GitHub in a new tab", () => {
    render(<HelpContent />);
    const link = screen.getByRole("link", { name: /Send feedback/ });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("has no serious accessibility or heading problems", async () => {
    const { container } = render(<HelpContent />);
    expect(await seriousViolations(container)).toEqual([]);
    expect(await headingViolations(container)).toEqual([]);
  });

  it("reads in Hindi", () => {
    render(
      <AppProviders locale="hi">
        <HelpContent />
      </AppProviders>,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "मदद" }),
    ).toBeInTheDocument();
  });
});

describe("About page", () => {
  it("explains what it is, how recommendations are made, and the principles", () => {
    render(<AboutContent />);

    expect(
      screen.getByRole("heading", { level: 1, name: "About WhichAI" }),
    ).toBeInTheDocument();
    for (const name of [
      "What it is",
      "How recommendations are made",
      "Honesty",
      "Free, with no tracking",
    ]) {
      expect(
        screen.getByRole("heading", { level: 2, name }),
      ).toBeInTheDocument();
    }
  });

  it("has no serious accessibility or heading problems", async () => {
    const { container } = render(<AboutContent />);
    expect(await seriousViolations(container)).toEqual([]);
    expect(await headingViolations(container)).toEqual([]);
  });
});

describe("Not found page", () => {
  it("explains and links home", async () => {
    const { default: NotFound } = await import("@/app/not-found");

    const { container } = render(await NotFound());

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "We can't find that page",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Go to the home page" }),
    ).toHaveAttribute("href", "/");
    expect(await seriousViolations(container)).toEqual([]);
    expect(await headingViolations(container)).toEqual([]);
  });
});
