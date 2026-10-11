export interface Glow {
  red: number;
  green: number;
  blue: number;
  /** 0 to 1 */
  alpha: number;
}

const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const FUNCTIONAL = /^rgba?\(\s*([^)]+)\)$/i;

function fromHex(digits: string): Glow {
  const full =
    digits.length <= 4
      ? [...digits].map((digit) => digit + digit).join("")
      : digits;
  const channel = (at: number) => parseInt(full.slice(at, at + 2), 16);
  return {
    red: channel(0),
    green: channel(2),
    blue: channel(4),
    alpha: full.length === 8 ? channel(6) / 255 : 1,
  };
}

function fromFunction(body: string): Glow | null {
  const parts = body
    .split(/[\s,/]+/)
    .filter(Boolean)
    .map((part) =>
      part.endsWith("%") ? Number(part.slice(0, -1)) / 100 : Number(part),
    );
  const [red, green, blue, alpha = 1] = parts;
  if (
    red === undefined ||
    green === undefined ||
    blue === undefined ||
    [red, green, blue, alpha].some(Number.isNaN)
  ) {
    return null;
  }
  return { red, green, blue, alpha };
}

/**
 * Reads a token value as the browser may serialise it: `#rrggbbaa` after CSS
 * minification, or `rgb(r g b / a)` in source order. Returns null otherwise.
 */
export function parseGlow(value: string): Glow | null {
  const text = value.trim();
  const hex = HEX.exec(text);
  if (hex?.[1]) return fromHex(hex[1]);
  const functional = FUNCTIONAL.exec(text);
  if (functional?.[1]) return fromFunction(functional[1]);
  return null;
}
