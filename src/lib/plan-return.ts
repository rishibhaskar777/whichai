/*
 * A plan card remembers itself in the current history entry before the reader
 * opens its tool page, so Back can land on the same card. The state lives in
 * the browser's history entry and is never part of the address.
 */
const RETURN_CARD_KEY = "whichaiReturnCard";

function readState(): Record<string, unknown> {
  const state: unknown = window.history.state;
  return state && typeof state === "object"
    ? (state as Record<string, unknown>)
    : {};
}

export function rememberReturnCard(jobId: string): void {
  window.history.replaceState({ ...readState(), [RETURN_CARD_KEY]: jobId }, "");
}

/** The card to go back to, once. Clears the note so a reload starts at the top. */
export function takeReturnCard(): string | null {
  const { [RETURN_CARD_KEY]: jobId, ...rest } = readState();
  if (typeof jobId !== "string") return null;
  window.history.replaceState(rest, "");
  return jobId;
}
