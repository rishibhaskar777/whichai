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

afterEach(() => {
  cleanup();
  resetDocumentLoad();
  if (typeof window === "undefined") return;
  window.history.replaceState(null, "", "/");
  window.sessionStorage.clear();
});
