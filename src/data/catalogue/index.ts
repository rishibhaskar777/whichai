import { findProblems } from "@/lib/catalogue/validate";
import { catalogueSchema, type Catalogue } from "@/lib/schemas/catalogue";
import goals from "./goals.json";
import jobs from "./jobs.json";
import modelClasses from "./model-classes.json";
import providers from "./providers.json";
import ai from "./tools/ai.json";
import build from "./tools/build.json";
import design from "./tools/design.json";
import learning from "./tools/learning.json";
import media from "./tools/media.json";
import productivity from "./tools/productivity.json";
import research from "./tools/research.json";

/**
 * Tool records, one file per job category. A tool lives in the file for the
 * category of its first job, which a test checks.
 */
export const toolFiles = {
  ai,
  build,
  design,
  learning,
  media,
  productivity,
  research,
} as const;

/** Parses the JSON files and fails loudly, at build time, if they disagree. */
function loadCatalogue(): Catalogue {
  const catalogue = catalogueSchema.parse({
    providers,
    jobs,
    tools: Object.values(toolFiles).flat(),
    modelClasses,
    goals,
  });
  // The cross-file checks run in tests and on the server. Skipping them in the
  // browser keeps start-up cheap, and the data is the same bytes.
  if (typeof window === "undefined") {
    const problems = findProblems(catalogue);
    if (problems.length > 0) {
      throw new Error(`Invalid catalogue data:\n${problems.join("\n")}`);
    }
  }
  return catalogue;
}

export const catalogue: Catalogue = loadCatalogue();
