/*
 * Turns feed markup into plain text. Output is only ever rendered as text, so
 * the goal is readable text, not sanitised HTML.
 */

/** Feeds can carry whole articles; only the start can reach a summary. */
const MAX_INPUT_CHARS = 20_000;

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  copy: "©",
};

function fromCodePoint(code: number): string {
  const valid = Number.isInteger(code) && code > 0 && code <= 0x10ffff;
  const surrogate = code >= 0xd800 && code <= 0xdfff;
  return valid && !surrogate ? String.fromCodePoint(code) : "";
}

/** Decodes the XML entities and the common HTML ones. Nothing is fetched. */
export function decodeEntities(text: string): string {
  return text.replace(
    /&(?:#(\d{1,7})|#[xX]([0-9a-fA-F]{1,6})|([a-zA-Z]{2,8}));/g,
    (match, decimal?: string, hex?: string, name?: string) => {
      if (decimal !== undefined) return fromCodePoint(Number(decimal));
      if (hex !== undefined) return fromCodePoint(Number.parseInt(hex, 16));
      return NAMED_ENTITIES[(name ?? "").toLowerCase()] ?? match;
    },
  );
}

/**
 * Resolves CDATA sections. Text outside one is entity-encoded, text inside
 * is raw, so the two are decoded differently.
 */
function unwrapCdata(raw: string): string {
  let result = "";
  let position = 0;
  for (const match of raw.matchAll(/<!\[CDATA\[([\s\S]*?)\]\]>/g)) {
    result += decodeEntities(raw.slice(position, match.index));
    result += match[1] ?? "";
    position = match.index + match[0].length;
  }
  return result + decodeEntities(raw.slice(position));
}

function removeMarkup(html: string): string {
  return html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/<(script|style)\b[\s\S]*$/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(
      /<\/?(?:p|br|div|li|ul|ol|h[1-6]|tr|td|th|pre|blockquote|hr|section|article)\b[^>]*>/gi,
      " ",
    )
    .replace(/<\/?[a-zA-Z!?][^>]*>/g, "");
}

function collapse(text: string): string {
  return text.replace(/[\s ]+/g, " ").trim();
}

/** The text of a feed element's raw content: no tags, no entities, one line. */
export function toPlainText(raw: string): string {
  const html = unwrapCdata(raw.slice(0, MAX_INPUT_CHARS));
  const stripped = removeMarkup(html);
  // Control characters have no place in a headline.
  return collapse(decodeEntities(stripped).replace(/[\u0000-\u001f]/g, " "));
}

/** Cuts at a word boundary where one is near, and marks the cut. */
export function truncate(text: string, limit: number): string {
  const characters = Array.from(text);
  if (characters.length <= limit) return text;
  const cut = characters.slice(0, limit - 1).join("");
  const space = cut.lastIndexOf(" ");
  const head = space >= limit * 0.6 ? cut.slice(0, space) : cut;
  return `${head.replace(/[\s,.;:–—-]+$/, "")}…`;
}
