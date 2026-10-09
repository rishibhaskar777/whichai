import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { headingViolations, seriousViolations } from "@/test/axe";
import Page from "./page";

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
    expect(
      screen.getByRole("link", { name: "rishibhaskar254@gmail.com" }),
    ).toHaveAttribute("href", "mailto:rishibhaskar254@gmail.com");
  });

  it("has no accessibility or heading-order violations", async () => {
    const { container } = render(<Page />);
    expect(await seriousViolations(container)).toEqual([]);
    expect(await headingViolations(container)).toEqual([]);
  });
});
