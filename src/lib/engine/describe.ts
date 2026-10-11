import type {
  GoalCategory,
  Job,
  StrengthTag,
  Tool,
} from "@/lib/schemas/catalogue";
import type { Alternative, Budget, JobTag } from "@/lib/schemas/plan";

const LEVEL_STRETCH_NOTE = "More technical than the rest of this level.";
const MAX_NAMES = 3;
const MAX_NOTES = 2;

/** The strength notes of a tool for the tags a job slot cares about. */
export function matchingNotes(
  tool: Tool,
  tags: readonly StrengthTag[],
): string[] {
  const notes = tags.flatMap((tag) => tool.strengthNotes[tag] ?? []);
  return [...new Set(notes)].slice(0, MAX_NOTES);
}

export function categoryNote(
  tool: Tool,
  category: GoalCategory | null,
): string | null {
  return category ? (tool.categoryNotes[category]?.text ?? null) : null;
}

export interface Strengths {
  /** Editorial note for the goal's category, for general assistants. */
  categoryNote: string | null;
  /** Notes for the slot's tags, at most two. */
  notes: readonly string[];
}

/**
 * Two lines about why this tool suits the slot: what it is good at for the
 * goal's kind, then what matches the slot's tags. A tool with no matching
 * notes falls back to its first general strength.
 */
export function whyText(
  tool: Tool,
  tag: JobTag,
  outscored: Tool | null,
  strengths: Strengths,
): string {
  const { categoryNote: category, notes } = strengths;
  let body: string;
  if (category) {
    body = `${tool.name} ${category}.`;
    if (notes[0]) body += ` It also ${notes[0]}.`;
  } else if (notes.length > 0) {
    body = `${tool.name} ${notes.join(" and ")}.`;
  } else {
    body = `${tool.name} is known for ${tool.strengths[0] ?? "its range"}.`;
  }
  if (tag === "keep") return `You already use it. ${body}`;
  if (tag === "better" && outscored) {
    return `${body} It scores higher than ${outscored.name} for this job (editorial estimate).`;
  }
  return body;
}

/** Tells the reader which separate tools they can skip because of this one. */
export function coverText(covers: readonly Job[]): string {
  if (covers.length === 0) return "";
  const names = joinNames(covers.map((job) => job.name.toLowerCase()));
  return ` It also covers ${names}, so you need no separate tool for that.`;
}

export function watchOutText(tool: Tool, levelStretched: boolean): string {
  const notes = tool.watchOutFor.slice(0, 2);
  return (levelStretched ? [LEVEL_STRETCH_NOTE, ...notes] : notes).join(" ");
}

export function toAlternative(
  tool: Tool,
  strengths: Strengths = { categoryNote: null, notes: [] },
): Alternative {
  const note = strengths.categoryNote ?? strengths.notes[0];
  const reason = note
    ? `you want a tool that ${note}`
    : `you want ${tool.strengths[0] ?? "a different approach"}`;
  return {
    toolId: tool.id,
    toolName: tool.name,
    chooseIf: reason,
    paidOnly: tool.hasFreeOption === false,
  };
}

/** Says where to look for prices; the numbers live on the tools' own pages. */
export function costText(picks: readonly Tool[], budget: Budget | null) {
  if (budget === "zero") {
    return "Free plans only. Check each tool's pricing page for its limits.";
  }
  const paidOnly = picks.filter((tool) => tool.hasFreeOption === false).length;
  if (paidOnly > 0) {
    const noun = paidOnly === 1 ? "tool is" : "tools are";
    return `${paidOnly} ${noun} paid only. See each tool's pricing page for prices.`;
  }
  return "Free plans may cover this. See each tool's pricing page for limits.";
}

function joinNames(names: readonly string[]): string {
  const shown = names.slice(0, MAX_NAMES);
  if (shown.length <= 1) return shown.join("");
  return `${shown.slice(0, -1).join(", ")} and ${shown.at(-1)}`;
}

/**
 * Compares a build tool with the other build tools in the same plan. Returns
 * a warning when none of them is known to work with it, a short confirmation
 * when some are, and nothing when it stands alone.
 */
export function compatibilityNote(
  tool: Tool,
  peers: readonly Tool[],
  isCompatible: (a: Tool, b: Tool) => boolean,
): string | null {
  const others = peers.filter((peer) => peer.id !== tool.id);
  if (others.length === 0) return null;
  const known = others.filter((peer) => isCompatible(tool, peer));
  if (known.length > 0) {
    return `Works with ${joinNames(known.map((peer) => peer.name))}.`;
  }
  return `No known compatibility with ${joinNames(others.map((peer) => peer.name))}. Check that it works with them before you commit.`;
}

/** Replaces {job:id} with the name of the tool chosen for that job. */
export function fillToolNames(
  text: string,
  toolNames: ReadonlyMap<string, string>,
  jobs: ReadonlyMap<string, Job>,
): string {
  return text.replace(/\{job:([a-z0-9-]+)\}/g, (_match, jobId: string) => {
    const name = toolNames.get(jobId);
    if (name) return name;
    return `your ${jobs.get(jobId)?.name.toLowerCase() ?? "tool"}`;
  });
}
