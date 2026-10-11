import { beforeEach, describe, expect, it } from "vitest";
import { createMemoryBackend, type KvBackend } from "@/lib/storage/backend";
import {
  LOCKOUT_SECONDS,
  MAX_FAILED_ATTEMPTS,
  createLocalPreviewService,
  type AccountService,
} from "./local-preview";
import { PBKDF2_ITERATIONS, constantTimeEqual } from "./password-hash";
import { registerSchema } from "./preview-schemas";

const PASSWORD = "correct horse battery";

const details = {
  email: "ada@example.org",
  password: PASSWORD,
  firstName: "Ada",
  lastName: "Lovelace",
  terms: true,
};

let kv: KvBackend;
let clock: number;
let service: AccountService;
let counter: number;

beforeEach(() => {
  kv = createMemoryBackend();
  clock = Date.UTC(2026, 9, 11, 12, 0, 0);
  counter = 0;
  service = createLocalPreviewService(kv, {
    now: () => clock,
    randomId: () => `id-${String(++counter).padStart(8, "0")}`,
  });
});

describe("register and login", () => {
  it("registers without signing in, then logs in with the same details", async () => {
    expect(await service.register(details)).toEqual({
      ok: true,
      email: "ada@example.org",
    });
    expect(await service.currentUser()).toBeNull();

    const result = await service.login({
      email: "ada@example.org",
      password: PASSWORD,
    });

    expect(result).toEqual({
      ok: true,
      user: { id: "id-00000001", firstName: "Ada", lastName: "Lovelace" },
    });
    expect(await service.currentUser()).toMatchObject({ firstName: "Ada" });
  });

  it("treats the email as case-insensitive and ignores surrounding spaces", async () => {
    await service.register({ ...details, email: "  Ada@Example.ORG " });

    const result = await service.login({
      email: "ADA@example.org",
      password: PASSWORD,
    });

    expect(result.ok).toBe(true);
  });

  it("refuses a second account with the same email", async () => {
    await service.register(details);

    expect(
      await service.register({ ...details, email: "ADA@example.org" }),
    ).toEqual({ ok: false, reason: "duplicate" });
  });

  it("gives one answer for a wrong password and an unknown email", async () => {
    await service.register(details);

    const wrongPassword = await service.login({
      email: details.email,
      password: "not the password",
    });
    const unknownEmail = await service.login({
      email: "nobody@example.org",
      password: PASSWORD,
    });

    expect(wrongPassword).toEqual({ ok: false, reason: "invalid" });
    expect(unknownEmail).toEqual(wrongPassword);
  });

  it("revalidates input even when a caller skipped the form", async () => {
    expect(await service.register({ ...details, password: "short" })).toEqual({
      ok: false,
      reason: "invalid",
    });
    expect(await service.register({ ...details, terms: false })).toEqual({
      ok: false,
      reason: "invalid",
    });
  });
});

describe("what is stored", () => {
  it("keeps a salted PBKDF2 hash and never the password", async () => {
    await service.register(details);
    await service.register({
      ...details,
      email: "grace@example.org",
      firstName: "Grace",
      lastName: "Hopper",
    });

    const text = (await kv.get("preview-accounts")) as string;
    expect(text).not.toContain(PASSWORD);
    const [first, second] = JSON.parse(text) as {
      password: {
        algorithm: string;
        iterations: number;
        salt: string;
        hash: string;
      };
    }[];
    expect(first?.password.algorithm).toBe("PBKDF2-SHA-256");
    expect(first?.password.iterations).toBe(PBKDF2_ITERATIONS);
    expect(atob(first?.password.salt ?? "")).toHaveLength(16);
    expect(first?.password.salt).not.toBe(second?.password.salt);
    expect(first?.password.hash).not.toBe(second?.password.hash);
  });

  it("stores no password in the session or the lockout record", async () => {
    await service.register(details);
    await service.login({ email: details.email, password: "wrong password" });
    await service.login({ email: details.email, password: PASSWORD });

    const everything = [
      await kv.get("preview-session"),
      await kv.get("preview-lockout"),
    ].join(" ");
    expect(everything).not.toContain(PASSWORD);
    expect(everything).not.toContain("wrong password");
  });
});

describe("failed attempts", () => {
  it("makes the person wait after five failures, then allows another try", async () => {
    await service.register(details);
    const wrong = { email: details.email, password: "not the password" };

    for (let attempt = 0; attempt < MAX_FAILED_ATTEMPTS; attempt += 1) {
      expect(await service.login(wrong)).toEqual({
        ok: false,
        reason: "invalid",
      });
    }

    // Even the right password waits while locked.
    expect(
      await service.login({ email: details.email, password: PASSWORD }),
    ).toEqual({
      ok: false,
      reason: "locked",
      retryAfterSeconds: LOCKOUT_SECONDS,
    });

    clock += 10_000;
    expect(await service.login(wrong)).toMatchObject({
      reason: "locked",
      retryAfterSeconds: 20,
    });

    clock += 20_000;
    expect(
      (await service.login({ email: details.email, password: PASSWORD })).ok,
    ).toBe(true);
  });

  it("counts a success as a fresh start", async () => {
    await service.register(details);
    const wrong = { email: details.email, password: "not the password" };
    for (let attempt = 0; attempt < MAX_FAILED_ATTEMPTS - 1; attempt += 1) {
      await service.login(wrong);
    }
    await service.login({ email: details.email, password: PASSWORD });

    for (let attempt = 0; attempt < MAX_FAILED_ATTEMPTS - 1; attempt += 1) {
      expect(await service.login(wrong)).toEqual({
        ok: false,
        reason: "invalid",
      });
    }
  });

  it("remembers the wait after the page is reloaded", async () => {
    await service.register(details);
    for (let attempt = 0; attempt < MAX_FAILED_ATTEMPTS; attempt += 1) {
      await service.login({ email: details.email, password: "nope nope" });
    }

    const reloaded = createLocalPreviewService(kv, { now: () => clock });

    expect(
      await reloaded.login({ email: details.email, password: PASSWORD }),
    ).toMatchObject({ ok: false, reason: "locked" });
  });
});

