import { describe, expect, it } from "vitest";
import { en } from "./en";
import { hi } from "./hi";
import { DEFAULT_LOCALE, LOCALES, parseLocale } from "./locales";
import { createI18n } from "./translate";

const PLACEHOLDER = /\{(\w+)\}/g;
const keys = Object.keys(en) as (keyof typeof en)[];

function placeholders(text: string): string[] {
  return [...text.matchAll(PLACEHOLDER)].map((match) => match[1] ?? "").sort();
}

describe("dictionaries", () => {
  it("define the same keys in English and Hindi", () => {
    expect(Object.keys(hi).sort()).toEqual(Object.keys(en).sort());
  });

  it("use the same placeholders in every language", () => {
    for (const key of keys) {
      expect(placeholders(hi[key]), key).toEqual(placeholders(en[key]));
    }
  });

  it("have no empty strings", () => {
    for (const key of keys) {
      expect(en[key].trim(), key).not.toBe("");
      expect(hi[key].trim(), key).not.toBe("");
    }
  });

  it("give every plural group both forms", () => {
    const bases = keys
      .filter((key) => key.endsWith(".one"))
      .map((key) => key.slice(0, -4));
    expect(bases.length).toBeGreaterThan(0);
    for (const base of bases) {
      expect(en, base).toHaveProperty(`${base}.other`);
      expect(hi, base).toHaveProperty(`${base}.one`);
      expect(hi, base).toHaveProperty(`${base}.other`);
    }
  });

  it("write Hindi interface text in Devanagari", () => {
    expect(hi["nav.home"]).toMatch(/[ऀ-ॿ]/);
    expect(hi["settings.title"]).toMatch(/[ऀ-ॿ]/);
  });
});

describe("translator", () => {
  it("fills placeholders and leaves unknown ones visible", () => {
    const { t } = createI18n("en");
    expect(t("projects.rename", { title: "Site" })).toBe("Rename Site");
    expect(t("projects.rename")).toBe("Rename {title}");
  });

  it("speaks Hindi when asked", () => {
    expect(createI18n("hi").t("nav.projects")).toBe("प्रोजेक्ट");
  });

  it("picks plural forms", () => {
    const { tn } = createI18n("en");
    expect(tn("projects.count", 1)).toBe("1 saved plan");
    expect(tn("projects.count", 3)).toBe("3 saved plans");
  });

  it("puts rich parts in place", () => {
    const parts = createI18n("en").rich("job.chooseIf", {
      tool: "Tool",
      reason: "you want speed",
    });
    expect(Array.isArray(parts)).toBe(true);
    expect(JSON.stringify(parts)).toContain("you want speed");
  });

  it("formats numbers and dates for the language", () => {
    const english = createI18n("en");
    const hindi = createI18n("hi");
    expect(english.formatNumber(1234567)).toBe("12,34,567");
    expect(hindi.formatNumber(1234567)).toBe("12,34,567");
    expect(english.formatDate("2026-01-15", "long", "UTC")).toBe(
      "15 January 2026",
    );
    expect(hindi.formatDate("2026-01-15", "long", "UTC")).toContain("जनवरी");
  });
});

describe("locale cookie", () => {
  it("accepts supported languages and falls back to English", () => {
    for (const locale of LOCALES) expect(parseLocale(locale)).toBe(locale);
    for (const bad of [undefined, null, "", "fr", "HI", "hi-IN", "<script>"]) {
      expect(parseLocale(bad)).toBe(DEFAULT_LOCALE);
    }
  });
});
