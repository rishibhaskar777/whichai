/*
 * Preview accounts. They exist only in this browser, in the storage layer the
 * app already uses, and they stand in for real online accounts until those
 * launch. The UI talks to the `AccountService` interface only, so a hosted
 * implementation can replace `createLocalPreviewService` without touching it.
 * See docs/decisions/0019-preview-accounts.md.
 */
import type { KvBackend } from "@/lib/storage/backend";
import {
  hashPassword,
  verifyPassword,
  type PasswordHash,
} from "./password-hash";
import {
  accountRecordSchema,
  guestProfileSchema,
  loginSchema,
  lockoutSchema,
  registerSchema,
  sessionRecordSchema,
  type AccountRecord,
  type GuestProfile,
  type LoginInput,
  type RegisterInput,
} from "./preview-schemas";
import { z } from "@/lib/schemas/zod";

/** What the interface may know about a signed-in person. */
export interface AccountUser {
  id: string;
  firstName: string;
  lastName: string;
}

export type RegisterResult =
  | { ok: true; email: string }
  | { ok: false; reason: "invalid" | "duplicate" | "storage" };

export type LoginResult =
  | { ok: true; user: AccountUser }
  | { ok: false; reason: "invalid" | "storage" }
  | { ok: false; reason: "locked"; retryAfterSeconds: number };

export interface AccountService {
  register(input: RegisterInput): Promise<RegisterResult>;
  login(input: LoginInput): Promise<LoginResult>;
  logout(): Promise<void>;
  currentUser(): Promise<AccountUser | null>;
  /** Makes (or returns) the guest profile: an id and a date, nothing else. */
  startGuest(): Promise<GuestProfile | null>;
  currentGuest(): Promise<GuestProfile | null>;
  /** Removes every account, the session and the guest profile from this browser. */
  deleteLocalData(): Promise<boolean>;
}

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_SECONDS = 30;

const KEYS = {
  accounts: "preview-accounts",
  session: "preview-session",
  guest: "preview-guest",
  lockout: "preview-lockout",
} as const;

const accountsSchema = z.array(z.unknown());

interface Dependencies {
  now?: () => number;
  randomId?: () => string;
}

function toUser(record: AccountRecord): AccountUser {
  return {
    id: record.id,
    firstName: record.firstName,
    lastName: record.lastName,
  };
}

export function createLocalPreviewService(
  kv: KvBackend,
  { now = Date.now, randomId = () => crypto.randomUUID() }: Dependencies = {},
): AccountService {
  // Reads then writes, so two quick submits must not interleave.
  let queue: Promise<unknown> = Promise.resolve();
  function serialise<T>(job: () => Promise<T>): Promise<T> {
    const run = queue.then(job, job);
    queue = run.catch(() => undefined);
    return run;
  }

  async function readJson(key: string): Promise<unknown> {
    try {
      const text = await kv.get(key);
      return text === null ? null : (JSON.parse(text) as unknown);
    } catch {
      return null;
    }
  }

  async function write(key: string, value: unknown): Promise<boolean> {
    try {
      await kv.set(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  async function remove(key: string): Promise<boolean> {
    try {
      await kv.remove(key);
      return true;
    } catch {
      return false;
    }
  }

  async function readAccounts(): Promise<AccountRecord[]> {
    const raw = accountsSchema.safeParse(await readJson(KEYS.accounts));
    if (!raw.success) return [];
    return raw.data.flatMap((item) => {
      const parsed = accountRecordSchema.safeParse(item);
      return parsed.success ? [parsed.data] : [];
    });
  }

  async function readLockout() {
    const parsed = lockoutSchema.safeParse(await readJson(KEYS.lockout));
    return parsed.success ? parsed.data : { failures: 0, lockedUntil: 0 };
  }

  // Checked for unknown emails too, so a missing account takes as long to
  // reject as a wrong password.
  let decoy: Promise<PasswordHash> | null = null;
  function decoyHash(): Promise<PasswordHash> {
    decoy ??= hashPassword(randomId());
    return decoy;
  }

  async function currentUser(): Promise<AccountUser | null> {
    const session = sessionRecordSchema.safeParse(await readJson(KEYS.session));
    if (!session.success) return null;
    const account = (await readAccounts()).find(
      (record) => record.id === session.data.userId,
    );
    return account ? toUser(account) : null;
  }

  async function register(input: RegisterInput): Promise<RegisterResult> {
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) return { ok: false, reason: "invalid" };
    const { email, password, firstName, lastName } = parsed.data;

    const accounts = await readAccounts();
    if (accounts.some((record) => record.email === email)) {
      return { ok: false, reason: "duplicate" };
    }

    const record: AccountRecord = {
      id: randomId(),
      email,
      firstName,
      lastName,
      password: await hashPassword(password),
      createdAt: new Date(now()).toISOString(),
    };
    const saved = await write(KEYS.accounts, [...accounts, record]);
    return saved ? { ok: true, email } : { ok: false, reason: "storage" };
  }

  async function login(input: LoginInput): Promise<LoginResult> {
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) return { ok: false, reason: "invalid" };
    const { email, password } = parsed.data;

    const lockout = await readLockout();
    const time = now();
    if (lockout.lockedUntil > time) {
      return {
        ok: false,
        reason: "locked",
        retryAfterSeconds: Math.ceil((lockout.lockedUntil - time) / 1000),
      };
    }

    const account = (await readAccounts()).find(
      (record) => record.email === email,
    );
    let matches = false;
    if (account) {
      matches = await verifyPassword(password, account.password);
    } else {
      await verifyPassword(password, await decoyHash());
    }

    if (!account || !matches) {
      const failures = lockout.failures + 1;
      const locked = failures >= MAX_FAILED_ATTEMPTS;
      await write(KEYS.lockout, {
        failures: locked ? 0 : failures,
        lockedUntil: locked ? time + LOCKOUT_SECONDS * 1000 : 0,
      });
      return { ok: false, reason: "invalid" };
    }

    await remove(KEYS.lockout);
    const session = {
      userId: account.id,
      startedAt: new Date(time).toISOString(),
    };
    if (!(await write(KEYS.session, session))) {
      return { ok: false, reason: "storage" };
    }
    // Signing in replaces the guest profile; there is one identity at a time.
    await remove(KEYS.guest);
    return { ok: true, user: toUser(account) };
  }

  async function currentGuest(): Promise<GuestProfile | null> {
    const parsed = guestProfileSchema.safeParse(await readJson(KEYS.guest));
    return parsed.success ? parsed.data : null;
  }

  async function startGuest(): Promise<GuestProfile | null> {
    const existing = await currentGuest();
    if (existing) return existing;
    const profile: GuestProfile = {
      id: randomId(),
      createdAt: new Date(now()).toISOString(),
    };
    return (await write(KEYS.guest, profile)) ? profile : null;
  }

  return {
    register: (input) => serialise(() => register(input)),
    login: (input) => serialise(() => login(input)),
    logout: async () => {
      await serialise(() => remove(KEYS.session));
    },
    currentUser: () => serialise(currentUser),
    startGuest: () => serialise(startGuest),
    currentGuest: () => serialise(currentGuest),
    deleteLocalData: () =>
      serialise(async () => {
        const results = await Promise.all(
          Object.values(KEYS).map((key) => remove(key)),
        );
        return results.every(Boolean);
      }),
  };
}
