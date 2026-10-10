/*
 * Everything a source returns is text from strangers. It is cleaned before it
 * is stored, shown in an issue or copied into a draft record. The rules:
 * limited length, no control or invisible characters, no angle brackets (so a
 * stranger cannot write our hidden marker or an HTML comment), no backticks
 * (so text cannot leave a code span), and only plain https links.
 */

// Control, format (zero-width and bidi overrides), line and paragraph separators.
const INVISIBLE_ALL = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu;
const INVISIBLE_ANY = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/u;

export const NAME_LENGTH = 60;
export const DESCRIPTION_LENGTH = 300;
export const URL_LENGTH = 300;

/** Single-line plain text of at most `max` characters. */
export function cleanText(input: unknown, max: number): string {
  if (typeof input !== "string") return "";
  const text = input
    .slice(0, max * 4)
    .normalize("NFKC")
    .replace(INVISIBLE_ALL, " ")
    .replaceAll("<", " ")
    .replaceAll(">", " ")
    .replace(/`/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** A name that is safe in an issue title: letters, digits and a few marks. */
export function titleSafeName(name: string): string {
  return cleanText(name, NAME_LENGTH)
    .replace(/[^\p{L}\p{N} .+_-]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Text for a Markdown code span. Backticks are already gone from clean text. */
export function codeSpan(text: string, max = NAME_LENGTH): string {
  const clean = cleanText(text, max);
  return clean === "" ? "`(none)`" : `\`${clean}\``;
}

/** Letters, digits and a little punctuation, as in a GitHub login. */
export function cleanHandle(input: unknown): string | null {
  if (typeof input !== "string") return null;
  return /^[A-Za-z0-9][A-Za-z0-9._-]{0,38}$/.test(input) ? input : null;
}

const LOCAL_SUFFIXES = [".local", ".localhost", ".internal", ".lan", ".home"];

/**
 * An https address a person may be sent to, or null. No credentials, no port,
 * no IP address, no single-label host, no fragment, and no characters that
 * could end a Markdown link or an autolink.
 */
export function safeHttpsUrl(input: unknown): string | null {
  if (typeof input !== "string" || input.length > URL_LENGTH * 2) return null;
  if (INVISIBLE_ANY.test(input.trim())) return null;
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.username !== "" || url.password !== "" || url.port !== "") {
    return null;
  }

  const host = url.hostname;
  if (!host.includes(".") || host.includes(":")) return null;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return null;
  if (LOCAL_SUFFIXES.some((suffix) => host.endsWith(suffix))) return null;

  url.hash = "";
  const href = url.href
    .replace(/`/g, "%60")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replaceAll("<", "%3C")
    .replaceAll(">", "%3E");
  return href.length > URL_LENGTH ? null : href;
}

/** A link for an issue body: a plain autolink, or the word "none". */
export function linkOrNone(url: string | null): string {
  const safe = url === null ? null : safeHttpsUrl(url);
  return safe === null ? "none" : `<${safe}>`;
}
