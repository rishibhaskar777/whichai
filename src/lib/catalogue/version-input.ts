import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * The text the catalogue version is computed from: every JSON file under the
 * catalogue folder, in a fixed order, with line endings normalised so the
 * same data gives the same version on every machine.
 */
export function catalogueVersionInput(directory: string): string {
  const files: string[] = [];
  const walk = (folder: string) => {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const path = join(folder, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith(".json")) files.push(path);
    }
  };
  walk(directory);
  return files
    .map((path) => relative(directory, path).split("\\").join("/"))
    .sort()
    .map((name) => {
      const text = readFileSync(join(directory, name), "utf8");
      return `${name}\n${text.replace(/\r\n/g, "\n")}`;
    })
    .join("\n");
}
