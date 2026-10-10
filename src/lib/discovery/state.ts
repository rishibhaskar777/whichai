import { z } from "zod";
import type { Admission } from "./admission.ts";
import { starGrowth } from "./admission.ts";
import type { ClosestTool } from "./jobs.ts";
import {
  DESCRIPTION_LENGTH,
  NAME_LENGTH,
  cleanText,
  codeSpan,
  linkOrNone,
  safeHttpsUrl,
  titleSafeName,
} from "./sanitize.ts";
import { SOURCE_NAMES, type CandidateState } from "./types.ts";

const MARKER = "whichai-candidate";

const nullableUrl = z
  .string()
  .max(300)
  .nullable()
  .transform((value) => (value === null ? null : safeHttpsUrl(value)));
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const count = z.number().int().min(0).max(1_000_000_000);

const signalsSchema = z.strictObject({
  githubStars: count.optional(),
  hfLikes: count.optional(),
  hfDownloads: count.optional(),
  hnPoints: count.optional(),
  announced: z.boolean().optional(),
});

const stateSchema = z.strictObject({
  version: z.literal(1),
  id: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(70),
  name: z.string().min(1).max(NAME_LENGTH),
  description: z.string().max(DESCRIPTION_LENGTH),
  homepage: nullableUrl,
  repository: nullableUrl,
  announcement: nullableUrl,
  maintainer: z.string().max(NAME_LENGTH).nullable(),
  kind: z.enum(["ai-tool", "model", "cli", "extension", "library"]),
  keys: z.array(z.string().max(120)).max(8),
  sources: z
    .array(
      z.strictObject({
        source: z.enum(SOURCE_NAMES),
        url: z.string().max(300).transform(safeHttpsUrl).pipe(z.string()),
      }),
    )
    .max(6),
  topics: z.array(z.string().max(30)).max(8),
  jobs: z
    .array(
      z
        .string()
        .regex(/^[a-z0-9-]+$/)
        .max(60),
    )
    .max(3),
  firstSeen: day,
  lastSeen: day,
  history: z
    .array(z.strictObject({ date: day, signals: signalsSchema }))
    .max(16),
  homepageCheck: z
    .strictObject({
      date: day,
      status: z.number().int().min(100).max(599).nullable(),
      ok: z.boolean(),
      redirectHost: z.string().max(100).nullable(),
    })
    .nullable(),
});

/**
 * The hidden block. JSON in an HTML comment: `<`, `>` and `--` are written as
 * unicode escapes so no text inside it can end the comment.
 */
export function encodeState(state: CandidateState): string {
  const json = JSON.stringify(state)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/--/g, "-\\u002d");
  return `<!-- ${MARKER} ${json} -->`;
}

/**
 * Reads the block from an issue body. The last block wins and every field is
 * validated again, so an edited or hostile body gives null, not a crash.
 */
export function decodeState(body: string): CandidateState | null {
  const start = body.lastIndexOf(`<!-- ${MARKER} `);
  if (start < 0) return null;
  const end = body.indexOf(" -->", start);
  if (end < 0) return null;
  const json = body.slice(start + `<!-- ${MARKER} `.length, end);
  try {
    const parsed = stateSchema.safeParse(JSON.parse(json));
    return parsed.success ? (parsed.data as CandidateState) : null;
  } catch {
    return null;
  }
}

export function issueTitle(state: Pick<CandidateState, "name" | "id">): string {
  const name = titleSafeName(state.name);
  return `Tool candidate: ${name === "" ? state.id : name}`;
}

export interface BodyView {
  admission: Admission;
  closest: ClosestTool[];
  jobNames: ReadonlyMap<string, string>;
}

const numbers = new Intl.NumberFormat("en-US");

function signalLines(state: CandidateState): string[] {
  const latest = state.history[state.history.length - 1]?.signals ?? {};
  const growth = starGrowth(state.history);
  const lines: string[] = [];
  const add = (label: string, value: number | undefined, extra = "") => {
    if (value !== undefined)
      lines.push(`- ${label}: ${numbers.format(value)}${extra}`);
  };
  add(
    "GitHub stars",
    latest.githubStars,
    growth === null
      ? ""
      : ` (${growth >= 0 ? "+" : ""}${numbers.format(growth)} per 30 days)`,
  );
  add("Hugging Face likes", latest.hfLikes);
  add("Hugging Face downloads", latest.hfDownloads);
  add("Hacker News points", latest.hnPoints);
  if (latest.announced === true)
    lines.push("- Announced on an official news feed");
  return lines.length > 0 ? lines : ["- none reported"];
}

const FENCE = "```";

/** The issue body: what a person reads, then the hidden state block. */
export function renderBody(state: CandidateState, view: BodyView): string {
  const jobs = state.jobs.map((id) => codeSpan(view.jobNames.get(id) ?? id));
  const sources = state.sources.map(
    (link) => `${link.source}: ${linkOrNone(link.url)}`,
  );
  const description = cleanText(state.description, DESCRIPTION_LENGTH);

  const lines: string[] = [
    `Found by the weekly discovery job. Nothing here is verified. Everything in code spans and blocks below came from the open internet.`,
    "",
    `| | |`,
    `| --- | --- |`,
    `| Name | ${codeSpan(state.name)} |`,
    `| Maker | ${state.maintainer === null ? "unknown" : codeSpan(state.maintainer)} |`,
    `| Kind | ${codeSpan(state.kind)} |`,
    `| Website | ${linkOrNone(state.homepage)} |`,
    `| Repository | ${linkOrNone(state.repository)} |`,
    `| Announcement | ${linkOrNone(state.announcement)} |`,
    `| First seen | ${state.firstSeen} |`,
    `| Last refreshed | ${state.lastSeen} |`,
    `| Suggested jobs | ${jobs.length > 0 ? jobs.join(", ") : "none matched"} |`,
    "",
    "### What it says about itself",
    "",
    FENCE + "text",
    description === "" ? "(no description)" : description,
    FENCE,
    "",
    "### Found in",
    "",
    ...(sources.length > 0 ? sources.map((line) => `- ${line}`) : ["- none"]),
    "",
    "### Usage signals",
    "",
    ...signalLines(state),
    "",
    "### Admission rules",
    "",
    ...view.admission.rules.map(
      (rule) =>
        `- [${rule.passed ? "x" : " "}] ${rule.rule}. ${rule.title}: ${cleanText(rule.detail, 160)}`,
    ),
    "",
    view.admission.ready
      ? "All five rules pass. This candidate is ready for review."
      : "Not ready yet. This body is updated each week.",
    "",
    "### Closest existing tools for the same jobs",
    "",
    ...(view.closest.length > 0
      ? view.closest.map(
          (tool) =>
            `- ${codeSpan(tool.name)} (${tool.sharedJobs
              .map((id) => codeSpan(view.jobNames.get(id) ?? id))
              .join(", ")})`,
        )
      : ["- none: no existing tool does the suggested jobs"]),
    "",
    "This list is for comparison only. The job never decides which tool is better.",
    "",
    "### Review",
    "",
    "Follow the checklist in `docs/TOOL-DISCOVERY.md`. Add the label `approved` to get a draft record, or `rejected` and close the issue to keep it out for good.",
    "",
    encodeState(state),
  ];
  return lines.join("\n");
}
