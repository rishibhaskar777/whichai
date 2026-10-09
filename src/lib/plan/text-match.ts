/*
 * Small helpers for matching what someone typed against keyword lists.
 * No dependency: the edit distance is a few lines, and goal text is short.
 */

const STOP_WORDS: ReadonlySet<string> = new Set([
  "a",
  "an",
  "the",
  "my",
  "me",
  "of",
  "to",
  "for",
  "with",
  "and",
  "or",
  "in",
  "on",
  "i",
  "is",
  "it",
  "some",
  "your",
  "our",
  "about",
  "from",
  "into",
  "at",
  "by",
]);

/** Words shorter than this must match exactly, so short words stay safe. */
const MIN_FUZZY_LENGTH = 5;

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{M}\p{N}]+/u)
    .filter((word) => word.length > 0 && !STOP_WORDS.has(word));
}

/** Optimal string alignment distance: a swapped pair of letters costs one. */
export function editDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const columns = b.length + 1;
  const table: number[][] = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: columns }, (_, column) =>
      row === 0 ? column : column === 0 ? row : 0,
    ),
  );

  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      const cost = a[row - 1] === b[column - 1] ? 0 : 1;
      let best = Math.min(
        table[row - 1]![column]! + 1,
        table[row]![column - 1]! + 1,
        table[row - 1]![column - 1]! + cost,
      );
      const swapped =
        row > 1 &&
        column > 1 &&
        a[row - 1] === b[column - 2] &&
        a[row - 2] === b[column - 1];
      if (swapped) best = Math.min(best, table[row - 2]![column - 2]! + 1);
      table[row]![column] = best;
    }
  }
  return table[a.length]![b.length]!;
}

function allowedEdits(length: number): number {
  if (length < MIN_FUZZY_LENGTH) return 0;
  return length < 9 ? 1 : 2;
}

/**
 * True when the typed word is the expected word, its plural, or a likely typo
 * of it. A typo must keep the first letter, which removes most false matches.
 */
export function wordsMatch(typed: string, expected: string): boolean {
  if (typed === expected) return true;
  if (typed === `${expected}s` || `${typed}s` === expected) return true;
  if (Math.min(typed.length, expected.length) < MIN_FUZZY_LENGTH) return false;
  if (typed[0] !== expected[0]) return false;
  return editDistance(typed, expected) <= allowedEdits(expected.length);
}

/** Index of the first place the phrase appears in the tokens, or -1. */
export function findPhrase(
  tokens: readonly string[],
  phrase: readonly string[],
): number {
  if (phrase.length === 0) return -1;
  for (let start = 0; start + phrase.length <= tokens.length; start += 1) {
    const found = phrase.every((word, offset) =>
      wordsMatch(tokens[start + offset]!, word),
    );
    if (found) return start;
  }
  return -1;
}

/** The words of a phrase, as stored in a lookup of how many goals use it. */
export function phraseKey(phrase: string): string {
  return tokenize(phrase).join(" ");
}

/**
 * Scores a list of phrases against the tokens of a goal. A phrase is worth its
 * number of words, divided by the number of goals that share it, so a word
 * every goal uses (such as "website") counts for less than one only a single
 * goal uses. A plural or typo variant of a phrase that already matched the
 * same words is not counted twice.
 */
export function scorePhrases(
  tokens: readonly string[],
  phrases: readonly string[],
  sharedBy: ReadonlyMap<string, number> = new Map(),
): { score: number; firstIndex: number } {
  let score = 0;
  let firstIndex = Number.POSITIVE_INFINITY;
  const counted = new Set<string>();
  for (const text of phrases) {
    const phrase = tokenize(text);
    const index = findPhrase(tokens, phrase);
    if (index < 0) continue;
    const span = `${index}:${phrase.length}`;
    if (counted.has(span)) continue;
    counted.add(span);
    score += phrase.length / (sharedBy.get(phrase.join(" ")) ?? 1);
    firstIndex = Math.min(firstIndex, index);
  }
  return { score, firstIndex };
}
