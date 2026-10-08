export const THEME_COOKIE = "theme";

export type Theme = "light" | "dark";

export type ThemeChoice = Theme | "system";

export function parseTheme(value: string | undefined): Theme | undefined {
  return value === "light" || value === "dark" ? value : undefined;
}
