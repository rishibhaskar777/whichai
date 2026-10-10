import type { Tool } from "@/lib/schemas/catalogue";
import { MAX_COMPARE, parseIdList } from "./query";

/** Picks the known ids out of a `tools` query value, in the order given. */
export function parseCompareSelection(
  value: string | string[] | undefined,
  tools: readonly Tool[],
): string[] {
  const raw = Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
  const known = new Set(tools.map((tool) => tool.id));
  // Unknown ids are dropped before the cap, so a stale id never costs a slot.
  return parseIdList(raw, 20)
    .filter((id) => known.has(id))
    .slice(0, MAX_COMPARE);
}

export function compareHref(ids: readonly string[]): string {
  return ids.length === 0 ? "/compare" : `/compare?tools=${ids.join(",")}`;
}

/** Adds the id, or removes it when it is already picked. At most three stay. */
export function toggleSelection(ids: readonly string[], id: string): string[] {
  if (ids.includes(id)) return ids.filter((existing) => existing !== id);
  if (ids.length >= MAX_COMPARE) return [...ids];
  return [...ids, id];
}

/**
 * Finds the tool a person typed or picked from the suggestions. Matches an id
 * or a full name, ignoring case. Partial text matches only when it is unique.
 */
export function resolveTool(
  input: string,
  tools: readonly Tool[],
): Tool | null {
  const text = input.trim().toLowerCase();
  if (!text) return null;
  const exact = tools.find(
    (tool) => tool.id === text || tool.name.toLowerCase() === text,
  );
  if (exact) return exact;
  const partial = tools.filter((tool) =>
    tool.name.toLowerCase().includes(text),
  );
  return partial.length === 1 ? (partial[0] ?? null) : null;
}
