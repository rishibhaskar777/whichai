import { describe, expect, it } from "vitest";
import { REPOSITORY_URL } from "@/lib/links";
import { MAX_MISSED_GOALS } from "@/lib/storage/limits";
import { addMissedGoal } from "@/lib/storage/operations";
import type { MissedGoal } from "@/lib/storage/schemas";
import { buildMissedGoalsIssueUrl } from "./issue-url";

function goals(texts: string[]): MissedGoal[] {
  return texts.reduce<MissedGoal[]>(
    (list, text) => addMissedGoal(list, text, "no-match"),
    [],
  );
}

describe("buildMissedGoalsIssueUrl", () => {
  it("opens a new issue on the repository of the project", () => {
    const url = new URL(
      buildMissedGoalsIssueUrl(goals(["weather in delhi"]), "abc123"),
    );

    expect(`${url.origin}${url.pathname}`).toBe(`${REPOSITORY_URL}/issues/new`);
    expect(url.searchParams.get("title")).toBe(
      "Goals WhichAI did not understand",
    );
  });

  it("lists each goal with the reason and the catalogue version", () => {
    const url = new URL(
      buildMissedGoalsIssueUrl(goals(["first goal", "second goal"]), "abc123"),
    );
    const body = url.searchParams.get("body") ?? "";

    expect(body).toContain("`second goal` (no-match)");
    expect(body).toContain("`first goal` (no-match)");
    expect(body).toContain("Catalogue version: abc123");
  });

  it("keeps a goal from breaking out of its line or pinging someone", () => {
    const url = new URL(
      buildMissedGoalsIssueUrl(
        goals(["hi @everyone `code`\n- injected line"]),
        "v",
      ),
    );
    const body = url.searchParams.get("body") ?? "";
    const lines = body.split("\n").filter((line) => line.startsWith("- "));

    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain("`hi @everyone 'code' - injected line`");
  });

  it("stays short enough to open, however many goals there are", () => {
    const many = Array.from(
      { length: MAX_MISSED_GOALS },
      (_, index) => `${"long goal text ".repeat(10)}${index}`,
    );

    const url = buildMissedGoalsIssueUrl(goals(many), "v");

    expect(url.length).toBeLessThanOrEqual(7000);
  });
});
