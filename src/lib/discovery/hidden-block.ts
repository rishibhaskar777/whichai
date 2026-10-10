/*
 * A machine-readable block hidden in an issue body: JSON inside an HTML
 * comment. Writing and reading use plain string searches, never patterns, so
 * text inside the block or around it cannot change where the block starts or
 * ends.
 */

const OPEN = "<!-- ";
const CLOSE = " -->";
const BACKSLASH = String.fromCharCode(92);

/**
 * JSON text that cannot end an HTML comment. `<`, `>` and `--` only occur
 * inside JSON strings, where a unicode escape means the same thing.
 */
export function escapeJsonForComment(json: string): string {
  return json
    .replaceAll("<", `${BACKSLASH}u003c`)
    .replaceAll(">", `${BACKSLASH}u003e`)
    .replaceAll("--", `-${BACKSLASH}u002d`);
}

export function writeBlock(marker: string, json: string): string {
  return `${OPEN}${marker} ${escapeJsonForComment(json)}${CLOSE}`;
}

/**
 * The JSON text of the last block with this marker, or null. The last one
 * wins, so text above the real block cannot stand in for it.
 */
export function readBlock(body: string, marker: string): string | null {
  const opening = `${OPEN}${marker} `;
  const start = body.lastIndexOf(opening);
  if (start < 0) return null;
  const from = start + opening.length;
  const end = body.indexOf(CLOSE, from);
  return end < 0 ? null : body.slice(from, end);
}

/** How many times the text occurs, found without a pattern. */
export function countOccurrences(text: string, needle: string): number {
  if (needle === "") return 0;
  let count = 0;
  for (
    let at = text.indexOf(needle);
    at >= 0;
    at = text.indexOf(needle, at + needle.length)
  ) {
    count += 1;
  }
  return count;
}

/**
 * The text with every `open ... close` stretch removed (an unclosed one is
 * removed to the end). Used to look at what a reader sees outside comments,
 * code and links.
 */
export function removeBetween(
  text: string,
  open: string,
  close: string,
): string {
  let result = "";
  let position = 0;
  for (;;) {
    const start = text.indexOf(open, position);
    if (start < 0) return result + text.slice(position);
    result += text.slice(position, start);
    const end = text.indexOf(close, start + open.length);
    if (end < 0) return result;
    position = end + close.length;
  }
}

/** True when a `<` is followed by a letter, digit or underscore. */
export function hasTagStart(text: string): boolean {
  for (let at = text.indexOf("<"); at >= 0; at = text.indexOf("<", at + 1)) {
    const next = text[at + 1];
    if (next !== undefined && /\w/.test(next)) return true;
  }
  return false;
}
