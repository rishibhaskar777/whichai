/*
 * How many plans each profile has made today. Kept in the same key-value
 * backend as the preview accounts, under its own key, so Export, Import and
 * "Clear all data" never touch it. The day is the local calendar day, so it
 * resets at local midnight.
 */
import { z } from "@/lib/schemas/zod";
import type { KvBackend } from "@/lib/storage/backend";

const KEY = "plan-usage";
const MAX_PROFILES = 50;

const recordSchema = z.object({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  count: z.number().int().min(0).max(1_000_000),
});

const usageSchema = z.record(z.string().min(1).max(80), recordSchema);

type Usage = z.infer<typeof usageSchema>;

/** The local calendar day as YYYY-MM-DD. */
export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Milliseconds from `date` to the next local midnight. */
export function msUntilMidnight(date: Date): number {
  const next = new Date(date);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - date.getTime();
}

function without(usage: Usage, profile: string): Usage {
  return Object.fromEntries(
    Object.entries(usage).filter(([key]) => key !== profile),
  );
}

/** Whole hours and minutes until the next local midnight, rounded up. */
export function timeUntilMidnight(date: Date): {
  hours: number;
  minutes: number;
} {
  const total = Math.max(1, Math.ceil(msUntilMidnight(date) / 60_000));
  return { hours: Math.floor(total / 60), minutes: total % 60 };
}

/*
 * The one gate for starting a goal, like a message limit in a chat. Every way
 * of starting a goal asks canStartNewGoal() before it begins and calls
 * recordNewGoal() once the understanding card exists. Anything that works on
 * a goal already started (edit, chips, parts, level, Back, saved plans, share
 * links) never reaches it.
 */
export function canStartNewGoal(
  dailyLimit: number | null,
  usedToday: number,
): boolean {
  return dailyLimit === null || usedToday < dailyLimit;
}

/** Counts one new goal for the profile and returns today's total. */
export function recordNewGoal(
  store: UsageStore,
  profile: string,
): Promise<number> {
  return store.increment(profile);
}

export interface UsageStore {
  /** Plans made today by this profile. */
  count(profile: string): Promise<number>;
  /** Adds one and returns the new count. */
  increment(profile: string): Promise<number>;
  reset(profile: string): Promise<void>;
  /** Adds today's count from `from` to `to`, then forgets `from`. */
  transfer(from: string, to: string): Promise<void>;
  /** Forgets every profile's count. */
  clear(): Promise<void>;
}

export function createUsageStore(
  kv: KvBackend,
  now: () => Date = () => new Date(),
): UsageStore {
  // Reads then writes, so quick calls must not interleave.
  let queue: Promise<unknown> = Promise.resolve();
  function serialise<T>(job: () => Promise<T>): Promise<T> {
    const run = queue.then(job, job);
    queue = run.catch(() => undefined);
    return run;
  }

  async function read(): Promise<Usage> {
    try {
      const text = await kv.get(KEY);
      if (text === null) return {};
      const parsed = usageSchema.safeParse(JSON.parse(text));
      return parsed.success ? parsed.data : {};
    } catch {
      return {};
    }
  }

  async function write(usage: Usage): Promise<void> {
    const today = dayKey(now());
    // Counts from earlier days are worth nothing, so they are not kept.
    const current = Object.entries(usage)
      .filter(([, record]) => record.day === today)
      .slice(-MAX_PROFILES);
    try {
      await kv.set(KEY, JSON.stringify(Object.fromEntries(current)));
    } catch {
      // Storage is blocked or full. The count then lasts for this visit only.
    }
  }

  function today(usage: Usage, profile: string): number {
    const record = usage[profile];
    return record && record.day === dayKey(now()) ? record.count : 0;
  }

  return {
    count: (profile) => serialise(async () => today(await read(), profile)),

    increment: (profile) =>
      serialise(async () => {
        const usage = await read();
        const count = today(usage, profile) + 1;
        await write({ ...usage, [profile]: { day: dayKey(now()), count } });
        return count;
      }),

    reset: (profile) =>
      serialise(async () => {
        await write(without(await read(), profile));
      }),

    transfer: (from, to) =>
      serialise(async () => {
        if (from === to) return;
        const usage = await read();
        const moved = usage[from];
        const rest = without(usage, from);
        const carried = moved && moved.day === dayKey(now()) ? moved.count : 0;
        if (carried === 0) return;
        const count = today(rest, to) + carried;
        await write({ ...rest, [to]: { day: dayKey(now()), count } });
      }),

    clear: () => serialise(async () => void (await write({}))),
  };
}
