import { z } from "./zod.ts";

const slug = z
  .string()
  .min(1)
  .max(60)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, digits and dashes.",
  );

const text = (max: number) => z.string().min(1).max(max);

export const httpsUrl = z
  .url()
  .refine((value) => new URL(value).protocol === "https:", {
    message: "Use an https URL.",
  });

/** Placeholder written wherever a price or limit has not been checked yet. */
export const VERIFY = "[verify]";

export const JOB_CATEGORIES = [
  "ai",
  "build",
  "design",
  "media",
  "productivity",
  "learning",
  "research",
] as const;
export const jobCategorySchema = z.enum(JOB_CATEGORIES);
export type JobCategory = z.infer<typeof jobCategorySchema>;

export const providerSchema = z.object({
  id: slug,
  name: text(60),
  homepage: httpsUrl,
});
export type Provider = z.infer<typeof providerSchema>;

export const jobSchema = z.object({
  id: slug,
  name: text(60),
  description: text(200),
  category: jobCategorySchema,
  keywords: z.array(text(40)),
});
export type Job = z.infer<typeof jobSchema>;

export const toolKindSchema = z.enum([
  "ai-tool",
  "library",
  "service",
  "app",
  "template-source",
  /** Open-weight model families: where to get them, not a place to chat. */
  "model",
  /** Browser and editor extensions. */
  "extension",
  "cli",
]);
export type ToolKind = z.infer<typeof toolKindSchema>;

export const skillLevelSchema = z.enum([
  "beginner",
  "intermediate",
  "advanced",
]);
export type SkillLevel = z.infer<typeof skillLevelSchema>;

export const platformSchema = z.enum([
  "web",
  "windows",
  "macos",
  "linux",
  "android",
  "ios",
  "command-line",
  "code",
]);
export type Platform = z.infer<typeof platformSchema>;

/**
 * A domain that belongs to a tool: a host ("ollama.com", which also covers its
 * subdomains) or a host with one path segment ("github.com/ollama") for
 * projects that live on a shared host.
 */
export const officialDomainSchema = z
  .string()
  .regex(
    /^[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[A-Za-z0-9._-]+)?$/,
    "Use a lowercase host, optionally followed by one path segment.",
  );

export const linkEntrySchema = z
  .object({
    url: httpsUrl,
    /** The day the address was opened and seen to resolve. Not a verification. */
    linkCheckedOn: z.iso.date().nullable(),
  })
  .strict();
export type LinkEntry = z.infer<typeof linkEntrySchema>;

export const GET_IT_LINK_KEYS = [
  "web",
  "windows",
  "macos",
  "linux",
  "android",
  "ios",
  "chromeExtension",
  "firefoxAddon",
  "edgeAddon",
  "vscodeExtension",
  "jetbrainsPlugin",
  "modelPage",
] as const;
export type GetItLinkKey = (typeof GET_IT_LINK_KEYS)[number];

export const getItSchema = z
  .object({
    web: linkEntrySchema,
    windows: linkEntrySchema,
    macos: linkEntrySchema,
    linux: linkEntrySchema,
    android: linkEntrySchema,
    ios: linkEntrySchema,
    chromeExtension: linkEntrySchema,
    firefoxAddon: linkEntrySchema,
    edgeAddon: linkEntrySchema,
    vscodeExtension: linkEntrySchema,
    jetbrainsPlugin: linkEntrySchema,
    modelPage: linkEntrySchema,
    /** The official install command, shown as text and never run. */
    cliInstall: z.string().min(1).max(160),
  })
  .partial()
  .strict();
export type GetIt = z.infer<typeof getItSchema>;

