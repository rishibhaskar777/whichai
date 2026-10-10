import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { headingViolations, seriousViolations } from "@/test/axe";
import { AppProviders } from "@/test/wrappers";
import { CheckoutView } from "./CheckoutView";
import { PricingView } from "./PricingView";

vi.mock("next/navigation", async () =>
  (await import("@/test/navigation")).navigationMock("/pricing"),
);

afterEach(() => {
  vi.unstubAllGlobals();
});

function card(name: string) {
  return screen.getByRole("article", { name });
}

describe("pricing page", () => {
  it("shows the heading and four plan cards", () => {
    render(<PricingView billing="monthly" currentPlan="free" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Pricing" }),
    ).toBeInTheDocument();
    for (const name of ["Free", "Plus", "Pro", "Ultra"]) {
      expect(
        within(card(name)).getByRole("heading", { level: 3, name }),
      ).toBeInTheDocument();
    }
  });

  it("shows monthly prices in rupees with /month", () => {
    render(<PricingView billing="monthly" currentPlan="free" />);

    expect(within(card("Free")).getByText("₹0")).toBeInTheDocument();
    expect(within(card("Plus")).getByText("₹49")).toBeInTheDocument();
    expect(within(card("Pro")).getByText("₹149")).toBeInTheDocument();
    expect(within(card("Ultra")).getByText("₹299")).toBeInTheDocument();
    expect(within(card("Pro")).getByText("/month")).toBeInTheDocument();
    expect(screen.queryByText(/months free/)).not.toBeInTheDocument();
  });

  it("shows yearly prices and the months free, computed from the data", () => {
    render(<PricingView billing="yearly" currentPlan="free" />);

    expect(within(card("Plus")).getByText("₹490")).toBeInTheDocument();
    expect(within(card("Pro")).getByText("₹1,490")).toBeInTheDocument();
    expect(within(card("Ultra")).getByText("₹2,990")).toBeInTheDocument();
    expect(within(card("Pro")).getByText("/year")).toBeInTheDocument();
    expect(within(card("Pro")).getByText("2 months free")).toBeInTheDocument();
    expect(
      screen.getByText("Yearly billing: 2 months free"),
    ).toBeInTheDocument();
  });

  it("keeps the billing period in the URL through the switch links", () => {
    render(<PricingView billing="monthly" currentPlan="free" />);

    const group = screen.getByRole("group", { name: "Billing period" });
    const monthly = within(group).getByRole("link", { name: "Monthly" });
    const yearly = within(group).getByRole("link", { name: "Yearly" });
    expect(monthly).toHaveAttribute("href", "/pricing");
    expect(monthly).toHaveAttribute("aria-current", "true");
    expect(yearly).toHaveAttribute("href", "/pricing?billing=yearly");
    expect(yearly).not.toHaveAttribute("aria-current");
  });

  it("marks yearly as the selected period", () => {
    render(<PricingView billing="yearly" currentPlan="free" />);

    const group = screen.getByRole("group", { name: "Billing period" });
    expect(within(group).getByRole("link", { name: "Yearly" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("disables the current plan button and links the others to checkout", () => {
    render(<PricingView billing="yearly" currentPlan="free" />);

    expect(
      within(card("Free")).getByRole("button", { name: "Current plan" }),
    ).toBeDisabled();
    expect(
      within(card("Plus")).getByRole("link", { name: "Choose Plus" }),
    ).toHaveAttribute("href", "/checkout?plan=plus&billing=yearly");
    expect(
      within(card("Pro")).getByRole("link", { name: "Choose Pro" }),
    ).toHaveAttribute("href", "/checkout?plan=pro&billing=yearly");
    expect(
      within(card("Ultra")).getByRole("link", { name: "Choose Ultra" }),
    ).toHaveAttribute("href", "/checkout?plan=ultra&billing=yearly");
    expect(
      screen.queryByRole("link", { name: "Choose Free" }),
    ).not.toBeInTheDocument();
  });

  it("labels only Pro as Recommended", () => {
    render(<PricingView billing="monthly" currentPlan="free" />);

    expect(screen.getAllByText("Recommended")).toHaveLength(1);
    expect(within(card("Pro")).getByText("Recommended")).toBeInTheDocument();
  });

  it("lists planned features on paid cards and says they are planned", () => {
    render(<PricingView billing="monthly" currentPlan="free" />);

    expect(
      within(card("Plus")).getByText("Everything in Free, plus:"),
    ).toBeInTheDocument();
    expect(within(card("Plus")).getByText("Change alerts")).toBeInTheDocument();
    expect(
      within(card("Ultra")).getByText("Team sharing for up to 5 people"),
    ).toBeInTheDocument();
    expect(screen.getByText(/nobody can subscribe yet/)).toBeInTheDocument();
    expect(
      screen.getByText("Prices in Indian rupees. Taxes may apply."),
    ).toBeInTheDocument();
  });

  it("shows no invented numbers, testimonials or ratings", () => {
    const { container } = render(
      <PricingView billing="monthly" currentPlan="free" />,
    );
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/most popular|\busers\b|testimonial|rated|% off/i);
  });

  it("offers Contact us for the Institution plan by email", () => {
    render(<PricingView billing="monthly" currentPlan="free" />);

    const section = screen.getByRole("region", { name: "Institution" });
    const link = within(section).getByRole("link", { name: "Contact us" });
    expect(link.getAttribute("href")).toMatch(/^mailto:.+@.+\?subject=/);
    for (const feature of [
      "Student access",
      "Department dashboard",
      "Faculty review of plans",
    ]) {
      expect(within(section).getByText(feature)).toBeInTheDocument();
    }
  });

  it("compares every feature across the four plans", () => {
    render(<PricingView billing="monthly" currentPlan="free" />);

    const table = screen.getByRole("table", { name: "Compare plans" });
    const head = table.querySelector("thead") as HTMLElement;
    const headers = within(head)
      .getAllByRole("columnheader")
      .map((header) => header.textContent);
    expect(headers).toEqual(["Feature", "Free", "Plus", "Pro", "Ultra"]);

    const row = within(table).getByRole("row", { name: /Change alerts/ });
    expect(
      within(row)
        .getAllByRole("cell")
        .map((cell) => cell.textContent?.replace("–", "")),
    ).toEqual([
      "FreeNot included",
      "PlusIncluded",
      "ProIncluded",
      "UltraIncluded",
    ]);

    const limit = within(table).getByRole("row", { name: /People in a team/ });
    expect(
      within(limit)
        .getAllByRole("cell")
        .map((cell) => cell.textContent?.replace("–", "")),
    ).toEqual([
      "FreeNot included",
      "PlusNot included",
      "ProNot included",
      "Ultra5",
    ]);
  });

  it("answers the five questions honestly", () => {
    render(<PricingView billing="monthly" currentPlan="free" />);

    for (const question of [
      "Can I use WhichAI for free?",
      "What happens to my saved plans if I upgrade?",
      "Can I cancel anytime?",
      "Is there a student discount?",
      "When can I subscribe?",
    ]) {
      expect(screen.getByText(question)).toBeInTheDocument();
    }
    expect(
      screen.getByText(/Paid plans open in an upcoming update/),
    ).toBeInTheDocument();
  });

  it("links to terms, refund policy, privacy and contact", () => {
    render(<PricingView billing="monthly" currentPlan="free" />);

    const nav = screen.getByRole("navigation", { name: "Legal and contact" });
    const hrefs = within(nav)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(hrefs).toEqual(["/terms", "/refund-policy", "/privacy", "/contact"]);
  });

  it("reads in Hindi with rupee amounts", () => {
    render(
      <AppProviders locale="hi">
        <PricingView billing="yearly" currentPlan="free" />
      </AppProviders>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "कीमतें" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("₹1,490").length).toBeGreaterThan(0);
    expect(screen.getAllByText("/वर्ष").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "मौजूदा प्लान" })).toBeDisabled();
  });

  it("has no accessibility or heading problems", async () => {
    const { container } = render(
      <PricingView billing="yearly" currentPlan="free" />,
    );
    expect(await seriousViolations(container)).toEqual([]);
    expect(await headingViolations(container)).toEqual([]);
  });
});

describe("checkout preview", () => {
  it("summarises the plan, period, price and what is included", () => {
    render(<CheckoutView plan="pro" billing="monthly" viewerName={null} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Checkout preview" }),
    ).toBeInTheDocument();
    const summary = screen.getByRole("region", { name: "Order summary" });
    expect(within(summary).getByText(/₹149 \/month/)).toBeInTheDocument();
    expect(
      within(summary).getByText("Everything in Plus, plus:"),
    ).toBeInTheDocument();
    expect(
      within(summary).getByText("Compare up to 6 tools"),
    ).toBeInTheDocument();
    expect(
      within(summary).getByRole("link", { name: "Change plan" }),
    ).toHaveAttribute("href", "/pricing");
  });

  it("shows the yearly price and saving", () => {
    render(<CheckoutView plan="ultra" billing="yearly" viewerName={null} />);

    expect(screen.getByText(/₹2,990 \/year/)).toBeInTheDocument();
    expect(screen.getByText(/2 months free/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pay ₹2,990" })).toBeVisible();
  });

  it("switches the billing period with links that keep the plan", () => {
    render(<CheckoutView plan="plus" billing="monthly" viewerName={null} />);

    const group = screen.getByRole("group", { name: "Billing" });
    expect(within(group).getByRole("link", { name: "Yearly" })).toHaveAttribute(
      "href",
      "/checkout?plan=plus&billing=yearly",
    );
  });

  it("asks guests to sign in and names signed-in people", () => {
    const { unmount } = render(
      <CheckoutView plan="pro" billing="monthly" viewerName={null} />,
    );
    expect(screen.getByText("You will be asked to sign in")).toBeVisible();
    unmount();

    render(<CheckoutView plan="pro" billing="monthly" viewerName="Rishi" />);
    expect(screen.getByText("Signed in as Rishi")).toBeVisible();
  });

  it("opens the dialog from Pay without a network request or a form field", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const sendBeacon = vi.fn();
    Object.defineProperty(navigator, "sendBeacon", {
      value: sendBeacon,
      configurable: true,
    });

    const { container } = render(
      <CheckoutView plan="pro" billing="monthly" viewerName={null} />,
    );
    expect(container.querySelector("input, select, textarea, form")).toBeNull();
    const dialog = document.querySelector("dialog") as HTMLDialogElement;
    expect(dialog).not.toHaveAttribute("open");

    await user.click(screen.getByRole("button", { name: "Pay ₹149" }));

    expect(dialog).toHaveAttribute("open");
    expect(
      within(dialog).getByText(
        "Payments are coming in an upcoming update. No money has been taken and no payment details were collected.",
      ),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("link", { name: "Back to plans" }),
    ).toHaveAttribute("href", "/pricing");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(sendBeacon).not.toHaveBeenCalled();
    expect(dialog.querySelector("input, select, textarea, form")).toBeNull();

    await user.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(dialog).not.toHaveAttribute("open");
  });

  it("links to the legal pages", () => {
    render(<CheckoutView plan="pro" billing="monthly" viewerName={null} />);
    const nav = screen.getByRole("navigation", { name: "Legal and contact" });
    expect(within(nav).getAllByRole("link")).toHaveLength(4);
  });

  it("has no accessibility or heading problems", async () => {
    const { container } = render(
      <CheckoutView plan="pro" billing="yearly" viewerName="Rishi" />,
    );
    expect(await seriousViolations(container)).toEqual([]);
    expect(await headingViolations(container)).toEqual([]);
  });
});
