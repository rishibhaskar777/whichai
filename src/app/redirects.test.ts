import { describe, expect, it } from "vitest";
import ComparePlans from "./compare-plans/page";
import ToolLibrary from "./tool-library/page";

function redirectTarget(call: () => unknown): string {
  try {
    call();
  } catch (error) {
    const digest = (error as { digest?: string }).digest ?? "";
    // Next.js encodes a redirect as NEXT_REDIRECT;<type>;<url>;<status>;
    return digest.split(";")[2] ?? "";
  }
  return "";
}

describe("old page addresses", () => {
  it("send the Tool Library address to /tools", () => {
    expect(redirectTarget(ToolLibrary)).toBe("/tools");
  });

  it("send the Compare Plans address to /compare", () => {
    expect(redirectTarget(ComparePlans)).toBe("/compare");
  });
});
