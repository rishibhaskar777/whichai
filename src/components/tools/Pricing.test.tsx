import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { pricingInfo } from "@/lib/catalogue/pricing";
import { createI18n } from "@/lib/i18n/translate";
import { freeOptionText, PricingValue } from "./Pricing";

const en = createI18n("en");
const hi = createI18n("hi");

const RECORDED = {
  hasFreeOption: true as const,
  pricing: "Free plan; paid from $20/month",
  pricingUrl: "https://example.com/pricing",
  pricingCheckedOn: "2026-10-11",
  officialUrl: "https://example.com",
};

describe("free option text", () => {
  it("is one of three plain phrases", () => {
    expect(freeOptionText(en, true)).toBe("Free plan available");
    expect(freeOptionText(en, false)).toBe("Paid only");
    expect(freeOptionText(en, "verify")).toBe("Check the official site");
  });

  it("is translated", () => {
    expect(freeOptionText(hi, false)).toBe("केवल सशुल्क");
  });
});

describe("pricing value", () => {
  it("shows the recorded summary with where and when it was read", () => {
    render(<PricingValue i18n={en} pricing={pricingInfo(RECORDED)} />);

    expect(screen.getByText("Free plan; paid from $20/month")).toBeVisible();
    const link = screen.getByRole("link", {
      name: /From the official pricing page, checked 11 Oct 2026/,
    });
    expect(link).toHaveAttribute("href", "https://example.com/pricing");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.queryByText("See pricing")).toBeNull();
  });

  it("links to the pricing page when no summary is recorded", () => {
    render(
      <PricingValue
        i18n={en}
        pricing={pricingInfo({
          ...RECORDED,
          pricing: "[verify]",
          pricingCheckedOn: undefined,
        })}
      />,
    );

    expect(screen.getByRole("link", { name: /See pricing/ })).toHaveAttribute(
      "href",
      "https://example.com/pricing",
    );
    expect(screen.queryByText(/official pricing page, checked/)).toBeNull();
    expect(document.body.textContent).not.toContain("[verify]");
  });

  it("falls back to the official site when there is no pricing page", () => {
    render(
      <PricingValue
        i18n={en}
        pricing={pricingInfo({
          hasFreeOption: "verify",
          pricing: "[verify]",
          officialUrl: "https://example.com",
        })}
      />,
    );

    expect(screen.getByRole("link", { name: /See pricing/ })).toHaveAttribute(
      "href",
      "https://example.com",
    );
  });

  it("is translated", () => {
    render(<PricingValue i18n={hi} pricing={pricingInfo(RECORDED)} />);

    expect(
      screen.getByRole("link", { name: /आधिकारिक कीमत वाले पेज से/ }),
    ).toBeInTheDocument();
  });
});
