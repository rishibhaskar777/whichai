"use client";

import { useRouter } from "next/navigation";
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
import { useToast } from "@/components/toast/ToastProvider";
import { useI18n } from "@/lib/i18n/provider";
import {
  applyLocale,
  applyMotion,
  applyTheme,
  clearPreferenceCookies,
} from "@/lib/preferences";
import type { GoalType } from "@/lib/schemas/plan";
import type { PlanRequest } from "@/lib/schemas/plan-request";
import { parseTheme } from "@/lib/theme";
import { openBackend, type KvBackend } from "@/lib/storage/backend";
import { MAX_SAVED_PLANS } from "@/lib/storage/limits";
import {
  addHistoryEntry,
  addPlan,
  applyImport,
  buildBackup,
  createSavedPlan,
  duplicatePlan as duplicateIn,
  removePlan,
  renamePlan as renameIn,
  restorePlan as restoreIn,
  updatePlanRequest,
  type ImportOutcome,
  type ParsedBackup,
  type PlanResult,
} from "@/lib/storage/operations";
import {
  DEFAULT_SETTINGS,
  settingsSchema,
  type LocalData,
  type SavedPlan,
  type Settings,
} from "@/lib/storage/schemas";
import { createStore, type Store, type StoreError } from "@/lib/storage/store";

export type MutationError =
  StoreError | "limit" | "invalid" | "missing" | "loading";

export type Mutation<T> =
  { ok: true; value: T } | { ok: false; error: MutationError };

interface Change<T> {
  ok: true;
  next: Partial<LocalData>;
  value: T;
}

type Compute<T> = (
  current: LocalData,
) => Change<T> | { ok: false; error: MutationError };

export interface LocalDataContextValue extends LocalData {
  /** "loading" until the first read finishes; nothing is saved before then. */
  status: "loading" | "ready";
  /** False when the browser blocks storage and data lasts only for this visit. */
  persistent: boolean;
  savePlan: (
    request: PlanRequest,
    title: string,
  ) => Promise<Mutation<SavedPlan>>;
  updatePlan: (
    id: string,
    request: PlanRequest,
  ) => Promise<Mutation<SavedPlan>>;
  renamePlan: (id: string, title: string) => Promise<Mutation<SavedPlan>>;
  duplicatePlan: (id: string, title: string) => Promise<Mutation<SavedPlan>>;
  deletePlan: (id: string) => Promise<Mutation<SavedPlan>>;
  restorePlan: (plan: SavedPlan) => Promise<Mutation<SavedPlan>>;
  recordGoal: (goal: string, goalType: GoalType | null) => Promise<void>;
  deleteHistoryEntry: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  exportBackup: () => string;
  importBackup: (
    backup: ParsedBackup,
    mode: "merge" | "replace",
  ) => Promise<Mutation<ImportOutcome>>;
  clearAll: () => Promise<Mutation<null>>;
}

const EMPTY: LocalData = { plans: [], history: [], settings: DEFAULT_SETTINGS };

const unavailable = async (): Promise<{ ok: false; error: MutationError }> => ({
  ok: false,
  error: "unavailable",
});

/* Without a provider, storage behaves as if the browser had blocked it. */
const FALLBACK: LocalDataContextValue = {
  ...EMPTY,
  status: "ready",
  persistent: false,
  savePlan: unavailable,
  updatePlan: unavailable,
  renamePlan: unavailable,
  duplicatePlan: unavailable,
  deletePlan: unavailable,
  restorePlan: unavailable,
  recordGoal: async () => {},
  deleteHistoryEntry: async () => {},
  clearHistory: async () => {},
  updateSettings: async () => {},
  exportBackup: () => JSON.stringify(buildBackup(EMPTY)),
  importBackup: unavailable,
  clearAll: unavailable,
};

const LocalDataContext = createContext<LocalDataContextValue>(FALLBACK);

export function useLocalData(): LocalDataContextValue {
  return useContext(LocalDataContext);
}

function fromPlanResult(result: PlanResult):
  | Change<SavedPlan>
  | {
      ok: false;
      error: MutationError;
    } {
  return result.ok
    ? { ok: true, next: { plans: result.plans }, value: result.plan }
    : result;
}

function currentTheme(): Settings["theme"] {
  return parseTheme(document.documentElement.dataset.theme) ?? "system";
}

interface LocalDataProviderProps {
  /** Tests pass a backend; the app opens IndexedDB or localStorage itself. */
  backend?: KvBackend;
  children: ReactNode;
}

