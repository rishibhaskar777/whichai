import { useState, type ReactNode } from "react";
import { LocalDataProvider } from "@/components/local-data/LocalDataProvider";
import { SignInProvider } from "@/components/sign-in/SignInProvider";
import { ToastProvider } from "@/components/toast/ToastProvider";
import type { Locale } from "@/lib/i18n/locales";
import { I18nProvider } from "@/lib/i18n/provider";
import { NewPlanProvider } from "@/lib/new-plan-signal";
import { createMemoryBackend, type KvBackend } from "@/lib/storage/backend";

interface AppProvidersProps {
  backend?: KvBackend;
  locale?: Locale;
  /** Use the real storage selection (IndexedDB, localStorage, memory). */
  realStorage?: boolean;
  children: ReactNode;
}

/** Everything a component needs to save, toast and read settings in a test. */
export function AppProviders({
  backend,
  locale = "en",
  realStorage = false,
  children,
}: AppProvidersProps) {
  const [fallback] = useState(createMemoryBackend);
  return (
    <I18nProvider locale={locale}>
      <ToastProvider>
        <LocalDataProvider
          backend={realStorage ? undefined : (backend ?? fallback)}
        >
          <NewPlanProvider>
            <SignInProvider providers={{ google: false, github: false }}>
              {children}
            </SignInProvider>
          </NewPlanProvider>
        </LocalDataProvider>
      </ToastProvider>
    </I18nProvider>
  );
}
