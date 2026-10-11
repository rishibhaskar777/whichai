import type { PlanRequest } from "@/lib/schemas/plan-request";
import { decodePlanRequest, encodePlanRequest } from "@/lib/share/share-link";

/*
 * The home page moves through steps without changing its route. Each step has
 * a browser history entry, so Back and Forward work and a reload lands on the
 * same step. The address fragment holds the plan request in the share-link
 * format (the understanding step adds a prefix). The typed goal text is never
 * in the address.
 */
const UNDERSTANDING_PREFIX = "understanding.";
const STATE_KEY = "whichaiStep";

export type HomeStep =
  | { step: "home" }
  | { step: "no-match" }
  | { step: "understanding"; request: PlanRequest }
  | { step: "plan"; request: PlanRequest };

function fragmentFor(target: HomeStep): string {
  if (target.step !== "understanding" && target.step !== "plan") return "";
  const encoded = encodePlanRequest(target.request);
  if (encoded === null) return "";
  const prefix = target.step === "understanding" ? UNDERSTANDING_PREFIX : "";
  return `#${prefix}${encoded}`;
}

function entryUrl(target: HomeStep): string {
  const { pathname, search } = window.location;
  return `${pathname}${search}${fragmentFor(target)}`;
}

/** A new history entry, for a step the reader moves to. */
export function pushHomeStep(target: HomeStep): void {
  window.history.pushState({ [STATE_KEY]: target.step }, "", entryUrl(target));
}

/** Updates the current entry, for changes inside a step. */
export function replaceHomeStep(target: HomeStep): void {
  window.history.replaceState(
    { [STATE_KEY]: target.step },
    "",
    entryUrl(target),
  );
}

function stepOfState(state: unknown): unknown {
  return state && typeof state === "object"
    ? (state as Record<string, unknown>)[STATE_KEY]
    : undefined;
}

/**
 * The step a history entry stands for. The fragment is untrusted, so it goes
 * through the same checks as a share link; anything invalid is the home step.
 */
export function readHomeStep(hash: string, state: unknown): HomeStep {
  const text = hash.startsWith("#") ? hash.slice(1) : hash;
  if (text === "") {
    return stepOfState(state) === "no-match"
      ? { step: "no-match" }
      : { step: "home" };
  }
  const understanding = text.startsWith(UNDERSTANDING_PREFIX);
  const decoded = decodePlanRequest(
    understanding ? text.slice(UNDERSTANDING_PREFIX.length) : text,
  );
  if (!decoded.ok) return { step: "home" };
  return {
    step: understanding ? "understanding" : "plan",
    request: decoded.request,
  };
}
