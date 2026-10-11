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
  "this",
  "that",
  "these",
  "those",
  "please",
  "pls",
  "plz",
  // Hinglish filler: "mujhe resume banana hai" keeps only "resume".
  "mujhe",
  "mera",
  "meri",
  "mere",
  "hai",
  "hain",
  "ho",
  "hoon",
  "kya",
  "ka",
  "ki",
  "ke",
  "ko",
  "se",
  "par",
  "pe",
  "mein",
  "liye",
  "chahiye",
  "chaiye",
  "karna",
  "karni",
  "karne",
  "kar",
  "karo",
  "karein",
  "banana",
  "banani",
  "banane",
  "banao",
  "bana",
  "ek",
  "aur",
  "wala",
  "wali",
]);

/** What a phrase is worth when other words sit between its words. */
const GAP_WEIGHT = 0.75;

/** Words shorter than this must match exactly, so short words stay safe. */
const MIN_FUZZY_LENGTH = 5;

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{M}\p{N}]+/u)
    .filter((word) => word.length > 0 && !STOP_WORDS.has(word));
}

const phraseCache = new Map<string, string[]>();

/**
 * The words of a keyword or phrase from the catalogue. The same few thousand
 * phrases are read on every goal, so each one is split once.
 */
export function tokenizePhrase(text: string): string[] {
  let words = phraseCache.get(text);
  if (!words) {
    words = tokenize(text);
    phraseCache.set(text, words);
  }
  return words;
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
  const allowed = allowedEdits(expected.length);
  if (Math.abs(typed.length - expected.length) > allowed) return false;
  return editDistance(typed, expected) <= allowed;
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

/**
 * Where a phrase starts and ends in the tokens. With a gap, up to that many
 * other words may sit between two words of the phrase, in order, so
 * "summarise my class notes pdf" still finds "summarise pdf".
 */
export function locatePhrase(
  tokens: readonly string[],
  phrase: readonly string[],
  maxGap = 0,
): { start: number; end: number } | null {
  if (phrase.length === 0) return null;
  for (let start = 0; start < tokens.length; start += 1) {
    if (!wordsMatch(tokens[start]!, phrase[0]!)) continue;
    let end = start;
    let complete = true;
    for (let word = 1; word < phrase.length && complete; word += 1) {
      let next = -1;
      for (let at = end + 1; at <= end + 1 + maxGap; at += 1) {
        if (at < tokens.length && wordsMatch(tokens[at]!, phrase[word]!)) {
          next = at;
          break;
        }
      }
      if (next < 0) complete = false;
      else end = next;
    }
    if (complete) return { start, end };
  }
  return null;
}

/** The words of a phrase, as stored in a lookup of how many goals use it. */
export function phraseKey(phrase: string): string {
  return tokenizePhrase(phrase).join(" ");
}

/** Where a phrase was found: the first token and how many tokens it covers. */
export interface Span {
  start: number;
  length: number;
}

export interface PhraseScore {
  score: number;
  firstIndex: number;
  spans: Span[];
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
  maxGap = 0,
): PhraseScore {
  // Phrases that cover the same words count once, at their best value.
  const best = new Map<string, { span: Span; value: number }>();
  for (const text of phrases) {
    const phrase = tokenizePhrase(text);
    const exact = findPhrase(tokens, phrase);
    const found =
      exact >= 0
        ? { start: exact, end: exact + phrase.length - 1 }
        : phrase.length > 1 && maxGap > 0
          ? locatePhrase(tokens, phrase, maxGap)
          : null;
    if (!found) continue;
    const length = found.end - found.start + 1;
    // Words that sit apart are weaker evidence than words side by side.
    const spread = length === phrase.length ? 1 : GAP_WEIGHT;
    const value =
      (phrase.length * spread) / (sharedBy.get(phrase.join(" ")) ?? 1);
    const key = `${found.start}:${length}`;
    const current = best.get(key);
    if (!current || value > current.value) {
      best.set(key, { span: { start: found.start, length }, value });
    }
  }

  let score = 0;
  let firstIndex = Number.POSITIVE_INFINITY;
  const spans: Span[] = [];
  for (const { span, value } of best.values()) {
    score += value;
    spans.push(span);
    firstIndex = Math.min(firstIndex, span.start);
  }
  return { score, firstIndex, spans };
}