export const toolSchema = z
  .object({
    id: slug,
    name: text(60),
    providerId: slug,
    jobs: z.array(slug).min(1),
    summary: text(180),
    kind: toolKindSchema,
    skillLevel: skillLevelSchema,
    hasFreeOption: z.union([z.boolean(), z.literal("verify")]),
    pricing: text(200),
    platforms: z.array(platformSchema).min(1),
    worksWith: z.array(slug),
    /** Jobs the tool also does on its own, such as hosting in a site builder. */
    includes: z.array(slug).default([]),
    strengths: z.array(text(110)).min(1).max(4),
    watchOutFor: z.array(text(120)).min(1).max(4),
    fitScores: z.record(slug, z.number().int().min(1).max(5)),
    scoreSource: z.literal("editorial-estimate"),
    officialUrl: httpsUrl,
    officialDomains: z.array(officialDomainSchema).min(1).max(6),
    getIt: getItSchema.optional(),
    /** Plan names, only when confident. Features stay "[verify]" until checked. */
    planTiers: z
      .array(z.object({ name: text(40), features: z.literal(VERIFY) }))
      .max(6)
      .optional(),
    verified: z.boolean(),
    lastVerified: z.iso.date().nullable(),
  })
  .superRefine((tool, context) => {
    const scored = Object.keys(tool.fitScores).sort().join();
    if (scored !== [...tool.jobs].sort().join()) {
      context.addIssue({
        code: "custom",
        path: ["fitScores"],
        message: "fitScores needs exactly one score for each job in jobs.",
      });
    }
    if (tool.verified && tool.lastVerified === null) {
      context.addIssue({
        code: "custom",
        path: ["lastVerified"],
        message: "A verified record needs the date it was checked.",
      });
    }
    if (!tool.verified) {
      if (tool.lastVerified !== null) {
        context.addIssue({
          code: "custom",
          path: ["lastVerified"],
          message: "An unverified record must not have a verification date.",
        });
      }
      if (tool.pricing !== VERIFY) {
        context.addIssue({
          code: "custom",
          path: ["pricing"],
          message: `An unverified record must use the ${VERIFY} placeholder.`,
        });
      }
    }
  });
export type Tool = z.infer<typeof toolSchema>;

export const MODEL_CLASS_IDS = [
  "fast-and-cheap",
  "balanced-everyday",
  "deep-reasoning",
  "long-documents",
  "coding",
  "image",
] as const;
export const modelClassIdSchema = z.enum(MODEL_CLASS_IDS);
export type ModelClassId = z.infer<typeof modelClassIdSchema>;

export const effortSchema = z.enum(["low", "medium", "high"]);
export type Effort = z.infer<typeof effortSchema>;

export const modelClassSchema = z.object({
  id: modelClassIdSchema,
  name: text(40),
  useFor: text(240),
  effortAdvice: text(240),
});
export type ModelClass = z.infer<typeof modelClassSchema>;

export const GOAL_IDS = [
  "portfolio-website",
  "study-plan",
  "resume-and-job-search",
  "make-a-video",
  "build-an-app",
  "research-and-reading",
  "business-website",
  "presentation",
  "pick-an-ai",
] as const;
export const goalIdSchema = z.enum(GOAL_IDS);
export type GoalId = z.infer<typeof goalIdSchema>;

/** The goal used when a task is recognised but no full goal matches. */
export const FALLBACK_GOAL_ID: GoalId = "pick-an-ai";

const workflowStepSchema = z.object({
  title: text(80),
  detail: text(400),
  examplePrompt: text(600).nullable(),
});

const modelStepSchema = z.object({
  task: text(60),
  modelClass: modelClassIdSchema,
  effort: effortSchema.nullable(),
});

const modelGuidanceSchema = z.object({
  jobId: slug,
  steps: z.array(modelStepSchema).min(1).max(4),
});

export const goalLevelSchema = z.object({
  summary: text(400),
  estimatedTime: text(120),
  jobs: z.array(slug).max(10),
  steps: z.array(workflowStepSchema).min(1).max(12),
  commonMistakes: z.array(text(240)).min(1).max(6),
  whenToUpgrade: z.array(text(240)).min(1).max(6),
  checkTheFacts: text(400).nullable(),
  modelGuidance: z.array(modelGuidanceSchema).max(8),
});
export type GoalLevel = z.infer<typeof goalLevelSchema>;

export const goalFeatureSchema = z.object({
  id: slug,
  label: text(40),
  keywords: z.array(text(40)).min(1),
  jobs: z.array(slug).min(1),
});
export type GoalFeature = z.infer<typeof goalFeatureSchema>;

export const goalTemplateSchema = z.object({
  id: goalIdSchema,
  title: text(60),
  headline: text(100),
  example: text(120),
  keywords: z.array(text(40)).min(1),
  synonyms: z.array(text(40)),
  starterBrief: text(1200),
  features: z.array(goalFeatureSchema).max(8),
  levels: z.object({
    simple: goalLevelSchema,
    polished: goalLevelSchema,
    advanced: goalLevelSchema,
  }),
});
export type GoalTemplate = z.infer<typeof goalTemplateSchema>;

export const catalogueSchema = z.object({
  providers: z.array(providerSchema).min(1),
  jobs: z.array(jobSchema).min(1),
  tools: z.array(toolSchema).min(1),
  modelClasses: z.array(modelClassSchema).min(1),
  goals: z.array(goalTemplateSchema).min(1),
});
export type Catalogue = z.infer<typeof catalogueSchema>;
