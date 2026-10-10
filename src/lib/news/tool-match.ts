import type { ToolName } from "./types";

/**
 * Names that are also ordinary words. A headline that says "make" or "later"
 * is almost never about the tool, so these match through the source's own
 * `toolIds` only.
 */
const COMMON_WORDS = new Set([
  "bolt",
  "brave",
  "consensus",
  "fathom",
  "ghost",
  "later",
  "luma",
  "make",
  "motion",
  "neon",
  "payload",
  "pitch",
  "poe",
  "render",
  "runway",
  "spline",
  "tally",
  "teal",
]);

const MIN_NAME_LENGTH = 3;

function escapeForRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
}

export type ToolMatcher = (text: string) => string[];

/**
 * Finds catalogue tools named in a headline. Matching is whole-word and
 * case-sensitive, so "Cursor" matches and "cursor position" does not.
 */
export function createToolMatcher(tools: readonly ToolName[]): ToolMatcher {
  const patterns = tools
    .filter(
      ({ name }) =>
        name.length >= MIN_NAME_LENGTH && !COMMON_WORDS.has(name.toLowerCase()),
    )
    .map(({ id, name }) => ({
      id,
      pattern: new RegExp(
        `(?<![\\p{L}\\p{N}])${escapeForRegExp(name)}(?![\\p{L}\\p{N}])`,
        "u",
      ),
    }));

  return (text) =>
    patterns.filter(({ pattern }) => pattern.test(text)).map(({ id }) => id);
}
