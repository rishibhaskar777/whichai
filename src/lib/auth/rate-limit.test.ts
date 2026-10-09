import { describe, expect, it } from "vitest";
import { clientKey, createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("allows up to the limit in a window, then refuses", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000 });
    expect(limiter.allow("a", 0)).toBe(true);
    expect(limiter.allow("a", 1)).toBe(true);
    expect(limiter.allow("a", 2)).toBe(false);
  });

  it("counts each key separately", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(limiter.allow("a", 0)).toBe(true);
    expect(limiter.allow("b", 0)).toBe(true);
  });

  it("starts a new window once the old one ends", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(limiter.allow("a", 0)).toBe(true);
    expect(limiter.allow("a", 500)).toBe(false);
    expect(limiter.allow("a", 1000)).toBe(true);
  });

  it("stays bounded when many keys arrive", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, maxKeys: 3 });
    for (let index = 0; index < 10; index += 1) {
      expect(limiter.allow(`key-${index}`, 0)).toBe(true);
    }
  });
});

describe("clientKey", () => {
  it("uses the first forwarded address", () => {
    const headers = new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" });
    expect(clientKey(headers)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip and then a constant", () => {
    expect(clientKey(new Headers({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
    expect(clientKey(new Headers())).toBe("unknown");
  });
});
