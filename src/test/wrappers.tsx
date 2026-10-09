import { useState, type ReactNode } from "react";
import { LocalDataProvider } from "@/components/local-data/LocalDataProvider";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { NewPlanProvider } from "@/lib/new-plan-signal";
import { createMemoryBackend, type KvBackend } from "@/lib/storage/backend";

interface AppProvidersProps {
  backend?: KvBackend;
  children: ReactNode;
}

/** Everything a component needs to save, toast and read settings in a test. */
export function AppProviders({ backend, children }: AppProvidersProps) {
  const [fallback] = useState(createMemoryBackend);
  return (
    <ToastProvider>
      <LocalDataProvider backend={backend ?? fallback}>
        <NewPlanProvider>{children}</NewPlanProvider>
      </LocalDataProvider>
    </ToastProvider>
  );
}
