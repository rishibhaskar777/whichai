import { CATALOGUE_VERSION as GENERATED_VERSION } from "@/data/catalogue/version";
import { hashText } from "./hash";

export function hashCatalogue(data: unknown): string {
  return hashText(JSON.stringify(data));
}

/**
 * Changes whenever any catalogue file changes. It is written by
 * `npm run data:version` and checked by a test, so the browser never has to
 * load the whole catalogue just to know which version a plan was saved with.
 */
export const CATALOGUE_VERSION = GENERATED_VERSION;
