import { VERIFY, type Job, type Tool } from "@/lib/schemas/catalogue";
import type { Alternative, Budget, JobTag } from "@/lib/schemas/plan";

const LEVEL_STRETCH_NOTE = "More technical than the rest of this level.";
const MAX_NAMES = 3;

export function whyText(
  tool: Tool,
  tag: JobTag,
  outscored: Tool | null,
): string {
  if (tag === "keep") return `You already use it. ${tool.summary}`;
  if (tag === "better" && outscored) {
    return `${tool.summary} It scores higher than ${outscored.name} for this job (editorial estimate).`;
  }
  return tool.summary;
}

/** Tells the reader which separate tools they can skip because of this one. */
export function coverText(covers: readonly Job[]): string {
  if (covers.length === 0) return "";
  const names = joinNames(covers.map((job) => job.name.toLowerCase()));
  return ` It also covers ${names}, so you need no separate tool for that.`;
}

/**
 * Unverified records never show a price. A verified record carries the text
 * its reviewer wrote in `pricing`.
 */
export function pricingText(tool: Tool, budget: Budget | null): string {
  if (tool.verified) return tool.pricing;
  if (tool.hasFreeOption === true) {
    return `Has a free option. Price and limits: ${VERIFY}.`;
  }
  if (tool.hasFreeOption === false) return `Paid only. Price: ${VERIFY}.`;
  const base = `Free option: ${VERIFY}. Price and limits: ${VERIFY}.`;
  return budget === "zero" ? `${base} Not confirmed as free yet.` : base;
}

export function watchOutText(tool: Tool, levelStretched: boolean): string {
  const notes = tool.watchOutFor.slice(0, 2);
  return (levelStretched ? [LEVEL_STRETCH_NOTE, ...notes] : notes).join(" ");
}

export function toAlternative(tool: Tool): Alternative {
  return {
    toolId: tool.id,
    toolName: tool.name,
    chooseIf: `you want ${tool.strengths[0] ?? "a different approach"}`,
    paidOnly: tool.hasFreeOption === false,
  };
}

export function costText(picks: readonly Tool[], budget: Budget | null) {
  if (budget === "zero") {
    return `Free options only, once confirmed. Limits: ${VERIFY}`;
  }
  const paidOnly = picks.filter((tool) => tool.hasFreeOption === false).length;
  if (paidOnly > 0) {
    const noun = paidOnly === 1 ? "tool is" : "tools are";
    return `${paidOnly} ${noun} paid only. Prices: ${VERIFY}`;
  }
  return `Free options may cover this. Prices and limits: ${VERIFY}`;
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
