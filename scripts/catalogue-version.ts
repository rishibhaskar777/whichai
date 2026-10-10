import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { catalogueVersionInput } from "../src/lib/catalogue/version-input.ts";
import { hashText } from "../src/lib/storage/hash.ts";

const directory = fileURLToPath(
  new URL("../src/data/catalogue", import.meta.url),
);
const version = hashText(catalogueVersionInput(directory));

writeFileSync(
  new URL("../src/data/catalogue/version.ts", import.meta.url),
  `/* Written by \`npm run data:version\`. Do not edit by hand. */\nexport const CATALOGUE_VERSION = "${version}";\n`,
);
process.stdout.write(`Catalogue version: ${version}\n`);
