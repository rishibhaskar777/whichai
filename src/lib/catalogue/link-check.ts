import { isOfficialLink, isStoreUrl } from "./links.ts";

/*
 * Pure helpers for the link checker (`npm run links:check`). The network part
 * lives in scripts/check-links.ts. This file only imports from ./links.ts so
 * Node can run it without a build step.
 */

export type LinkOutcome =
  /** Reached an official page. */
  | "ok"
  /** Reached an official page, at a different address than the one stored. */
  | "redirected"
  /** Ended up on a domain that is not the tool's or an official store. */
  | "left-domain"
  /** The page was reached, but its title does not name the tool. */
  | "name-mismatch"
  /** The site refused automated requests, so nothing can be said. */
  | "blocked"
  /** No answer at all (timeout, connection reset). Try again from another network. */
  | "unreachable"
  | "broken";

export interface Fetched {
  status: number | null;
  finalUrl: string | null;
  title: string | null;
  error: string | null;
}

export interface Subject {
  officialDomains: readonly string[];
  /** Words that should appear in the title of an app store or model page. */
  names: readonly string[];
}

const BLOCKING_STATUSES = new Set([401, 403, 429, 451, 503]);

/** Network errors that mean a site would not talk to a script, not that it is gone. */
const BLOCKING_ERRORS = new Set(["UND_ERR_HEADERS_OVERFLOW"]);

/** Errors that say nothing about whether the page exists. */
const SILENT_ERRORS = [
  "timeout",
  "fetch failed",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_SOCKET",
  "ECONNRESET",
  "ETIMEDOUT",
];

/** Titles that bot protection serves in place of the real page. */
const CHALLENGE_TITLE =
  /^(?:just a moment|attention required|client challenge|captcha challenge|making sure you|access denied)/i;

function squash(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

function sameAddress(a: string, b: string): boolean {
  const normal = (value: string) => {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    const path = url.pathname.replace(/\/+$/, "");
    return `${host}${path}${url.search}`;
  };
  return normal(a) === normal(b);
}

/**
 * App store and model pages are shared hosts, so the host proves nothing about
 * who published the page. The title has to name the tool or its company.
 */
export function titleNamesSubject(
  title: string,
  names: readonly string[],
): boolean {
  const haystack = squash(title);
  const words = new Set(
    title
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter(Boolean),
  );
  return names.some((name) => {
    const needle = squash(name);
    // A very short name only counts as a whole word, so "vn" is not found in
    // "environment".
    if (needle.length < 4) return needle.length >= 2 && words.has(needle);
    return haystack.includes(needle);
  });
}

export function classify(
  storedUrl: string,
  fetched: Fetched,
  subject: Subject,
): LinkOutcome {
  if (fetched.error !== null && BLOCKING_ERRORS.has(fetched.error)) {
    return "blocked";
  }
  if (
    fetched.error !== null &&
    SILENT_ERRORS.some((e) => fetched.error?.includes(e))
  ) {
    return "unreachable";
  }
  if (fetched.error !== null || fetched.status === null) return "broken";
  if (BLOCKING_STATUSES.has(fetched.status)) return "blocked";
  if (fetched.title && CHALLENGE_TITLE.test(fetched.title)) return "blocked";
  if (fetched.status >= 400 || !fetched.finalUrl) return "broken";

  if (!isOfficialLink(fetched.finalUrl, subject.officialDomains)) {
    return "left-domain";
  }
  const needsTitle =
    isStoreUrl(storedUrl) && subject.names.length > 0 && fetched.title;
  if (needsTitle && !titleNamesSubject(fetched.title ?? "", subject.names)) {
    return "name-mismatch";
  }
  return sameAddress(storedUrl, fetched.finalUrl) ? "ok" : "redirected";
}

/** Replaces `linkCheckedOn` for one address inside a prettier-formatted file. */
export function stampLink(
  fileText: string,
  url: string,
  date: string,
): { text: string; changed: boolean } {
  const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `("url": "${escaped}",\\s*"linkCheckedOn": )(null|"[0-9-]+")`,
    "g",
  );
  let changed = false;
  const text = fileText.replace(pattern, (_match, head: string) => {
    changed = true;
    return `${head}"${date}"`;
  });
  return { text, changed };
}
