import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/lib/i18n/provider";
import { listParts } from "@/lib/plan/interpret-goal";
import { seriousViolations } from "@/test/axe";
import { filterParts, PartPicker } from "./PartPicker";

const PARTS = listParts();

function picker(props: Partial<React.ComponentProps<typeof PartPicker>> = {}) {
  return (
    <I18nProvider locale="en">
      <PartPicker
        open
        parts={PARTS}
        chosen={new Set()}
        onPick={() => {}}
        onClose={() => {}}
        {...props}
      />
    </I18nProvider>
  );
}

describe("filterParts", () => {
  it("returns every part for an empty search", () => {
    expect(filterParts(PARTS, "  ")).toHaveLength(PARTS.length);
  });

  it("matches words in the name, description and keywords", () => {
    const ids = filterParts(PARTS, "razorpay").map((part) => part.id);
    expect(ids).toContain("payments-india");
  });

  it("needs every word to match", () => {
    const ids = filterParts(PARTS, "payment razorpay").map((part) => part.id);
    expect(ids).toContain("payments-india");
    expect(filterParts(PARTS, "razorpay flashcards")).toEqual([]);
  });

  it("ignores case", () => {
    expect(filterParts(PARTS, "HOSTING").map((part) => part.id)).toContain(
      "hosting",
    );
  });
});

describe("PartPicker", () => {
  it("lists every part and counts the results", async () => {
    render(picker());
    const dialog = await screen.findByRole("dialog");

    expect(
      within(dialog).getByText(`${PARTS.length} parts`),
    ).toBeInTheDocument();
  });

  it("hands the chosen part to the caller", async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    render(picker({ onPick }));
    const dialog = await screen.findByRole("dialog");

    await user.type(within(dialog).getByLabelText("Search parts"), "sitemap");
    await user.click(
      within(dialog).getByRole("button", { name: /Search visibility/ }),
    );

    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ id: "seo" }));
  });

  it("closes from the Close button", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(picker({ onClose }));
    const dialog = await screen.findByRole("dialog");

    await user.click(within(dialog).getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalled();
  });

  it("forgets the last search when it is opened again", async () => {
    const user = userEvent.setup();
    const { rerender } = render(picker());
    await user.type(screen.getByLabelText("Search parts"), "seo");

    rerender(picker({ open: false }));
    rerender(picker({ open: true }));

    expect(await screen.findByLabelText("Search parts")).toHaveValue("");
  });

  it("has no serious accessibility problems", async () => {
    const { container } = render(picker());
    await screen.findByRole("dialog");

    expect(await seriousViolations(container)).toEqual([]);
  });
});
