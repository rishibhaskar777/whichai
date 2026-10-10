import { hashText } from "../storage/hash.ts";

/** Hosts that hold many unrelated projects, so a host alone says nothing. */
const SHARED_HOSTS = [
  "github.com",
  "github.io",
  "gitlab.com",
  "huggingface.co",
  "hf.space",
  "vercel.app",
  "netlify.app",
  "pages.dev",
  "medium.com",
  "substack.com",
  "notion.site",
  "google.com",
  "youtube.com",
  "x.com",
  "twitter.com",
  "reddit.com",
  "pypi.org",
  "npmjs.com",
  "producthunt.com",
];

const SECOND_LEVEL = new Set(["co", "com", "org", "net", "gov", "ac", "edu"]);

/** Sites that publish writing and papers, not tools. A page there is not a tool's home. */
const CONTENT_HOSTS = [
  "arxiv.org",
  "medium.com",
  "substack.com",
  "youtube.com",
  "x.com",
  "twitter.com",
  "reddit.com",
  "linkedin.com",
  "wikipedia.org",
  "producthunt.com",
];

export function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function isSharedHost(host: string): boolean {
  return SHARED_HOSTS.some(
    (shared) => host === shared || host.endsWith(`.${shared}`),
  );
}

export function isContentHost(host: string): boolean {
  return CONTENT_HOSTS.some(
    (content) => host === content || host.endsWith(`.${content}`),
  );
}

/** The registrable part of a host, such as `example.co.uk`. */
export function siteOf(host: string): string {
  const labels = host.split(".");
  const last = labels[labels.length - 1]!;
  const before = labels[labels.length - 2]!;
  const keep =
    labels.length > 2 && last.length === 2 && SECOND_LEVEL.has(before) ? 3 : 2;
  return labels.slice(-keep).join(".");
}

/** `github.com/owner/repo` for a repository page, else null. */
export function repositoryKey(url: string | null): string | null {
  if (url === null) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (host === "github.com" && parts.length >= 2) {
      const repo = parts[1]!.replace(/\.git$/, "");
      return `${host}/${parts[0]}/${repo}`.toLowerCase();
    }
    if (host === "huggingface.co" && parts.length >= 2) {
      const offset = parts[0] === "spaces" || parts[0] === "datasets" ? 1 : 0;
      if (parts.length >= offset + 2) {
        return `${host}/${parts.slice(0, offset + 2).join("/")}`.toLowerCase();
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function siteKey(url: string | null): string | null {
  if (url === null) return null;
  const host = hostOf(url);
  if (host === null || isSharedHost(host)) return null;
  return siteOf(host);
}

/** Lowercase letters and digits only, for comparing names. */
export function normaliseName(name: string): string {
  return name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
}

export function slugify(name: string): string {
  const slug = name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return slug === "" ? `candidate-${hashText(name)}` : slug;
}

export function identityKeys(candidate: {
  name: string;
  homepage: string | null;
  repository: string | null;
}): string[] {
  const keys: string[] = [];
  for (const url of [candidate.repository, candidate.homepage]) {
    const repository = repositoryKey(url);
    if (repository !== null) keys.push(`repo:${repository}`);
  }
  const site = siteKey(candidate.homepage);
  if (site !== null) keys.push(`site:${site}`);
  const name = normaliseName(candidate.name);
  if (name !== "") keys.push(`name:${name}`);
  return [...new Set(keys)];
}
