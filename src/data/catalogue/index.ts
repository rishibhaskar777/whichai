import { findProblems } from "@/lib/catalogue/validate";
import { catalogueSchema, type Catalogue } from "@/lib/schemas/catalogue";
import goals from "./goals.json";
import jobs from "./jobs.json";
import modelClasses from "./model-classes.json";
import providers from "./providers.json";
import tools from "./tools.json";

/** Parses the JSON files and fails loudly, at build time, if they disagree. */
function loadCatalogue(): Catalogue {
  const catalogue = catalogueSchema.parse({
    providers,
    jobs,
    tools,
    modelClasses,
    goals,
  });
  const problems = findProblems(catalogue);
  if (problems.length > 0) {
    throw new Error(`Invalid catalogue data:\n${problems.join("\n")}`);
  }
  return catalogue;
}

export const catalogue: Catalogue = loadCatalogue();
