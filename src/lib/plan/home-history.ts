import type { PlanRequest } from "@/lib/schemas/plan-request";
import { decodePlanRequest, encodePlanRequest } from "@/lib/share/share-link";

/*
 * The home page moves through steps without changing its route. Each step has
 * a browser history entry, so Back and Forward work within a visit. The address
 * fragment holds the plan request in the share-link format (the understanding
 * step adds a prefix). The typed goal text is never in the address; it lives in
 * the history entry's state, which is gone after a reload. A full page load
 * always starts at the empty home step.
 *
 * The App Router keeps its own fields in history.state, so every write spreads
 * the existing state and touches only the namespaced key below.
 */
const UNDERSTANDING_PREFIX = "understanding.";
const STATE_KEY = "whichaiHome";
const LEGACY_GOAL_KEY = "whichai:goal";

export type HomeStep =
  | { step: "home" }
  | { step: "no-match" }
  | { step: "understanding"; request: PlanRequest }
  | { step: "plan"; request: PlanRequest };

interface EntryState {
  goal: string;
  step: HomeStep["step"];
}

function currentState(): Record<string, unknown> {
  const state: unknown = window.history.state;
  return state && typeof state === "object"
    ? (state as Record<string, unknown>)
    : {};
}

function readEntry(state: unknown): {
  goal?: string | undefined;
  step?: HomeStep["step"] | undefined;
} {
  const entry =
    state && typeof state === "object"
      ? (state as Record<string, unknown>)[STATE_KEY]
      : undefined;
  if (!entry || typeof entry !== "object") return {};
  const { goal, step } = entry as Record<string, unknown>;
  return {
    goal: typeof goal === "string" ? goal : undefined,
    step: typeof step === "string" ? (step as HomeStep["step"]) : undefined,
  };
}

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

function entryState(target: HomeStep, goal: string): Record<string, unknown> {
  const entry: EntryState = { goal, step: target.step };
  return { ...currentState(), [STATE_KEY]: entry };
}

/** The goal text a history entry was left with, or "" when it holds none. */
export function readHomeGoal(state: unknown): string {
  return readEntry(state).goal ?? "";
}

/** A new history entry, for a step the reader moves to. */
export function pushHomeStep(target: HomeStep, goal: string): void {
  window.history.pushState(entryState(target, goal), "", entryUrl(target));
}

/**
 * Updates the current entry, for changes inside a step. The entry keeps its
 * goal text unless a new one is given.
 */
export function replaceHomeStep(target: HomeStep, goal?: string): void {
  window.history.replaceState(
    entryState(target, goal ?? readHomeGoal(window.history.state)),
    "",
    entryUrl(target),
  );
}

/**
 * Notes the typed goal on the entry the reader is leaving, so Back to the home
 * step refills the search box. Entries that hold a step are left as they are.
 */
export function rememberHomeGoal(goal: string): void {
  const current = readHomeStep(window.location.hash, window.history.state);
  if (current.step === "home") replaceHomeStep(current, goal);
}

/**
 * The step a history entry stands for. The fragment is untrusted, so it goes
 * through the same checks as a share link; anything invalid is the home step.
 */
export function readHomeStep(hash: string, state: unknown): HomeStep {
  const text = hash.startsWith("#") ? hash.slice(1) : hash;
  if (text === "") {
    return readEntry(state).step === "no-match"
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

let documentHandled = false;

/**
 * Whether the home page is being shown for the first time since the document
 * loaded from the network. Client-side navigation back to the home page keeps
 * the same document, so it is not a fresh load. A reload of another page
 * followed by Back to home is not one either, since home was not what loaded.
 */
function isFreshLoad(): boolean {
  if (documentHandled) return false;
  documentHandled = true;
  const [entry] = performance.getEntriesByType("navigation");
  if (!entry) return true;
  try {
    return new URL(entry.name).pathname === window.location.pathname;
  } catch {
    return true;
  }
}

/**
 * Makes a full page load start at the empty home step: drops our key from the
 * entry's state and the step fragment from the address, and clears the goal
 * text older versions kept in session storage. Returns true when it did so.
 */
export function startFreshHomeVisit(): boolean {
  try {
    window.sessionStorage.removeItem(LEGACY_GOAL_KEY);
  } catch {
    // Storage can be blocked; there is nothing to clear then.
  }
  if (!isFreshLoad()) return false;
  const routerState = { ...currentState() };
  delete routerState[STATE_KEY];
  const { pathname, search } = window.location;
  window.history.replaceState(routerState, "", `${pathname}${search}`);
  return true;
}

/** Forgets that this document showed the home page; tests use it to stand in for a full page load. */
export function resetDocumentLoad(): void {
  documentHandled = false;
}
