export const LOCALES = ["en", "hi"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_COOKIE = "lang";

export function parseLocale(value: string | undefined | null): Locale {
  return LOCALES.find((locale) => locale === value) ?? DEFAULT_LOCALE;
}
