import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const BUILD = join(process.cwd(), ".next");
// Source maps embed the original files, so only the shipped output is read.
// A development server leaves no BUILD_ID, so only a real `next build` counts.
const hasProductionBuild = existsSync(join(BUILD, "BUILD_ID"));
const inCi = Boolean(process.env.CI);

function filesUnder(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

/*
 * Run `npm run build` first. CI builds before it runs the tests, so there a
 * missing build is a failure. Locally, with no production build in .next
 * there is nothing to inspect, so the test skips.
 */
describe.runIf(inCi && !hasProductionBuild)("production build in CI", () => {
  it("exists before the tests run", () => {
    throw new Error(
      "No production build found in .next (BUILD_ID is missing). Run `npm run build` before `npm test` so the bundle check can run.",
    );
  });
});

describe.skipIf(!hasProductionBuild)("production bundle", () => {
  const files = ["static", "server"]
    .map((name) => join(BUILD, name))
    .filter((path) => existsSync(path))
    .flatMap(filesUnder)
    .filter((path) => /\.(js|mjs|html|rsc|json|css)$/.test(path));

  it("has files to inspect", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(["Developer tools", "DEV_TEST_"])("never contains %s", (needle) => {
    const found = files.filter((path) =>
      readFileSync(path, "utf8").includes(needle),
    );
    expect(found).toEqual([]);
  });
});
