import { hostOf, isSharedHost, siteOf } from "./identity.ts";

const MAX_NAME_WORDS = 4;
const MAX_NAME_LENGTH = 40;

function trimPunctuation(text: string): string {
  return text.replace(/^[\s"'“”‘’(\[]+|[\s"'“”‘’)\].,;:!?]+$/g, "").trim();
}

function plausibleName(text: string): boolean {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    words.length >= 1 &&
    words.length <= MAX_NAME_WORDS &&
    text.length <= MAX_NAME_LENGTH &&
    /^[\p{Lu}\p{N}]/u.test(text)
  );
}

function repositoryName(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "github.com") return null;
    return parsed.pathname.split("/").filter(Boolean)[1] ?? null;
  } catch {
    return null;
  }
}

/**
 * A name and a description from a "Show HN" title such as
 * "Show HN: Foo – turn notes into slides". When the title carries no name, the
 * repository name or the site's own name is used.
 */
export function fromShowHn(
  title: string,
  url: string | null,
): { name: string; description: string } | null {
  const text = title.replace(/^\s*show hn\s*[:–—-]?\s*/i, "").trim();
  const split = text.split(/\s+[–—-]\s+|:\s+|\s+\|\s+/);
  const head = trimPunctuation(split[0] ?? "");
  const rest = split.slice(1).join(" – ");

  if (split.length > 1 && plausibleName(head)) {
    return { name: head, description: rest };
  }
  if (url !== null) {
    const repo = repositoryName(url);
    if (repo !== null) return { name: repo, description: text };
    const host = hostOf(url);
    if (host !== null && !isSharedHost(host)) {
      return { name: siteOf(host).split(".")[0]!, description: text };
    }
  }
  return plausibleName(head) ? { name: head, description: rest || text } : null;
}

const ANNOUNCES =
  /^(?:introducing|announcing|meet|say hello to|unveiling|launching|launches|unveils|announces)\s+(.+)$/i;
const IS_HERE = /^(.+?)\s+is\s+(?:now\s+)?(?:here|available|live|launching)\b/i;
const CUT =
  /\s+[–—-]\s+|:\s+|,\s+|\s+(?:for|with|in|to|that|is|now|from|on)\s+/i;

/** The product named in a launch headline, or null. */
export function fromAnnouncement(title: string): string | null {
  const text = title.trim();
  const lead = ANNOUNCES.exec(text)?.[1] ?? IS_HERE.exec(text)?.[1] ?? null;
  if (lead === null) return null;
  const name = trimPunctuation(
    (lead.split(CUT)[0] ?? "").replace(/^(?:(?:the|our|new|a|an)\s+)+/i, ""),
  );
  return plausibleName(name) ? name : null;
}
