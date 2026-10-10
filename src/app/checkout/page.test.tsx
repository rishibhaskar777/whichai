import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Page from "./page";

vi.mock("next/navigation", async () => {
  const actual =
    await vi.importActual<typeof import("next/navigation")>("next/navigation");
  return {
    ...actual,
    ...(await import("@/test/navigation")).navigationMock("/checkout"),
  };
});

vi.mock("@/lib/auth/get-session", () => ({
  getViewer: async () => null,
}));

vi.mock("@/lib/i18n/server", async () => {
  const { createI18n } = await import("@/lib/i18n/translate");
  return { getI18n: async () => createI18n("en") };
});

function redirectTarget(error: unknown): string {
  const digest = (error as { digest?: string }).digest ?? "";
  // Next.js encodes a redirect as NEXT_REDIRECT;<type>;<url>;<status>;
  return digest.split(";")[2] ?? "";
}

async function redirectFor(params: Record<string, string | string[]>) {
  try {
    await Page({ searchParams: Promise.resolve(params) });
  } catch (error) {
    return redirectTarget(error);
  }
  return null;
}

describe("/checkout", () => {
  it("renders the preview for a paid plan", async () => {
    const element = await Page({
      searchParams: Promise.resolve({ plan: "pro", billing: "monthly" }),
    });
    render(element);
    expect(
      screen.getByRole("heading", { level: 1, name: "Checkout preview" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pay ₹149" })).toBeVisible();
  });

  it("redirects to /pricing for Free, unknown or malformed parameters", async () => {
    for (const params of [
      { plan: "free", billing: "monthly" },
      { plan: "institution" },
      { plan: "gold", billing: "monthly" },
      { plan: "pro", billing: "weekly" },
      { plan: ["pro", "plus"] },
      {},
    ]) {
      expect(await redirectFor(params), JSON.stringify(params)).toBe(
        "/pricing",
      );
    }
  });
});
