"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface PendingGoal {
  text: string;
  /** Changes on every request so the same text can be run twice in a row. */
  token: number;
}

interface NewPlanSignal {
  count: number;
  request: () => void;
  /** A goal waiting for the home page to pick it up. Never put in the URL. */
  pendingGoal: PendingGoal | null;
  startGoal: (text: string) => void;
  consumeGoal: () => void;
}

const NewPlanContext = createContext<NewPlanSignal>({
  count: 0,
  request: () => {},
  pendingGoal: null,
  startGoal: () => {},
  consumeGoal: () => {},
});

export function NewPlanProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  const [pendingGoal, setPendingGoal] = useState<PendingGoal | null>(null);

  const request = useCallback(() => setCount((current) => current + 1), []);
  const startGoal = useCallback(
    (text: string) =>
      setPendingGoal((current) => ({ text, token: (current?.token ?? 0) + 1 })),
    [],
  );
  const consumeGoal = useCallback(() => setPendingGoal(null), []);

  const value = useMemo(
    () => ({ count, request, pendingGoal, startGoal, consumeGoal }),
    [count, request, pendingGoal, startGoal, consumeGoal],
  );
  return <NewPlanContext value={value}>{children}</NewPlanContext>;
}

export function useNewPlanSignal(): NewPlanSignal {
  return useContext(NewPlanContext);
}
