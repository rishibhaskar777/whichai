"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { isGuestKey, useAccount } from "@/components/account/AccountProvider";
import {
  entitlementsFor,
  GUEST_TIER,
  plansRemaining,
  type Entitlements,
  type Tier,
} from "@/lib/plans/entitlements";
import {
  canStartNewGoal as gateAllows,
  createUsageStore,
  dayKey,
  msUntilMidnight,
  recordNewGoal as recordGoal,
  type UsageStore,
} from "@/lib/plans/usage";
import { getCurrentPlan } from "@/lib/pricing/current-plan";
import { PLAN_IDS } from "@/lib/pricing/schema";
import { openBackend, type KvBackend } from "@/lib/storage/backend";

const DEV_TIER_KEY = "dev-tier";

export interface EntitlementsContextValue {
  /** "loading" until this browser's account and usage have been read. */
  status: "loading" | "ready";
  tier: Tier;
  entitlements: Entitlements;
  /** Plans made today under the current profile. */
  usedToday: number;
  /** Plans left today, or null when there is no limit. */
  remaining: number | null;
  /** False when today's plans are used up. For drawing the interface. */
  canStartGoal: boolean;
  /**
   * The gate every way of starting a goal asks first. Reads the count at the
   * moment of the call, so two quick submits cannot both pass.
   */
  canStartNewGoal: () => boolean;
  /** Counts the goal whose understanding card was just made. */
  recordNewGoal: () => void;
  /** Forgets today's count for this profile. */
  resetUsage: () => Promise<void>;
  /** Forgets every profile's count. */
  clearUsage: () => Promise<void>;
  /** The tier picked in development, or null. Always null in production. */
  tierOverride: Tier | null;
  setTierOverride: (tier: Tier | null) => Promise<void>;
}

/* Without a provider nothing is limited, so isolated components stay usable. */
const FALLBACK: EntitlementsContextValue = {
  status: "ready",
  tier: "ultra",
  entitlements: entitlementsFor("ultra"),
  usedToday: 0,
  remaining: null,
  canStartGoal: true,
  canStartNewGoal: () => true,
  recordNewGoal: () => {},
  resetUsage: async () => {},
  clearUsage: async () => {},
  tierOverride: null,
  setTierOverride: async () => {},
};

const EntitlementsContext = createContext<EntitlementsContextValue>(FALLBACK);

export function useEntitlements(): EntitlementsContextValue {
  return useContext(EntitlementsContext);
}

function isTier(value: string): value is Tier {
  return (
    value === GUEST_TIER || (PLAN_IDS as readonly string[]).includes(value)
  );
}

interface EntitlementsProviderProps {
  /** Tests pass a backend; the app opens IndexedDB or localStorage itself. */
  backend?: KvBackend | undefined;
  /** Names a signed-in Google account, which the server knows and the browser does not. */
  viewerKey?: string | null;
  /** Fixes the tier instead of working it out. Used by tests. */
  tier?: Tier | undefined;
  children: ReactNode;
}

export function EntitlementsProvider({
  backend,
  viewerKey = null,
  tier: fixedTier,
  children,
}: EntitlementsProviderProps) {
  const account = useAccount();
  const profileKey = viewerKey ?? account.profileKey;
  const signedIn = viewerKey !== null || account.identity.kind === "preview";

  const [devTier, setDevTier] = useState<Tier | null>(null);
  const [day, setDay] = useState(() => dayKey(new Date()));
  const [used, setUsed] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const usedRef = useRef(0);
  const storeRef = useRef<Promise<{ usage: UsageStore; kv: KvBackend }> | null>(
    null,
  );

  const getStore = useCallback(() => {
    storeRef.current ??= (
      backend ? Promise.resolve(backend) : openBackend()
    ).then((kv) => ({ kv, usage: createUsageStore(kv) }));
    return storeRef.current;
  }, [backend]);

  const baseTier: Tier =
    fixedTier ?? (signedIn ? getCurrentPlan() : GUEST_TIER);
  const tier: Tier = devTier ?? baseTier;
  const entitlements = useMemo(() => entitlementsFor(tier), [tier]);

  // A tier picked in development survives a reload.
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    void (async () => {
      const { kv } = await getStore();
      const stored = await kv.get(DEV_TIER_KEY).catch(() => null);
      if (stored !== null && isTier(stored)) setDevTier(stored);
    })();
  }, [getStore]);

  const setTierOverride = useCallback(
    async (next: Tier | null) => {
      if (process.env.NODE_ENV !== "development") return;
      setDevTier(next);
      const { kv } = await getStore();
      try {
        if (next === null) await kv.remove(DEV_TIER_KEY);
        else await kv.set(DEV_TIER_KEY, next);
      } catch {
        // The choice then lasts until the page is closed.
      }
    },
    [getStore],
  );

  // Reads today's count for this profile. When a guest logs in, their count
  // moves to the new profile first so the day's total carries over.
  const previousKey = useRef<string | null>(null);
  useEffect(() => {
    if (account.status !== "ready") return;
    const previous = previousKey.current;
    previousKey.current = profileKey;
    let cancelled = false;
    void (async () => {
      const { usage } = await getStore();
      if (previous && previous !== profileKey && isGuestKey(previous)) {
        await usage.transfer(previous, profileKey);
      }
      const count = await usage.count(profileKey);
      if (cancelled) return;
      usedRef.current = count;
      setUsed(count);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [account.status, profileKey, day, getStore]);

  // The day resets at local midnight, even if the page stays open.
  useEffect(() => {
    const timer = window.setTimeout(
      () => setDay(dayKey(new Date())),
      msUntilMidnight(new Date()) + 500,
    );
    return () => window.clearTimeout(timer);
  }, [day]);

  const remaining = plansRemaining(entitlements, used);

  const canStartNewGoal = useCallback(
    () => gateAllows(entitlements.dailyPlans, usedRef.current),
    [entitlements.dailyPlans],
  );

  const recordNewGoal = useCallback(() => {
    usedRef.current += 1;
    setUsed(usedRef.current);
    void getStore().then(async ({ usage }) => {
      const count = await recordGoal(usage, profileKey);
      usedRef.current = Math.max(usedRef.current, count);
      setUsed(usedRef.current);
    });
  }, [getStore, profileKey]);

  const resetUsage = useCallback(async () => {
    const { usage } = await getStore();
    await usage.reset(profileKey);
    usedRef.current = 0;
    setUsed(0);
  }, [getStore, profileKey]);

  const clearUsage = useCallback(async () => {
    const { usage } = await getStore();
    await usage.clear();
    usedRef.current = 0;
    setUsed(0);
  }, [getStore]);

  const value = useMemo<EntitlementsContextValue>(
    () => ({
      status: account.status === "ready" && loaded ? "ready" : "loading",
      tier,
      entitlements,
      usedToday: used,
      remaining,
      canStartGoal: remaining === null || remaining > 0,
      canStartNewGoal,
      recordNewGoal,
      resetUsage,
      clearUsage,
      tierOverride: devTier,
      setTierOverride,
    }),
    [
      account.status,
      loaded,
      tier,
      entitlements,
      used,
      remaining,
      canStartNewGoal,
      recordNewGoal,
      resetUsage,
      clearUsage,
      devTier,
      setTierOverride,
    ],
  );

  return <EntitlementsContext value={value}>{children}</EntitlementsContext>;
}
