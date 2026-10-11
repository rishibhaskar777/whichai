import { useState, type ReactNode } from "react";
import { AccountProvider } from "@/components/account/AccountProvider";
import { EntitlementsProvider } from "@/components/entitlements/EntitlementsProvider";
import { LocalDataProvider } from "@/components/local-data/LocalDataProvider";
import { SignInProvider } from "@/components/sign-in/SignInProvider";
import { ToastProvider } from "@/components/toast/ToastProvider";
import type { Locale } from "@/lib/i18n/locales";
import { I18nProvider } from "@/lib/i18n/provider";
import { NewPlanProvider } from "@/lib/new-plan-signal";
import type { Tier } from "@/lib/plans/entitlements";
import { createMemoryBackend, type KvBackend } from "@/lib/storage/backend";

interface AppProvidersProps {
  backend?: KvBackend;
  locale?: Locale;
  /** Use the real storage selection (IndexedDB, localStorage, memory). */
  realStorage?: boolean;
  /**
   * The tier to test as. Paid by default so a test sees every feature; pass
   * "derived" to work the tier out from who is signed in, as the app does.
   */
  tier?: Tier | "derived";
  children: ReactNode;
}

/** Everything a component needs to save, toast and read settings in a test. */
export function AppProviders({
  backend,
  locale = "en",
  realStorage = false,
  tier = "ultra",
  children,
}: AppProvidersProps) {
  const [fallback] = useState(createMemoryBackend);
  const kv = realStorage ? undefined : (backend ?? fallback);
  return (
    <I18nProvider locale={locale}>
      <ToastProvider>
        <AccountProvider backend={kv}>
          <EntitlementsProvider
            backend={kv}
            tier={tier === "derived" ? undefined : tier}
          >
            <LocalDataProvider backend={kv}>
              <NewPlanProvider>
                <SignInProvider providers={{ google: false, github: false }}>
                  {children}
                </SignInProvider>
              </NewPlanProvider>
            </LocalDataProvider>
          </EntitlementsProvider>
        </AccountProvider>
      </ToastProvider>
    </I18nProvider>
  );
}
