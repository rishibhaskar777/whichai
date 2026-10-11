/*
 * The text a person typed stays in this tab's session storage so Back can put
 * it in the search box again. It is never part of the address and it goes when
 * the tab closes or "New plan" is pressed.
 */
const KEY = "whichai:goal";

export function readSessionGoal(): string {
  try {
    return window.sessionStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function writeSessionGoal(text: string): void {
  try {
    window.sessionStorage.setItem(KEY, text);
  } catch {
    // Storage can be blocked. The flow still works, only Back loses the text.
  }
}

export function clearSessionGoal(): void {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // Nothing to clear if storage is blocked.
  }
}
