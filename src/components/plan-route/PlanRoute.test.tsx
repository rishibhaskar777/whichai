import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { encodePlanRequest } from "@/lib/share/share-link";
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
