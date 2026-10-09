import { LOCALE_COOKIE, type Locale } from "@/lib/i18n/locales";
import type { MotionChoice } from "@/lib/storage/schemas";
import { THEME_COOKIE, type ThemeChoice } from "@/lib/theme";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function writeCookie(name: string, value: string | null) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const age = value === null ? 0 : ONE_YEAR_SECONDS;
  document.cookie = `${name}=${value ?? ""}; Path=/; Max-Age=${age}; SameSite=Lax${secure}`;
}

/** The cookie lets the server render the right theme with no flash. */
export function applyTheme(choice: ThemeChoice) {
  if (choice === "system") {
    delete document.documentElement.dataset.theme;
    writeCookie(THEME_COOKIE, null);
    return;
  }
  document.documentElement.dataset.theme = choice;
  writeCookie(THEME_COOKIE, choice);
}

export function applyLocale(locale: Locale) {
  document.documentElement.lang = locale;
  writeCookie(LOCALE_COOKIE, locale);
}

/** "off" means: keep animations even when the device asks for fewer. */
export function applyMotion(choice: MotionChoice) {
  if (choice === "system") delete document.documentElement.dataset.motion;
  else document.documentElement.dataset.motion = choice;
}

export function clearPreferenceCookies() {
  writeCookie(THEME_COOKIE, null);
  writeCookie(LOCALE_COOKIE, null);
}
