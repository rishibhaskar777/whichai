import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { catalogueVersionInput } from "@/lib/catalogue/version-input";
import { hashText } from "@/lib/storage/hash";
import { catalogue } from ".";
import { GOAL_TITLES } from "./goal-titles";
import { CATALOGUE_VERSION } from "./version";

describe("catalogue version", () => {
  it("matches the catalogue files. Run `npm run data:version` after a data change", () => {
    const directory = join(process.cwd(), "src", "data", "catalogue");
    expect(CATALOGUE_VERSION).toBe(hashText(catalogueVersionInput(directory)));
  });
});

describe("goal titles", () => {
  it("match goals.json", () => {
    for (const goal of catalogue.goals) {
      expect(GOAL_TITLES[goal.id], goal.id).toBe(goal.title);
    }
    expect(Object.keys(GOAL_TITLES)).toHaveLength(catalogue.goals.length);
  });
});
