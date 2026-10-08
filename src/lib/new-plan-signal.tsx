"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface NewPlanSignal {
  count: number;
  request: () => void;
}

const NewPlanContext = createContext<NewPlanSignal>({
  count: 0,
  request: () => {},
});

export function NewPlanProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  const value = useMemo(
    () => ({ count, request: () => setCount((current) => current + 1) }),
    [count],
  );
  return <NewPlanContext value={value}>{children}</NewPlanContext>;
}

export function useNewPlanSignal(): NewPlanSignal {
  return useContext(NewPlanContext);
}
