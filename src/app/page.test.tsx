import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/app-shell/AppShell";
import { sampleNews } from "@/data/sample/news";
import { seriousViolations } from "@/test/axe";
import HomePage from "./page";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

describe("home page", () => {
  it("has no serious or critical axe violations", async () => {
    const { container } = render(
      <AppShell
        news={sampleNews}
        initialTheme="system"
        viewer={null}
        providers={{ google: true, github: true }}
      >
        <HomePage />
      </AppShell>,
    );

    const violations = await seriousViolations(container);

    expect(
      violations.map((violation) => `${violation.id}: ${violation.help}`),
    ).toEqual([]);
  });

  it("has one h1 with the greeting", () => {
    render(<HomePage />);

    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("What do you want to do with AI?");
  });
});
