import { VERIFY, type Tool } from "../schemas/catalogue";

export interface PricingInfo {
  hasFreeOption: Tool["hasFreeOption"];
  /** The summary read from the official pricing page, or null. */
  text: string | null;
  /** The day the summary was read. Always set when `text` is. */
  checkedOn: string | null;
  /** The pricing page, or the tool's official site when there is none. */
  url: string;
}

/**
 * What a page may say about a tool's price. A summary is shown only when the
 * record names the day it was read from the official page; otherwise the
 * reader gets a link to that page and no text at all.
 */
export function pricingInfo(
  tool: Pick<
    Tool,
    | "hasFreeOption"
    | "pricing"
    | "pricingUrl"
    | "pricingCheckedOn"
    | "officialUrl"
  >,
): PricingInfo {
  const recorded = tool.pricing !== VERIFY && tool.pricingCheckedOn;
  return {
    hasFreeOption: tool.hasFreeOption,
    text: recorded ? tool.pricing : null,
    checkedOn: recorded ? (tool.pricingCheckedOn ?? null) : null,
    url: tool.pricingUrl ?? tool.officialUrl,
  };
}
