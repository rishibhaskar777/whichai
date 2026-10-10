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
  const OPEN = "<![CDATA[";
  const CLOSE = "]]>";
  let result = "";
  let position = 0;
  for (;;) {
    const start = raw.indexOf(OPEN, position);
    const end = start === -1 ? -1 : raw.indexOf(CLOSE, start + OPEN.length);
    if (end === -1) break;
    result += decodeEntities(raw.slice(position, start));
    result += raw.slice(start + OPEN.length, end);
    position = end + CLOSE.length;
  }
  return result + decodeEntities(raw.slice(position));
}

/** Elements that separate words, so their removal leaves a space. */
const SPACING_TAGS = new Set([
  "p",
  "br",
  "div",
  "li",
  "ul",
  "ol",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "tr",
  "td",
  "th",
  "pre",
  "blockquote",
  "hr",
  "section",
  "article",
]);

/** Elements whose content is code, not text, and is dropped with the tags. */
const CODE_TAGS = new Set(["script", "style"]);

function isNameCharacter(character: string | undefined): boolean {
  return (
    character !== undefined &&
    ((character >= "a" && character <= "z") ||
      (character >= "A" && character <= "Z") ||
      (character >= "0" && character <= "9"))
  );
}

function startsTag(character: string | undefined): boolean {
  return (
    character !== undefined &&
    ((character >= "a" && character <= "z") ||
      (character >= "A" && character <= "Z") ||
      character === "/" ||
      character === "!" ||
      character === "?")
  );
}

/** The lower-case element name after `<` or `</`, or "" if there is none. */
function elementNameAt(text: string, from: number): string {
  let start = from;
  if (text[start] === "/") start += 1;
  let end = start;
  while (isNameCharacter(text[end])) end += 1;
  return text.slice(start, end).toLowerCase();
}

/** Index just past the `>` of the next `</name ...>`, or -1 if there is none. */
function endOfClosingTag(text: string, name: string, from: number): number {
  let at = text.indexOf("</", from);
  while (at !== -1) {
    const next = at + 2;
    const candidate = text.slice(next, next + name.length).toLowerCase();
    if (candidate === name && !isNameCharacter(text[next + name.length])) {
      const close = text.indexOf(">", next + name.length);
      return close === -1 ? text.length : close + 1;
    }
    at = text.indexOf("</", next);
  }
  return -1;
}

/**
 * Removes markup by scanning the text once, with no pattern matching. A `<`
 * before a letter, `/`, `!` or `?` starts a tag that runs to the next `>`, or
 * to the end of the text if there is none; any other `<` is just dropped. A `<` met inside a tag is not part of it: the earlier `<` is
 * dropped and the scan restarts there, so `<scr<script>ipt>` cannot join
 * into a tag. Comments and the content of script and style elements are
 * dropped with their delimiters. Neither `<` nor `>` is ever output, because
 * the result is plain text.
 */
export function stripMarkup(text: string): string {
  const length = text.length;
  let output = "";
  let position = 0;

  while (position < length) {
    const open = text.indexOf("<", position);
    const plain =
      open === -1 ? text.slice(position) : text.slice(position, open);
    output += plain.split(">").join("");
    if (open === -1) break;

    if (text.startsWith("<!--", open)) {
      const end = text.indexOf("-->", open + 4);
      output += " ";
      position = end === -1 ? length : end + 3;
      continue;
    }

    // As in browsers, `<` begins a tag only before a letter, `/`, `!` or `?`.
    // Anywhere else it is a lone character: dropped, and the text goes on.
    if (!startsTag(text[open + 1])) {
      position = open + 1;
      continue;
    }

    let close = open + 1;
    while (close < length && text[close] !== ">" && text[close] !== "<") {
      close += 1;
    }
    if (close >= length) break;
    if (text[close] === "<") {
      // The first `<` is only a character; what follows it is read again.
      position = open + 1;
      continue;
    }

    const name = elementNameAt(text, open + 1);
    const isClosing = text[open + 1] === "/";
    if (!isClosing && CODE_TAGS.has(name)) {
      const end = endOfClosingTag(text, name, close + 1);
      output += " ";
      position = end === -1 ? length : end;
      continue;
    }
    if (SPACING_TAGS.has(name)) output += " ";
    position = close + 1;
  }
  return output;
}

function collapse(text: string): string {
  return text.replace(/[\s ]+/g, " ").trim();
}

/** The text of a feed element's raw content: no tags, no entities, one line. */
export function toPlainText(raw: string): string {
  const html = unwrapCdata(raw.slice(0, MAX_INPUT_CHARS));
  // Entities can decode to markup, so stripping runs again after decoding.
  const stripped = stripMarkup(decodeEntities(stripMarkup(html)));
  // Control characters have no place in a headline.
  return collapse(stripped.replace(/[\u0000-\u001f]/g, " "));
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
