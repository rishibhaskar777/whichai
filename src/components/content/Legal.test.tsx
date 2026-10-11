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
