import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(__dirname, "tokens.css"), "utf8");

type Rgba = [number, number, number, number];
type Palette = Record<string, string>;

function declarations(block: string): Palette {
  const palette: Palette = {};
  for (const match of block.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    const [, name, value] = match;
    if (name && value) palette[name] = value.replace(/\s+/g, " ").trim();
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

function parseColour(value: string): Rgba {
  const hex = /^#([0-9a-f]{6})$/i.exec(value);
  if (hex?.[1]) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  const rgb = /^rgb\((\d+) (\d+) (\d+)(?: \/ ([\d.]+))?\)$/.exec(value);
  if (rgb) {
    return [
      Number(rgb[1]),
      Number(rgb[2]),
      Number(rgb[3]),
      rgb[4] === undefined ? 1 : Number(rgb[4]),
    ];
  }
  throw new Error(`Unsupported colour: ${value}`);
}

function over(top: Rgba, bottom: Rgba): Rgba {
  const alpha = top[3];
  return [
    top[0] * alpha + bottom[0] * (1 - alpha),
    top[1] * alpha + bottom[1] * (1 - alpha),
    top[2] * alpha + bottom[2] * (1 - alpha),
    1,
  ];
}

function luminance([r, g, b]: Rgba): number {
  const [lr = 0, lg = 0, lb = 0] = [r, g, b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function ratio(foreground: Rgba, background: Rgba): number {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function token(palette: Palette, name: string): Rgba {
  const value = palette[name];
  if (!value) throw new Error(`Missing token: ${name}`);
  return parseColour(value);
}

const surfaces = ["bg", "sidebar", "surface", "surface-2"];

const textPairs: [string, string][] = [
  ...["text", "text-muted", "text-subtle", "accent"].flatMap((fg) =>
    surfaces.map((bg): [string, string] => [fg, bg]),
  ),
  ...[
    "status-danger",
    "status-success",
    "status-warning",
    "status-info",
  ].flatMap((fg) => ["bg", "surface"].map((bg): [string, string] => [fg, bg])),
  ["bg", "text"],
  ["on-accent", "accent"],
  ["text", "glass-solid"],
  ["text-muted", "glass-solid"],
];

const controlPairs: [string, string][] = [
  ["accent", "bg"],
  ["accent", "surface"],
];

describe.each([
  ["light", light],
  ["dark (data-theme)", dark],
  ["dark (system preference)", darkBySystem],
])("%s theme contrast", (_name, palette) => {
  it.each(textPairs)("%s on %s meets AA for text (4.5:1)", (fg, bg) => {
    expect(
      ratio(token(palette, fg), token(palette, bg)),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it.each(controlPairs)("%s on %s meets 3:1 for controls", (fg, bg) => {
    expect(
      ratio(token(palette, fg), token(palette, bg)),
    ).toBeGreaterThanOrEqual(3);
  });

  // The aurora gives its three glows one budget per pixel, so the worst case
  // is a single glow at full strength. The fallback blobs can all overlap, at
  // the strength set by --glow-fallback.
  const glows = ["glow-1", "glow-2", "glow-3"];
  const pageText = ["text", "text-muted", "text-subtle", "accent"];

  it.each(glows.flatMap((glow) => pageText.map((fg) => [glow, fg])))(
    "under %s at full strength, %s on the page background meets AA",
    (glow, fg) => {
      const backdrop = over(token(palette, glow), token(palette, "bg"));
      expect(ratio(token(palette, fg), backdrop)).toBeGreaterThanOrEqual(4.5);
    },
  );

  it.each(pageText)(
    "%s on the page background under the overlapping fallback glow meets AA",
    (fg) => {
      const strength = Number(light["glow-fallback"]);
      const backdrop = glows.reduce(
        (under, name) => {
          const [r, g, b, a] = token(palette, name);
          return over([r, g, b, a * strength], under);
        },
        token(palette, "bg"),
      );
      expect(ratio(token(palette, fg), backdrop)).toBeGreaterThanOrEqual(4.5);
    },
  );

  it.each(["text", "text-on-glass"])(
    "%s on the glass search surface over all three glows at full strength meets AA",
    (fg) => {
      const glow = ["glow-1", "glow-2", "glow-3"].reduce(
        (backdrop, name) => over(token(palette, name), backdrop),
        token(palette, "bg"),
      );
      const glass = over(token(palette, "glass-fill"), glow);
      expect(ratio(token(palette, fg), glass)).toBeGreaterThanOrEqual(4.5);
    },
  );
});

describe("dark palettes", () => {
  it("are identical for the system and manual selectors", () => {
    expect(darkBySystem).toEqual(dark);
  });
});
