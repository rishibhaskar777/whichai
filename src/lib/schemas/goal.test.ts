import { describe, expect, it } from "vitest";
import { GOAL_MAX_LENGTH, goalSchema } from "./goal";

describe("goalSchema", () => {
  it("trims surrounding whitespace", () => {
    expect(goalSchema.parse({ goal: "  build a website \n" })).toEqual({
      goal: "build a website",
    });
  });

  it("rejects empty and whitespace-only goals", () => {
    expect(goalSchema.safeParse({ goal: "" }).success).toBe(false);
    expect(goalSchema.safeParse({ goal: "   \n\t " }).success).toBe(false);
  });

  it("accepts a goal at the maximum length", () => {
    const goal = "a".repeat(GOAL_MAX_LENGTH);
    expect(goalSchema.safeParse({ goal }).success).toBe(true);
  });

  it("rejects a goal over the maximum length", () => {
    const goal = "a".repeat(GOAL_MAX_LENGTH + 1);
    expect(goalSchema.safeParse({ goal }).success).toBe(false);
  });

  it("rejects non-string values and missing fields", () => {
    expect(goalSchema.safeParse({ goal: 42 }).success).toBe(false);
    expect(goalSchema.safeParse({}).success).toBe(false);
    expect(goalSchema.safeParse(null).success).toBe(false);
  });
});
