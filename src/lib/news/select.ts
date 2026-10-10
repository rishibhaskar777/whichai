import type { NewsItem } from "./types";

export const PANEL_ITEM_COUNT = 6;
/** One chatty release feed must not fill the whole panel. */
export const PANEL_MAX_PER_SOURCE = 2;
export const NEW_BADGE_MS = 24 * 60 * 60 * 1000;
export const TOOL_NEWS_COUNT = 5;

/** The newest items for the side panel, at most a few from each source. */
export function panelItems(
  items: readonly NewsItem[],
  count = PANEL_ITEM_COUNT,
  perSource = PANEL_MAX_PER_SOURCE,
): NewsItem[] {
  const taken = new Map<string, number>();
  const picked: NewsItem[] = [];
  for (const item of items) {
    const used = taken.get(item.sourceId) ?? 0;
    if (used >= perSource) continue;
    taken.set(item.sourceId, used + 1);
    picked.push(item);
    if (picked.length === count) break;
  }
  return picked;
}

/** True for an item published less than a day before `now`. */
export function isNewItem(item: NewsItem, now: number): boolean {
  const age = now - Date.parse(item.publishedAt);
  return age >= 0 && age < NEW_BADGE_MS;
}

export function newsForTool(
  items: readonly NewsItem[],
  toolId: string,
  limit = TOOL_NEWS_COUNT,
): NewsItem[] {
  return items.filter((item) => item.toolIds.includes(toolId)).slice(0, limit);
}