export function LocalDataProvider({
  backend,
  children,
}: LocalDataProviderProps) {
  const { t, locale, setLocale } = useI18n();
  const { show } = useToast();
  const router = useRouter();

  const [data, setData] = useState<LocalData>(EMPTY);
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [persistent, setPersistent] = useState(true);
  const dataRef = useRef<LocalData>(EMPTY);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const [storeSlot] = useState(() => {
    let resolve!: (store: Store) => void;
    const promise = new Promise<Store>((done) => {
      resolve = done;
    });
    return { promise, resolve };
  });

  // The latest values, for callbacks that must not change identity.
  const live = useRef({ t, locale, setLocale, show, router });
  useEffect(() => {
    live.current = { t, locale, setLocale, show, router };
  });

  const report = useCallback((error: MutationError) => {
    const { t: translate, show: toast } = live.current;
    const message =
      error === "limit"
        ? translate("storage.limit", { max: MAX_SAVED_PLANS })
        : error === "full"
          ? translate("storage.full")
          : error === "unavailable"
            ? translate("storage.unavailable")
            : translate("storage.failed");
    toast({ message, tone: "error" });
  }, []);

  const applySettings = useCallback((next: Settings) => {
    const {
      locale: shown,
      setLocale: switchLocale,
      router: appRouter,
    } = live.current;
    if (next.theme !== currentTheme()) applyTheme(next.theme);
    applyMotion(next.reduceMotion);
    if (next.language !== shown) {
      applyLocale(next.language);
      switchLocale(next.language);
      appRouter.refresh();
    }
  }, []);

  const commit = useCallback((next: LocalData) => {
    dataRef.current = next;
    setData(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const store = createStore(backend ?? (await openBackend()));
      const loaded = await store.load();
      storeSlot.resolve(store);
      if (cancelled) return;

      const settings = loaded.settingsStored
        ? loaded.settings
        : {
            ...loaded.settings,
            theme: currentTheme(),
            language: live.current.locale,
          };
      applySettings(settings);
      commit({ plans: loaded.plans, history: loaded.history, settings });
      setPersistent(store.persistent);
      setStatus("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, [backend, storeSlot, applySettings, commit]);

  const enqueue = useCallback(<T,>(job: () => Promise<T>): Promise<T> => {
    const run = queue.current.then(job, job);
    queue.current = run.catch(() => undefined);
    return run;
  }, []);

  const persist = useCallback(
    async (store: Store, before: LocalData, after: LocalData) => {
      const writes = [];
      if (after.plans !== before.plans)
        writes.push(store.savePlans(after.plans));
      if (after.history !== before.history) {
        writes.push(store.saveHistory(after.history));
      }
      if (after.settings !== before.settings) {
        writes.push(store.saveSettings(after.settings));
      }
      const failed = (await Promise.all(writes)).find((result) => !result.ok);
      return failed && !failed.ok ? failed.error : null;
    },
    [],
  );

  const mutate = useCallback(
    <T,>(compute: Compute<T>, quiet = false): Promise<Mutation<T>> =>
      enqueue(async () => {
        const store = await storeSlot.promise;
        const before = dataRef.current;
        const result = compute(before);
        if (!result.ok) {
          if (!quiet) report(result.error);
          return result;
        }
        const after = { ...before, ...result.next };
        const failure = await persist(store, before, after);
        if (failure) {
          if (!quiet) report(failure);
          return { ok: false, error: failure };
        }
        commit(after);
        return { ok: true, value: result.value };
      }),
    [enqueue, storeSlot, report, persist, commit],
  );

  const updateSettings = useCallback(
    async (patch: Partial<Settings>) => {
      const before = dataRef.current;
      const settings = settingsSchema.parse({ ...before.settings, ...patch });
      applySettings(settings);
      // Settings take effect even if saving fails, so the page never disagrees
      // with what the person just chose.
      commit({ ...before, settings });
      await enqueue(async () => {
        const store = await storeSlot.promise;
        const failure = await persist(store, before, dataRef.current);
        if (failure) report(failure);
      });
    },
    [applySettings, commit, enqueue, persist, report, storeSlot],
  );

  const value = useMemo<LocalDataContextValue>(
    () => ({
      ...data,
      status,
      persistent,
      savePlan: (request, title) =>
        mutate((current) =>
          fromPlanResult(
            addPlan(current.plans, createSavedPlan(request, title)),
          ),
        ),
      updatePlan: (id, request) =>
        mutate((current) =>
          fromPlanResult(updatePlanRequest(current.plans, id, request)),
        ),
      renamePlan: (id, title) =>
        mutate((current) => fromPlanResult(renameIn(current.plans, id, title))),
      duplicatePlan: (id, title) =>
        mutate((current) =>
          fromPlanResult(duplicateIn(current.plans, id, title)),
        ),
      deletePlan: (id) =>
        mutate((current) => {
          const plan = current.plans.find((candidate) => candidate.id === id);
          return plan
            ? {
                ok: true,
                next: { plans: removePlan(current.plans, id) },
                value: plan,
              }
            : { ok: false, error: "missing" };
        }),
      restorePlan: (plan) =>
        mutate((current) => fromPlanResult(restoreIn(current.plans, plan))),
      recordGoal: async (goal, goalType) => {
        if (!dataRef.current.settings.saveHistory) return;
        await mutate(
          (current) => ({
            ok: true,
            next: {
              history: addHistoryEntry(current.history, goal, goalType),
            },
            value: null,
          }),
          true,
        );
      },
      deleteHistoryEntry: async (id) => {
        await mutate((current) => ({
          ok: true,
          next: { history: current.history.filter((entry) => entry.id !== id) },
          value: null,
        }));
      },
      clearHistory: async () => {
        await mutate(() => ({
          ok: true,
          next: { history: [] },
          value: null,
        }));
      },
      updateSettings,
      exportBackup: () => JSON.stringify(buildBackup(dataRef.current), null, 2),
      importBackup: (backup, mode) =>
        mutate((current) => {
          const outcome = applyImport(current, backup, mode);
          applySettings(outcome.data.settings);
          return { ok: true, next: outcome.data, value: outcome };
        }),
      clearAll: () =>
        enqueue(async () => {
          const store = await storeSlot.promise;
          const result = await store.clear();
          if (!result.ok) {
            report(result.error);
            return { ok: false, error: result.error } as const;
          }
          applySettings(DEFAULT_SETTINGS);
          clearPreferenceCookies();
          commit(EMPTY);
          return { ok: true, value: null } as const;
        }),
    }),
    [
      data,
      status,
      persistent,
      mutate,
      updateSettings,
      applySettings,
      enqueue,
      storeSlot,
      report,
      commit,
    ],
  );

  return <LocalDataContext value={value}>{children}</LocalDataContext>;
}
