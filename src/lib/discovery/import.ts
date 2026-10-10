import { z } from "zod";
import { findProblems } from "../catalogue/validate.ts";
import {
  catalogueSchema,
  providerSchema,
  toolSchema,
  type Provider,
  type Tool,
} from "../schemas/catalogue.ts";

const draftSchema = z.strictObject({
  provider: providerSchema,
  tool: toolSchema,
});

export interface CatalogueParts {
  providers: unknown[];
  jobs: { id: string; category: string }[];
  tools: unknown[];
  modelClasses: unknown[];
  goals: unknown[];
}

export type DraftCheck =
  | {
      ok: true;
      provider: Provider;
      tool: Tool;
      providerIsNew: boolean;
      /** The category file the tool belongs in: its first job's category. */
      category: string;
    }
  | { ok: false; errors: string[] };

/**
 * Validates a draft against the catalogue schema and the cross-file checks as
 * if it had been added. Nothing is written; the caller decides what to do.
 */
export function checkDraft(value: unknown, parts: CatalogueParts): DraftCheck {
  const parsed = draftSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map(
        (issue) => `${issue.path.join(".") || "draft"}: ${issue.message}`,
      ),
    };
  }
  const { provider, tool } = parsed.data;

  const providerIsNew = !parts.providers.some(
    (entry) => (entry as { id?: unknown }).id === provider.id,
  );
  const category = parts.jobs.find((job) => job.id === tool.jobs[0])?.category;
  if (category === undefined) {
    return { ok: false, errors: [`unknown job ${tool.jobs[0]}`] };
  }

  const combined = catalogueSchema.safeParse({
    providers: providerIsNew ? [...parts.providers, provider] : parts.providers,
    jobs: parts.jobs,
    tools: [...parts.tools, tool],
    modelClasses: parts.modelClasses,
    goals: parts.goals,
  });
  if (!combined.success) {
    return {
      ok: false,
      errors: combined.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`,
      ),
    };
  }
  const problems = findProblems(combined.data);
  if (problems.length > 0) return { ok: false, errors: problems };
  return { ok: true, provider, tool, providerIsNew, category };
}
