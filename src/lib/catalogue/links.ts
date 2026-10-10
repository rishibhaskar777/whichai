import type { GetItLinkKey, Platform, Tool } from "../schemas/catalogue";

/*
 * Link rules for the catalogue. Download links are the riskiest data on the
 * site, so every address must sit on a domain that belongs to the tool or on
 * an official app store. This file only imports types so Node can run it
 * without a build step (the link checker does).
 */

/** Official stores, where an app page may live whoever publishes the app. */
export const OFFICIAL_STORE_HOSTS: readonly string[] = [
  "play.google.com",
  "apps.apple.com",
  "chromewebstore.google.com",
  "addons.mozilla.org",
  "microsoftedge.microsoft.com",
  "marketplace.visualstudio.com",
  "plugins.jetbrains.com",
  "apps.microsoft.com",
  "huggingface.co",
];

/** Never allowed, even if a record lists one as a domain by mistake. */
export const URL_SHORTENER_HOSTS: readonly string[] = [
  "bit.ly",
  "t.co",
  "tinyurl.com",
  "goo.gl",
  "ow.ly",
  "is.gd",
  "buff.ly",
  "cutt.ly",
  "rebrand.ly",
  "shorturl.at",
  "t.ly",
  "rb.gy",
  "lnkd.in",
  "amzn.to",
  "youtu.be",
];

export interface ToolLink {
  key: GetItLinkKey | "officialUrl";
  url: string;
  linkCheckedOn: string | null;
}

/**
 * The platform a link key stands for, when it stands for one. `web` is the
 * tool's own page, which may be a web app or just its download page.
 */
export const PLATFORM_OF_LINK: Partial<Record<GetItLinkKey, Platform>> = {
  windows: "windows",
  macos: "macos",
  linux: "linux",
  android: "android",
  ios: "ios",
};

function hostOf(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed.hostname.toLowerCase() : null;
  } catch {
    return null;
  }
}

function matchesDomain(url: URL, domain: string): boolean {
  const [host = "", owner] = domain.split("/");
  const onHost = url.hostname === host || url.hostname.endsWith(`.${host}`);
  if (!onHost) return false;
  if (owner === undefined) return true;
  const path = url.pathname.toLowerCase();
  const prefix = `/${owner.toLowerCase()}`;
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function isShortener(url: string): boolean {
  const host = hostOf(url);
  return host !== null && URL_SHORTENER_HOSTS.includes(host);
}

export function isStoreUrl(url: string): boolean {
  const host = hostOf(url);
  return host !== null && OFFICIAL_STORE_HOSTS.includes(host);
}

/** True for an https address on one of the tool's domains. */
export function isOnToolDomain(
  url: string,
  officialDomains: readonly string[],
): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:" || isShortener(url)) return false;
  return officialDomains.some((domain) => matchesDomain(parsed, domain));
}

/** True for an address on a tool domain or on an official store. */
export function isOfficialLink(
  url: string,
  officialDomains: readonly string[],
): boolean {
  if (isShortener(url)) return false;
  return isStoreUrl(url) || isOnToolDomain(url, officialDomains);
}

/** Every address a tool record carries, with the field it came from. */
export function toolLinks(
  tool: Pick<Tool, "officialUrl" | "getIt">,
): ToolLink[] {
  const links: ToolLink[] = [
    { key: "officialUrl", url: tool.officialUrl, linkCheckedOn: null },
  ];
  for (const [key, entry] of Object.entries(tool.getIt ?? {})) {
    if (typeof entry === "string" || entry === undefined) continue;
    links.push({
      key: key as GetItLinkKey,
      url: entry.url,
      linkCheckedOn: entry.linkCheckedOn,
    });
  }
  return links;
}

/** Hosts named inside an install command, so they can be checked too. */
export function hostsInCommand(command: string): string[] {
  return [...command.matchAll(/https?:\/\/[^\s"'|)]+/g)].flatMap((match) => {
    const host = hostOf(match[0]);
    return host === null ? [`invalid:${match[0]}`] : [host];
  });
}