describe("logout and guests", () => {
  it("clears the session but keeps the account", async () => {
    await service.register(details);
    await service.login({ email: details.email, password: PASSWORD });

    await service.logout();

    expect(await service.currentUser()).toBeNull();
    expect(
      (await service.login({ email: details.email, password: PASSWORD })).ok,
    ).toBe(true);
  });

  it("creates a guest profile with only an id and a date", async () => {
    const guest = await service.startGuest();

    expect(guest).toEqual({
      id: "id-00000001",
      createdAt: new Date(clock).toISOString(),
    });
    expect(await service.currentGuest()).toEqual(guest);
    expect(await service.startGuest()).toEqual(guest);
  });

  it("replaces the guest profile when someone logs in", async () => {
    await service.register(details);
    await service.startGuest();

    await service.login({ email: details.email, password: PASSWORD });

    expect(await service.currentGuest()).toBeNull();
  });

  it("deletes accounts, session, guest and lockout on request", async () => {
    await service.register(details);
    await service.login({ email: details.email, password: PASSWORD });
    await service.startGuest();

    expect(await service.deleteLocalData()).toBe(true);

    expect(await service.currentUser()).toBeNull();
    expect(await service.currentGuest()).toBeNull();
    expect(await kv.get("preview-accounts")).toBeNull();
    expect(
      await service.login({ email: details.email, password: PASSWORD }),
    ).toEqual({ ok: false, reason: "invalid" });
  });
});

describe("storage trouble", () => {
  it("reports a failed save instead of pretending the account exists", async () => {
    const broken: KvBackend = {
      ...createMemoryBackend(),
      set: async () => {
        throw new Error("blocked");
      },
    };
    const failing = createLocalPreviewService(broken);

    expect(await failing.register(details)).toEqual({
      ok: false,
      reason: "storage",
    });
  });

  it("ignores damaged records", async () => {
    await kv.set("preview-accounts", "{not json");
    await kv.set("preview-session", JSON.stringify({ userId: 5 }));

    expect(await service.currentUser()).toBeNull();
    expect((await service.register(details)).ok).toBe(true);
  });
});

describe("constantTimeEqual", () => {
  it("is true only for identical bytes", () => {
    expect(
      constantTimeEqual(Uint8Array.of(1, 2, 3), Uint8Array.of(1, 2, 3)),
    ).toBe(true);
    expect(
      constantTimeEqual(Uint8Array.of(1, 2, 3), Uint8Array.of(1, 2, 4)),
    ).toBe(false);
    expect(constantTimeEqual(Uint8Array.of(1, 2), Uint8Array.of(1, 2, 0))).toBe(
      false,
    );
  });
});

describe("registration rules", () => {
  const issues = (overrides: Partial<typeof details>) => {
    const result = registerSchema.safeParse({ ...details, ...overrides });
    return result.success
      ? []
      : result.error.issues.map((issue) => [issue.path[0], issue.message]);
  };

  it("accepts a valid registration", () => {
    expect(issues({})).toEqual([]);
  });

  it("asks for at least 8 characters and at most 128, with no symbol rules", () => {
    expect(issues({ password: "abc" })).toContainEqual([
      "password",
      "auth.error.password.short",
    ]);
    expect(issues({ password: "x".repeat(129) })).toContainEqual([
      "password",
      "auth.error.password.long",
    ]);
    expect(issues({ password: "a".repeat(8) + "b" })).toEqual([]);
    expect(issues({ password: "x".repeat(128) })).toEqual([]);
  });

  it("rejects common passwords whatever their case", () => {
    expect(issues({ password: "Password123" })).toContainEqual([
      "password",
      "auth.error.password.common",
    ]);
    expect(issues({ password: "QWERTYUIOP" })).toContainEqual([
      "password",
      "auth.error.password.common",
    ]);
  });

  it("accepts names in any script, hyphens and apostrophes", () => {
    for (const name of [
      "ऋषि",
      "प्रिया शर्मा",
      "Mary-Jane",
      "O'Brien",
      "Zoë",
      "李",
    ]) {
      expect(issues({ firstName: name }), name).toEqual([]);
    }
  });

  it("rejects names with digits, symbols, or the wrong length", () => {
    for (const name of ["Ada1", "Ada_L", "<b>", "-Ada", "Ada@"]) {
      expect(issues({ firstName: name }), name).toContainEqual([
        "firstName",
        "auth.error.firstName.invalid",
      ]);
    }
    expect(issues({ lastName: "   " })).toContainEqual([
      "lastName",
      "auth.error.lastName.required",
    ]);
    expect(issues({ lastName: "a".repeat(51) })).toContainEqual([
      "lastName",
      "auth.error.lastName.long",
    ]);
    expect(issues({ lastName: "a".repeat(50) })).toEqual([]);
  });

  it("needs the terms to be accepted", () => {
    expect(issues({ terms: false })).toContainEqual([
      "terms",
      "auth.error.terms.required",
    ]);
  });
});
