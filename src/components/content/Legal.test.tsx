import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CONTACT_EMAIL } from "@/lib/links";
import { headingViolations, seriousViolations } from "@/test/axe";
import { AppProviders } from "@/test/wrappers";
import { ContactContent, RefundContent, TermsContent } from "./LegalContent";

vi.mock("next/navigation", async () =>
  (await import("@/test/navigation")).navigationMock("/terms"),
);

const DRAFT = "Draft: will be reviewed before paid plans launch.";

describe.each([
  ["Terms of Service", TermsContent],
  ["Refund and Cancellation Policy", RefundContent],
  ["Contact", ContactContent],
])("%s", (title, Component) => {
  it("renders one heading and the draft note", () => {
    render(<Component />);

    expect(
      screen.getByRole("heading", { level: 1, name: title }),
    ).toBeInTheDocument();
    expect(screen.getByRole("note")).toHaveTextContent(DRAFT);
  });

  it("links Terms, Refund policy, Privacy and Contact", () => {
    render(<Component />);

    const nav = screen.getByRole("navigation", { name: "Legal and contact" });
    expect(
      within(nav)
        .getAllByRole("link")
        .map((link) => link.getAttribute("href")),
    ).toEqual(["/terms", "/refund-policy", "/privacy", "/contact"]);
  });

  it("has no accessibility or heading problems", async () => {
    const { container } = render(<Component />);
    expect(await seriousViolations(container)).toEqual([]);
    expect(await headingViolations(container)).toEqual([]);
  });
});

describe("Terms of Service", () => {
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
  it("lists the email from SECURITY.md and the GitHub feedback link", () => {
    render(<ContactContent />);

    expect(CONTACT_EMAIL).toBe("rishibhaskar254@gmail.com");
    expect(screen.getByRole("link", { name: CONTACT_EMAIL })).toHaveAttribute(
      "href",
      `mailto:${CONTACT_EMAIL}`,
    );
    const feedback = screen.getByRole("link", { name: /Send feedback/ });
    expect(feedback).toHaveAttribute("target", "_blank");
    expect(feedback).toHaveAttribute("rel", "noopener noreferrer");
    expect(feedback.getAttribute("href")).toContain("github.com/");
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
  });
});
