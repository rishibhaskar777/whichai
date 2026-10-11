import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { REPOSITORY_URL } from "@/lib/links";
import { headingViolations, seriousViolations } from "@/test/axe";
import { AppProviders } from "@/test/wrappers";
import { ContactContent, RefundContent, TermsContent } from "./LegalContent";

vi.mock("next/navigation", async () =>
  (await import("@/test/navigation")).navigationMock("/terms"),
);

afterEach(() => {
  vi.unstubAllEnvs();
});

const DRAFT = "Draft: will be reviewed before paid plans launch.";
const REVIEW_DRAFT = "Draft, pending legal review.";

describe.each([
  ["Terms of Service", TermsContent, REVIEW_DRAFT],
  ["Refund and Cancellation Policy", RefundContent, DRAFT],
  ["Contact", ContactContent, DRAFT],
])("%s", (title, Component, draft) => {
  it("renders one heading and the draft note", () => {
    render(<Component />);

    expect(
      screen.getByRole("heading", { level: 1, name: title }),
    ).toBeInTheDocument();
    expect(screen.getByRole("note")).toHaveTextContent(draft);
  });

  it("has no legal link bar; those links live in Settings and on pricing", () => {
    render(<Component />);

    expect(
      screen.queryByRole("navigation", { name: "Legal and contact" }),
    ).not.toBeInTheDocument();
  });

  it("has no accessibility or heading problems", async () => {
    const { container } = render(<Component />);
    expect(await seriousViolations(container)).toEqual([]);
    expect(await headingViolations(container)).toEqual([]);
  });
});

describe("Terms of Service", () => {
  it("has the sections a full terms page needs, in order", () => {
    render(<TermsContent />);
    const headings = screen
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent);

    expect(headings).toEqual([
      "1. Accepting these terms",
      "2. Who we are",
      "3. Who can use WhichAI",
      "4. Accounts and security",
      "5. Using WhichAI as a guest",
      "6. Acceptable use",
      "7. What the service is",
      "8. Accuracy and no professional advice",
      "9. Subscriptions and payments",
      "10. Refunds",
      "11. Intellectual property",
      "12. Your feedback",
      "13. Third-party links",
      "14. Disclaimers",
      "15. Limits on our liability",
      "16. Your responsibility for misuse",
      "17. Ending your use",
      "18. Changes to these terms",
      "19. Governing law",
      "20. Contact",
    ]);
  });

  it("states the age rule, India as the governing law and the effective date", () => {
    render(<TermsContent />);

    expect(screen.getByText(/at least 13 years old/)).toBeInTheDocument();
    expect(
      screen.getByText(/governed by the laws of India/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Effective date: 11 October 2026/),
    ).toBeInTheDocument();
  });

  it("links the refund policy and the contact page, and shows no email", () => {
    const { container } = render(<TermsContent />);

    expect(
      screen.getByRole("link", { name: "Refund and Cancellation Policy" }),
    ).toHaveAttribute("href", "/refund-policy");
    expect(screen.getByRole("link", { name: "contact page" })).toHaveAttribute(
      "href",
      "/contact",
    );
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
  });

  it("says in Hindi that the full text is English only", () => {
    render(
      <AppProviders locale="hi">
        <TermsContent />
      </AppProviders>,
    );

    expect(
      screen.getByText(/केवल अंग्रेज़ी में दिखाया जाता है/),
    ).toBeInTheDocument();
  });

  it("says nothing is charged today", () => {
    render(<TermsContent />);
    expect(screen.getByText(/Paid plans do not exist yet/)).toBeInTheDocument();
  });
});

describe("Refund and Cancellation Policy", () => {
  it("does not promise a refund window", () => {
    render(<RefundContent />);
    expect(
      screen.getByText(/does not promise a refund window yet/),
    ).toBeInTheDocument();
  });
});

describe("Contact", () => {
  it("offers feedback, a private security report and an institution issue on GitHub", () => {
    render(<ContactContent />);

    const feedback = screen.getByRole("link", { name: /Send feedback/ });
    expect(feedback).toHaveAttribute("target", "_blank");
    expect(feedback).toHaveAttribute("rel", "noopener noreferrer");
    expect(feedback).toHaveAttribute(
      "href",
      `${REPOSITORY_URL}/issues/new?template=feedback.yml`,
    );

    expect(
      screen.getByRole("link", { name: /Report a security problem/ }),
    ).toHaveAttribute("href", `${REPOSITORY_URL}/security/advisories/new`);

    const institution = screen.getByRole("link", {
      name: /Ask about the Institution plan/,
    });
    const url = new URL(institution.getAttribute("href") as string);
    expect(url.origin).toBe("https://github.com");
    expect(url.searchParams.get("template")).toBe("institution.yml");
  });

  it("shows no email and no mailto link by default", () => {
    const { container } = render(<ContactContent />);

    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
    expect(
      screen.queryByRole("heading", { level: 2, name: "Email" }),
    ).not.toBeInTheDocument();
  });

  it("shows the email only when NEXT_PUBLIC_CONTACT_EMAIL is set", () => {
    vi.stubEnv("NEXT_PUBLIC_CONTACT_EMAIL", "hello@example.org");
    render(<ContactContent />);

    const section = screen
      .getByRole("heading", { level: 2, name: "Email" })
      .closest("section") as HTMLElement;
    expect(
      within(section).getByRole("link", { name: "hello@example.org" }),
    ).toHaveAttribute("href", "mailto:hello@example.org");
    expect(
      screen.getByRole("link", { name: /Send feedback/ }),
    ).toBeInTheDocument();
  });

  it("ignores an invalid address", () => {
    vi.stubEnv("NEXT_PUBLIC_CONTACT_EMAIL", "not-an-address");
    const { container } = render(<ContactContent />);

    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
  });

  it("reads in Hindi", () => {
    render(
      <AppProviders locale="hi">
        <ContactContent />
      </AppProviders>,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "संपर्क" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /सुरक्षा समस्या की रिपोर्ट करें/ }),
    ).toBeInTheDocument();
  });
});
