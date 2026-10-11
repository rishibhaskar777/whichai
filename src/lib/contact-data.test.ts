import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SCAN_DIRS = ["src", "docs", ".github", "scripts"];
const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".json",
  ".md",
  ".yml",
  ".yaml",
  ".css",
  ".txt",
  ".xml",
  ".svg",
  ".html",
  ".env",
  ".example",
]);
const ROOT_FILES_SKIPPED = new Set(["package-lock.json"]);

const EMAIL =
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;

/** Addresses that are not a person: reserved example domains and noreply. */
function isAllowed(address: string): boolean {
  const lower = address.toLowerCase();
  const [local = "", domain = ""] = lower.split("@");
  if (/^(?:[\w-]+\.)*example\.(?:com|org|net)$/.test(domain)) return true;
  if (domain === "users.noreply.github.com") return true;
  return local === "noreply" || local.startsWith("noreply-");
}

function filesIn(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    if (name === "node_modules" || name === ".next" || name === ".git") {
      return [];
    }
    const path = join(directory, name);
    return statSync(path).isDirectory() ? filesIn(path) : [path];
  });
}

function isText(path: string): boolean {
  const name = path.split(/[\\/]/).pop() ?? "";
  return TEXT_EXTENSIONS.has(extname(name)) || name.startsWith(".env");
}

describe("personal contact data", () => {
  it("allows only noreply and example addresses", () => {
    const rootFiles = readdirSync(ROOT)
      .map((name) => join(ROOT, name))
      .filter(
        (path) =>
          statSync(path).isFile() &&
          !ROOT_FILES_SKIPPED.has(path.split(/[\\/]/).pop() ?? ""),
      );
    const files = [
      ...rootFiles,
      ...SCAN_DIRS.flatMap((dir) => filesIn(join(ROOT, dir))),
    ].filter(isText);

    const offenders = files.flatMap((path) =>
      readFileSync(path, "utf8")
        .split("\n")
        .flatMap((line, index) =>
          (line.match(EMAIL) ?? [])
            .filter((address) => !isAllowed(address))
            .map(
              (address) =>
                `${path.slice(ROOT.length + 1)}:${index + 1} ${address}`,
            ),
        ),
    );

    expect(files.length).toBeGreaterThan(50);
    expect(offenders).toEqual([]);
  });

  it("recognises what the allowlist covers", () => {
    expect(isAllowed("hello@example.org")).toBe(true);
    expect(isAllowed("12345+name@users.noreply.github.com")).toBe(true);
    expect(isAllowed("noreply@whichai.example.com")).toBe(true);
    expect(isAllowed(["someone", "gmail.com"].join("@"))).toBe(false);
    expect(isAllowed(["someone", "notexample.com"].join("@"))).toBe(false);
  });
});
