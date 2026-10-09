"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_LOCALE, type Locale } from "./locales";
import { createI18n, type I18n } from "./translate";

export interface I18nContextValue extends I18n {
  /** Switches the interface language now. Persisting it is the caller's job. */
  setLocale: (locale: Locale) => void;
}

/* Without a provider (some tests, error boundaries) the app speaks English. */
const FALLBACK: I18nContextValue = {
  ...createI18n(DEFAULT_LOCALE),
  setLocale: () => {},
};

const I18nContext = createContext<I18nContextValue>(FALLBACK);

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}

interface I18nProviderProps {
  locale: Locale;
  children: ReactNode;
}

export function I18nProvider({
  locale: serverLocale,
  children,
}: I18nProviderProps) {
  const [locale, setLocale] = useState(serverLocale);
  const [seenServerLocale, setSeenServerLocale] = useState(serverLocale);

  // A refresh after a language change delivers the new locale from the server.
  if (seenServerLocale !== serverLocale) {
    setSeenServerLocale(serverLocale);
    setLocale(serverLocale);
  }

  const value = useMemo(() => ({ ...createI18n(locale), setLocale }), [locale]);
  return <I18nContext value={value}>{children}</I18nContext>;
}
