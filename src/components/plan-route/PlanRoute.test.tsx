import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { decodePlanRequest, encodePlanRequest } from "@/lib/share/share-link";
import { createMemoryBackend } from "@/lib/storage/backend";
import { searchParams } from "@/test/navigation";
import { requestFor, planNamed, seed } from "@/test/seed";
import { AppProviders } from "@/test/wrappers";
import { PlanRoute } from "./PlanRoute";

vi.mock("next/navigation", async () =>
  (await import("@/test/navigation")).navigationMock("/plan"),
);

function openFragment(fragment: string) {
  window.history.replaceState(null, "", `/plan${fragment}`);
}

async function renderRoute(
  plans: ReturnType<typeof planNamed>[] = [],
  query = "",
) {
  searchParams.current = new URLSearchParams(query);
  const backend = createMemoryBackend();
  if (plans.length > 0) await seed(backend, { plans });
  return render(
    <AppProviders backend={backend}>
      <PlanRoute />
    </AppProviders>,
  );
}

afterEach(() => {
  window.history.replaceState(null, "", "/");
  searchParams.current = new URLSearchParams();
});

describe("plan route from a share link", () => {
  it("rebuilds the plan from the fragment", async () => {
    const request = requestFor("portfolio website with animations", {
      level: "advanced",
    });
    openFragment(`#${encodePlanRequest(request)}`);

    await renderRoute();

    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
      /portfolio/i,
    );
    expect(screen.getByRole("radio", { name: "Advanced" })).toBeChecked();
    expect(screen.getByText(/Opened from a share link/)).toBeInTheDocument();
  });

  it("does not add a shared plan to the search history", async () => {
    const request = requestFor("portfolio website with animations");
    openFragment(`#${encodePlanRequest(request)}`);
    const backend = createMemoryBackend();
    searchParams.current = new URLSearchParams();
    render(
      <AppProviders backend={backend}>
        <PlanRoute />
      </AppProviders>,
    );
    await screen.findByRole("heading", { level: 1 });

    expect(await backend.get("history")).toBeNull();
  });

  it("shows a friendly message for a malformed link", async () => {
    openFragment("#not*valid");

    await renderRoute();

    expect(
      await screen.findByRole("heading", { name: "We can't open this link" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/damaged or incomplete/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Make a plan" }),
    ).toBeInTheDocument();
  });

  it("rejects a link that decodes to something else", async () => {
    const encoded = btoa(JSON.stringify({ hello: "world" }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    openFragment(`#${encoded}`);

    await renderRoute();

    expect(
      await screen.findByText(/doesn't hold a plan we recognise/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
  });

  it("rejects an oversized link without trying to decode it", async () => {
    openFragment(`#${"a".repeat(5000)}`);

    await renderRoute();

    expect(await screen.findByText(/too large/)).toBeInTheDocument();
  });

  it("asks for a goal when there is nothing to show", async () => {
    await renderRoute();

    expect(
      await screen.findByRole("heading", { name: "No plan to show" }),
    ).toBeInTheDocument();
  });
});

describe("plan route for a saved plan", () => {
  it("rebuilds the saved plan at its saved level", async () => {
    const plan = planNamed("My site");
    plan.planRequest = { ...plan.planRequest, level: "polished" };

    await renderRoute([plan], `id=${plan.id}`);

    expect(
      await screen.findByRole("radio", { name: "Polished" }),
    ).toBeChecked();
    expect(screen.getByRole("button", { name: "Saved" })).toBeDisabled();
    expect(
      screen.queryByText(/Tools have been updated/),
    ).not.toBeInTheDocument();
  });

  it("says tools were updated when the catalogue changed since saving", async () => {
    const plan = { ...planNamed("My site"), catalogueVersion: "older" };

    await renderRoute([plan], `id=${plan.id}`);

    expect(
      await screen.findByText(/Tools have been updated since you saved/),
    ).toBeInTheDocument();
  });

  it("explains when the saved plan is not in this browser", async () => {
    await renderRoute([], "id=missing-plan-id");

    expect(
      await screen.findByRole("heading", {
        name: "That saved plan isn't here",
      }),
    ).toBeInTheDocument();
  });
});

describe("plan route address updates", () => {
  it("replaces the fragment when the level changes, without a new history entry", async () => {
    const user = userEvent.setup();
    const request = requestFor("portfolio website", { level: "simple" });
    openFragment(`#${encodePlanRequest(request)}`);
    const entries = window.history.length;

    await renderRoute();
    await user.click(await screen.findByRole("radio", { name: "Advanced" }));

    await waitFor(() => {
      const decoded = decodePlanRequest(window.location.hash);
      expect(decoded.ok && decoded.request.level).toBe("advanced");
    });
    expect(window.history.length).toBe(entries);
  });

  it("keeps a swapped tool in the fragment", async () => {
    const user = userEvent.setup();
    const request = requestFor("portfolio website", { level: "polished" });
    openFragment(`#${encodePlanRequest(request)}`);

    await renderRoute();
    const swap = (
      await screen.findAllByRole("button", {
        name: /^Choose .* if/,
      })
    )[0]!;
    await user.click(swap);

    await waitFor(() => {
      const decoded = decodePlanRequest(window.location.hash);
      expect(
        decoded.ok && Object.keys(decoded.request.chosenTools),
      ).toHaveLength(1);
    });
  });

  it("keeps an added part in the fragment", async () => {
    const user = userEvent.setup();
    const request = requestFor("portfolio website", { level: "simple" });
    openFragment(`#${encodePlanRequest(request)}`);

    await renderRoute();
    await user.click(await screen.findByRole("button", { name: "Add a part" }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("Search parts"), "razorpay");
    await user.click(
      within(dialog).getByRole("button", { name: /Payments \(India\)/ }),
    );

    await waitFor(() => {
      const decoded = decodePlanRequest(window.location.hash);
      expect(decoded.ok && decoded.request.addedJobs).toEqual([
        "payments-india",
      ]);
    });
  });

  it("does not start the plan over when the fragment it wrote is read back", async () => {
    const user = userEvent.setup();
    const request = requestFor("portfolio website", { level: "simple" });
    openFragment(`#${encodePlanRequest(request)}`);

    await renderRoute();
    await user.click(await screen.findByRole("radio", { name: "Advanced" }));
    await waitFor(() =>
      expect(decodePlanRequest(window.location.hash)).toMatchObject({
        ok: true,
      }),
    );
    await user.click(screen.getByRole("radio", { name: "Polished" }));

    expect(screen.getByRole("radio", { name: "Polished" })).toBeChecked();
  });

  it("opens a saved plan with the changes in the fragment on top of it", async () => {
    const plan = planNamed("My site");
    const changed = { ...plan.planRequest, level: "advanced" as const };
    window.history.replaceState(
      null,
      "",
      `/plan?id=${plan.id}#${encodePlanRequest(changed)}`,
    );

    await renderRoute([plan], `id=${plan.id}`);

    expect(
      await screen.findByRole("radio", { name: "Advanced" }),
    ).toBeChecked();
    // The saved copy is still the older one, so it can be updated.
    expect(
      screen.getByRole("button", { name: "Update saved plan" }),
    ).toBeEnabled();
  });

  it("keeps the saved plan's address and updates only the fragment", async () => {
    const user = userEvent.setup();
    const plan = planNamed("My site");
    window.history.replaceState(null, "", `/plan?id=${plan.id}`);

    await renderRoute([plan], `id=${plan.id}`);
    await user.click(await screen.findByRole("radio", { name: "Advanced" }));

    await waitFor(() => expect(window.location.hash.length).toBeGreaterThan(1));
    expect(window.location.search).toBe(`?id=${plan.id}`);
    expect(window.location.pathname).toBe("/plan");
  });
});
