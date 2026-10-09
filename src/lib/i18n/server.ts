import { cookies } from "next/headers";
import { LOCALE_COOKIE, parseLocale, type Locale } from "./locales";
import { createI18n, type I18n } from "./translate";

export async function getLocale(): Promise<Locale> {
  return parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
}

/** The translator for server components, using the language cookie. */
export async function getI18n(): Promise<I18n> {
  return createI18n(await getLocale());
}
