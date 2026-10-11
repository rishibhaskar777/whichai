import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll } from "vitest";
import { setPasswordIterations } from "@/lib/auth/password-hash";
import { resetDocumentLoad } from "@/lib/plan/home-history";

/* Hashing at the production 600,000 rounds is slow on a busy CI runner. */
export const TEST_PASSWORD_ITERATIONS = 1_000;
setPasswordIterations(TEST_PASSWORD_ITERATIONS);

beforeAll(() => {
  if (typeof window === "undefined") return;

  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
      onchange: null,
    }) as MediaQueryList;

  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    if (!this.hasAttribute("open")) return;
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

/*
 * TEST_HASH_DELAY_MS slows every key derivation, to check that tests do not
 * depend on hashing being fast. Unset, hashing runs at full speed.
 */
const hashDelay = Number(process.env.TEST_HASH_DELAY_MS ?? 0);
if (hashDelay > 0 && typeof crypto !== "undefined") {
  const derive = crypto.subtle.deriveBits.bind(crypto.subtle);
  crypto.subtle.deriveBits = async (...args: Parameters<typeof derive>) => {
    await new Promise((resolve) => setTimeout(resolve, hashDelay));
    return derive(...args);
  };
}

afterEach(() => {
  cleanup();
  resetDocumentLoad();
  if (typeof window === "undefined") return;
  window.history.replaceState(null, "", "/");
  window.sessionStorage.clear();
});
