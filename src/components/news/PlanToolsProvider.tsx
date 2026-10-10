"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocalData } from "@/components/local-data/LocalDataProvider";
import { toolIdsOfPlan, type PlanTools } from "@/lib/news/affects-plans";

/** Runs `task` when the browser is idle, or soon after where it cannot tell. */
type MaybeIdleWindow = Window & {
  requestIdleCallback?: Window["requestIdleCallback"];
};

function scheduleWhenIdle(task: () => void): () => void {
  const { requestIdleCallback } = window as MaybeIdleWindow;
  if (requestIdleCallback) {
    const handle = requestIdleCallback.call(window, task);
    return () => window.cancelIdleCallback(handle);
  }
  const handle = window.setTimeout(task, 200);
  return () => window.clearTimeout(handle);
}

const PlanToolsContext = createContext<readonly PlanTools[]>([]);

/**
 * The tools in the person's saved plans, worked out in the browser with the
 * same engine that draws a plan. Nothing here is sent anywhere. The engine and
 * catalogue are loaded only when there is a saved plan to look at, and not
 * before the browser is idle.
 */
export function PlanToolsProvider({ children }: { children: ReactNode }) {
  const { plans } = useLocalData();
  const [computed, setComputed] = useState<{
    key: string;
    tools: PlanTools[];
  } | null>(null);
  const key = useMemo(
    () => plans.map((plan) => `${plan.id}:${plan.updatedAt}`).join(","),
    [plans],
  );

  useEffect(() => {
    if (plans.length === 0) return;
    let cancelled = false;
    const run = async () => {
      const { buildPlan } = await import("@/lib/engine/build-plan");
      if (cancelled) return;
      const tools = plans.flatMap((saved) => {
        const { goal, level, budget, toolsUsed } = saved.planRequest;
        try {
          const plan = buildPlan(goal, {
            level,
            budget,
            toolsUsed: new Set(toolsUsed),
          });
          return [
            {
              id: saved.id,
              title: saved.title,
              toolIds: toolIdsOfPlan(plan, toolsUsed),
            },
          ];
        } catch {
          return [];
        }
      });
      setComputed({ key, tools });
    };
    const cancelSchedule = scheduleWhenIdle(() => void run());
    return () => {
      cancelled = true;
      cancelSchedule();
    };
  }, [plans, key]);

  const value = useMemo(
    () => (plans.length > 0 && computed?.key === key ? computed.tools : []),
    [plans.length, computed, key],
  );

  return (
    <PlanToolsContext.Provider value={value}>
      {children}
    </PlanToolsContext.Provider>
  );
}

export function usePlanTools(): readonly PlanTools[] {
  return useContext(PlanToolsContext);
}
