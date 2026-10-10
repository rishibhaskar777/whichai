import type { Platform } from "@/lib/schemas/catalogue";

/** The operating systems a download button can target. */
export type VisitorSystem = "windows" | "macos" | "linux" | "android" | "ios";
export type VisitorBrowser = "chrome" | "firefox" | "edge";

export interface Visitor {
  system: VisitorSystem | null;
  browser: VisitorBrowser | null;
}

export const UNKNOWN_VISITOR: Visitor = { system: null, browser: null };

export interface NavigatorSignals {
  /** `navigator.userAgentData.platform`, when the browser offers it. */
  clientHintPlatform?: string | undefined;
  /** Brand names from `navigator.userAgentData.brands`. */
  clientHintBrands?: readonly string[] | undefined;
  userAgent?: string | undefined;
  maxTouchPoints?: number | undefined;
}

function systemFromClientHint(platform: string): VisitorSystem | null {
  const value = platform.toLowerCase();
  if (value.includes("windows")) return "windows";
  if (value === "macos" || value.includes("mac")) return "macos";
  if (value.includes("android")) return "android";
  if (value === "ios" || value.includes("iphone") || value.includes("ipad")) {
    return "ios";
  }
  if (value.includes("linux") || value.includes("chrome os")) return "linux";
  return null;
}

function systemFromUserAgent(
  userAgent: string,
  maxTouchPoints: number,
): VisitorSystem | null {
  // Android reports "Linux" too, so it has to be checked first.
  if (/android/i.test(userAgent)) return "android";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "ios";
  // iPadOS asks for the desktop site and reports itself as a Mac.
  if (/macintosh|mac os x/i.test(userAgent)) {
    return maxTouchPoints > 1 ? "ios" : "macos";
  }
  if (/windows/i.test(userAgent)) return "windows";
  if (/linux|x11|cros/i.test(userAgent)) return "linux";
  return null;
}

function browserFrom(
  userAgent: string,
  brands: readonly string[],
): VisitorBrowser | null {
  const brandText = brands.join(" ").toLowerCase();
  // Edge and Opera contain "Chrome" in their user agent, so test them first.
  if (/\bedg(?:e|a|ios)?\//i.test(userAgent) || brandText.includes("edge")) {
    return "edge";
  }
  if (/firefox|fxios/i.test(userAgent)) return "firefox";
  if (/opr\/|opera/i.test(userAgent)) return null;
  if (/chrome|crios|chromium/i.test(userAgent) || brandText.includes("chrom")) {
    return "chrome";
  }
  return null;
}

/** Client hints first, with the user agent as the fallback. */
export function detectVisitor(signals: NavigatorSignals): Visitor {
  const userAgent = signals.userAgent ?? "";
  const hinted = signals.clientHintPlatform
    ? systemFromClientHint(signals.clientHintPlatform)
    : null;
  const system =
    hinted ?? systemFromUserAgent(userAgent, signals.maxTouchPoints ?? 0);
  return {
    system,
    browser: browserFrom(userAgent, signals.clientHintBrands ?? []),
  };
}

export function platformIsCurrent(
  platform: Platform,
  visitor: Visitor,
): boolean {
  return visitor.system !== null && platform === visitor.system;
}
