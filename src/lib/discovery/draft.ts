import { hasConcretePrice } from "../catalogue/validate.ts";
import { hostOf, normaliseName, slugify } from "./identity.ts";
import { cleanText } from "./sanitize.ts";
import type { CandidateState } from "./types.ts";

export const DRAFT_MARKER = "<!-- whichai-draft -->";
const FALLBACK_JOB = "ai-assistant";

export interface DraftContext {
  providers: readonly { id: string; name: string; homepage: string }[];
  toolIds: ReadonlySet<string>;
}

/** What `discover:import` adds to the catalogue, in the catalogue's own shape. */
export interface Draft {
  provider: { id: string; name: string; homepage: string };
  tool: Record<string, unknown>;
}

function ownerPath(url: string | null): string | null {
  if (url === null) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const owner = parsed.pathname.split("/").filter(Boolean)[0];
    if ((host === "github.com" || host === "huggingface.co") && owner) {
      return `${host}/${owner}`;
    }
  } catch {
    return null;
  }
  return null;
}

function officialUrlOf(state: CandidateState): string {
  if (state.homepage !== null) return state.homepage;
  if (state.repository !== null) return state.repository;
  return new URL(state.announcement ?? "https://example.com").origin;
}

function domainsOf(state: CandidateState): string[] {
  const domains: string[] = [];
  for (const url of [state.homepage, state.announcement]) {
    const host = url === null ? null : hostOf(url);
    if (host !== null) domains.push(host);
  }
  const owner = ownerPath(state.repository);
  if (owner !== null) domains.push(owner);
  return [...new Set(domains)].slice(0, 6);
}

function providerFor(state: CandidateState, context: DraftContext) {
  const maker = state.maintainer ?? state.name;
  const wanted = normaliseName(maker);
  const known = context.providers.find(
    (provider) =>
      normaliseName(provider.name) === wanted || provider.id === slugify(maker),
  );
  if (known !== undefined) return known;
  const url = officialUrlOf(state);
  const parsed = new URL(url);
  const onSharedHost = ["github.com", "huggingface.co"].includes(
    parsed.hostname,
  );
  const owner = ownerPath(state.repository);
  const homepage =
    onSharedHost && owner !== null ? `https://${owner}` : parsed.origin;
  return { id: slugify(maker), name: cleanText(maker, 60), homepage };
}

function uniqueId(base: string, taken: ReadonlySet<string>): string {
  let id = base;
  for (let n = 2; taken.has(id); n += 1) id = `${base.slice(0, 55)}-${n}`;
  return id;
}

const PLATFORMS = {
  model: ["code"],
  library: ["code"],
  cli: ["command-line"],
  extension: ["web"],
} as const;

/**
 * A starting record for a person to review. Fit scores are an editorial
 * estimate of 3 for every job, nothing is verified, the price is a
 * placeholder and `getIt` is empty: download links are added by hand after
 * the steps in docs/VERIFYING-DATA.md.
 */
export function buildDraft(
  state: CandidateState,
  context: DraftContext,
): Draft {
  const jobs = state.jobs.length > 0 ? state.jobs : [FALLBACK_JOB];
  const provider = providerFor(state, context);
  const summary = cleanText(state.description, 180);
  const usable = summary !== "" && !hasConcretePrice(summary);
  const platforms =
    state.kind === "ai-tool"
      ? state.homepage !== null
        ? ["web"]
        : ["code"]
      : [...PLATFORMS[state.kind]];

  return {
    provider,
    tool: {
      id: uniqueId(state.id, context.toolIds),
      name: cleanText(state.name, 60),
      providerId: provider.id,
      jobs,
      summary: usable
        ? summary
        : "Newly discovered tool. Summary to be written during review.",
      kind: state.kind,
      skillLevel:
        state.kind === "ai-tool" || state.kind === "extension"
          ? "intermediate"
          : "advanced",
      hasFreeOption: "verify",
      pricing: "[verify]",
      platforms,
      worksWith: [],
      strengths: ["Newly discovered. Strengths are not reviewed yet."],
      watchOutFor: [
        "Not reviewed. Check the maker and the official site before relying on it.",
      ],
      fitScores: Object.fromEntries(jobs.map((job) => [job, 3])),
      scoreSource: "editorial-estimate",
      officialUrl: officialUrlOf(state),
      officialDomains: domainsOf(state),
      getIt: {},
      verified: false,
      lastVerified: null,
    },
  };
}

export function renderDraftComment(draft: Draft, issueNumber: number): string {
  return [
    DRAFT_MARKER,
    `Draft catalogue record for issue ${issueNumber}, made when it was approved. It is a starting point, not a verified record: the price is a placeholder, fit scores are editorial estimates, \`getIt\` is empty and nothing is checked against the official site.`,
    "",
    "```json",
    JSON.stringify(draft, null, 2),
    "```",
    "",
    `To add it to the catalogue on your machine: \`npm run discover:import -- ${issueNumber}\`. Then review, verify and commit it yourself.`,
  ].join("\n");
}

/** The JSON of a draft comment, or null when the text is not one. */
export function parseDraftComment(body: string): unknown {
  if (!body.startsWith(DRAFT_MARKER)) return null;
  const open = body.indexOf("```json\n");
  if (open < 0) return null;
  const start = open + "```json\n".length;
  const end = body.indexOf("\n```", start);
  if (end < 0) return null;
  try {
    return JSON.parse(body.slice(start, end)) as unknown;
  } catch {
    return null;
  }
}
