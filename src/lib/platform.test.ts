import { describe, expect, it } from "vitest";
import { detectVisitor } from "./platform";

const UA = {
  windowsChrome:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  windowsEdge:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0",
  macSafari:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  iphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  androidChrome:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
  linuxFirefox:
    "Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0",
  firefoxOnIos:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/131.0 Mobile/15E148 Safari/605.1.15",
};

describe("detectVisitor", () => {
  it("prefers client hints over the user agent", () => {
    const visitor = detectVisitor({
      clientHintPlatform: "Windows",
      clientHintBrands: ["Chromium", "Google Chrome"],
      userAgent: UA.macSafari,
    });
    expect(visitor).toEqual({ system: "windows", browser: "chrome" });
  });

  it.each([
    ["macOS", "macos"],
    ["Android", "android"],
    ["Linux", "linux"],
    ["Chrome OS", "linux"],
    ["iOS", "ios"],
  ] as const)("maps the client hint platform %s", (platform, system) => {
    expect(detectVisitor({ clientHintPlatform: platform }).system).toBe(system);
  });

  it("falls back to the user agent when there are no hints", () => {
    expect(detectVisitor({ userAgent: UA.windowsChrome }).system).toBe(
      "windows",
    );
    expect(detectVisitor({ userAgent: UA.macSafari }).system).toBe("macos");
    expect(detectVisitor({ userAgent: UA.linuxFirefox }).system).toBe("linux");
    expect(detectVisitor({ userAgent: UA.iphone }).system).toBe("ios");
  });

  it("does not mistake Android for Linux", () => {
    expect(detectVisitor({ userAgent: UA.androidChrome }).system).toBe(
      "android",
    );
  });

  it("treats a touch-screen Mac user agent as an iPad", () => {
    expect(
      detectVisitor({ userAgent: UA.macSafari, maxTouchPoints: 5 }).system,
    ).toBe("ios");
    expect(
      detectVisitor({ userAgent: UA.macSafari, maxTouchPoints: 0 }).system,
    ).toBe("macos");
  });

  it("recognises the browser, with Edge before Chrome", () => {
    expect(detectVisitor({ userAgent: UA.windowsChrome }).browser).toBe(
      "chrome",
    );
    expect(detectVisitor({ userAgent: UA.windowsEdge }).browser).toBe("edge");
    expect(detectVisitor({ userAgent: UA.linuxFirefox }).browser).toBe(
      "firefox",
    );
    expect(detectVisitor({ userAgent: UA.firefoxOnIos }).browser).toBe(
      "firefox",
    );
    expect(detectVisitor({ userAgent: UA.macSafari }).browser).toBeNull();
  });

  it("returns unknown values for nothing at all", () => {
    expect(detectVisitor({})).toEqual({ system: null, browser: null });
    expect(detectVisitor({ userAgent: "curl/8.0" })).toEqual({
      system: null,
      browser: null,
    });
  });
});
