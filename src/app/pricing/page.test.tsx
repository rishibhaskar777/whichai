import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Page from "./page";

vi.mock("next/navigation", async () =>
  (await import("@/test/navigation")).navigationMock("/pricing"),
);

describe("/pricing", () => {
  it("reads the billing period from the URL", async () => {
    render(
      await Page({ searchParams: Promise.resolve({ billing: "yearly" }) }),
    );
    expect(screen.getByText("₹1,490")).toBeInTheDocument();
  });

  it("falls back to monthly for an unknown period", async () => {
    render(await Page({ searchParams: Promise.resolve({ billing: "daily" }) }));
    expect(screen.getByText("₹149")).toBeInTheDocument();
  });

  it("marks the Free plan as current", async () => {
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole("button", { name: "Current plan" })).toBeDisabled();
  });
});
