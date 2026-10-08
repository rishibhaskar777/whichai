import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(__dirname, "tokens.css"), "utf8");

type Palette = Record<string, string>;

function declarations(block: string): Palette {
  const palette: Palette = {};
  for (const match of block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)) {
    const [, name, value] = match;
    if (name && value) palette[name] = value;
  }
  return palette;
}

function blockAfter(selector: string): string {
  const start = css.indexOf(selector);
  if (start === -1) throw new Error(`Selector not found: ${selector}`);
  let depth = 0;
  for (let i = css.indexOf("{", start); i < css.length; i++) {
    if (css[i] === "{") depth++;
    if (css[i] === "}" && --depth === 0) {
      return css.slice(start, i);
    }
  }
  throw new Error(`Unclosed block: ${selector}`);
}

const light = declarations(blockAfter(":root {"));
const dark = declarations(blockAfter(':root[data-theme="dark"]'));
const darkBySystem = declarations(
  blockAfter(':root:not([data-theme="light"])'),
);

function luminance(hex: string): number {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) => {
    const value = parseInt(hex.slice(i, i + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function colour(palette: Palette, name: string): string {
  const value = palette[name] ?? light[name];
  if (!value) throw new Error(`Missing token: ${name}`);
  return value;
}

const textPairs: [string, string][] = [
  ["text", "surface-page"],
  ["text", "surface-panel"],
  ["text", "surface-raised"],
  ["text", "surface-sunken"],
  ["text", "surface-hover"],
  ["text-muted", "surface-page"],
  ["text-muted", "surface-panel"],
  ["text-muted", "surface-raised"],
  ["text-muted", "surface-hover"],
  ["text-on-accent", "accent"],
  ["text-on-accent", "accent-hover"],
  ["accent-text", "surface-page"],
  ["accent-text", "surface-panel"],
  ["accent-text", "surface-raised"],
  ["accent-text", "accent-soft"],
  ["status-success", "surface-page"],
  ["status-warning", "surface-page"],
  ["status-danger", "surface-page"],
  ["status-info", "surface-page"],
  ["status-success", "surface-panel"],
  ["status-warning", "surface-panel"],
  ["status-danger", "surface-panel"],
  ["status-info", "surface-panel"],
  ["text", "glass-fill-solid"],
  ["text-muted", "glass-fill-solid"],
];

const controlPairs: [string, string][] = [
  ["border-control", "surface-page"],
  ["border-control", "surface-panel"],
  ["border-control", "surface-raised"],
  ["accent", "surface-page"],
  ["accent", "surface-panel"],
];

describe.each([
  ["light", light],
  ["dark (data-theme)", dark],
  ["dark (system preference)", darkBySystem],
])("%s theme contrast", (_name, palette) => {
  it.each(textPairs)("%s on %s meets AA for text (4.5:1)", (fg, bg) => {
    expect(
      ratio(colour(palette, fg), colour(palette, bg)),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it.each(controlPairs)("%s on %s meets 3:1 for controls", (fg, bg) => {
    expect(
      ratio(colour(palette, fg), colour(palette, bg)),
    ).toBeGreaterThanOrEqual(3);
  });
});

describe("dark palettes", () => {
  it("are identical for the system and manual selectors", () => {
    expect(darkBySystem).toEqual(dark);
  });
});
