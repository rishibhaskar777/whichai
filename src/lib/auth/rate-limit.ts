interface RateLimiterOptions {
  limit: number;
  windowMs: number;
  maxKeys?: number;
}

interface Window {
  count: number;
  resetAt: number;
}

export interface RateLimiter {
  allow(key: string, nowMs?: number): boolean;
}

const DEFAULT_MAX_KEYS = 10_000;

/*
 * Fixed-window counter held in this process's memory. It slows down a single
 * client on a single server instance. It resets on restart and is not shared
 * between instances (see docs/decisions/0008-sign-in.md).
 */
export function createRateLimiter({
  limit,
  windowMs,
  maxKeys = DEFAULT_MAX_KEYS,
}: RateLimiterOptions): RateLimiter {
  const windows = new Map<string, Window>();

  function prune(nowMs: number) {
    for (const [key, window] of windows) {
      if (window.resetAt <= nowMs) windows.delete(key);
    }
    if (windows.size >= maxKeys) windows.clear();
  }

  return {
    allow(key, nowMs = Date.now()) {
      const current = windows.get(key);
      if (!current || current.resetAt <= nowMs) {
        if (windows.size >= maxKeys) prune(nowMs);
        windows.set(key, { count: 1, resetAt: nowMs + windowMs });
        return true;
      }
      current.count += 1;
      return current.count <= limit;
    },
  };
}

/* The first address in x-forwarded-for is the client when a trusted proxy sets it. */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "unknown";
}

export const signInLimiter = createRateLimiter({ limit: 20, windowMs: 60_000 });
export const callbackLimiter = createRateLimiter({
  limit: 20,
  windowMs: 60_000,
});
export const signOutLimiter = createRateLimiter({
  limit: 20,
  windowMs: 60_000,
});
