import { z } from "@/lib/schemas/zod";

export const PLAN_IDS = [
  "free",
  "plus",
  "pro",
  "ultra",
  "institution",
] as const;
export type PlanId = (typeof PLAN_IDS)[number];

const text = z.string().trim().min(1).max(200);

/** Every visible string exists in both interface languages. */
const localizedSchema = z.strictObject({ en: text, hi: text });

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const price = z.number().int().nonnegative().nullable();

export const featureSchema = z.strictObject({
  id: slug,
  name: localizedSchema,
  description: localizedSchema,
});

export const limitSchema = z.strictObject({
  id: slug,
  label: localizedSchema,
  value: z.number().int().positive(),
});

export const planSchema = z.strictObject({
  id: z.enum(PLAN_IDS),
  name: localizedSchema,
  tagline: localizedSchema,
  /** A short word shown on the card, such as "Recommended". */
  label: localizedSchema.optional(),
  /** The plan whose features this one also has. */
  includes: z.enum(PLAN_IDS).optional(),
  /** Whole rupees. `null` on both means "contact us". */
  monthlyPrice: price,
  yearlyPrice: price,
  highlight: z.boolean(),
  /** Features this plan adds. Inherited ones are resolved from `includes`. */
  features: z.array(featureSchema),
  limits: z.array(limitSchema),
});

export const pricingSchema = z
  .strictObject({
    currency: z.literal("INR"),
    plans: z.array(planSchema).min(1),
  })
  .superRefine((data, ctx) => {
    const issue = (message: string) =>
      ctx.addIssue({ code: "custom", message, path: ["plans"] });

    const seenPlans = new Set<string>();
    const seenFeatures = new Set<string>();
    let highlighted = 0;

    for (const plan of data.plans) {
      if (seenPlans.has(plan.id)) issue(`Duplicate plan id: ${plan.id}`);
      if (plan.includes !== undefined && !seenPlans.has(plan.includes)) {
        issue(`${plan.id} must include a plan that is listed before it`);
      }
      seenPlans.add(plan.id);

      if ((plan.monthlyPrice === null) !== (plan.yearlyPrice === null)) {
        issue(`${plan.id} needs both prices or neither`);
      }
      if (
        plan.monthlyPrice !== null &&
        plan.yearlyPrice !== null &&
        plan.yearlyPrice > plan.monthlyPrice * 12
      ) {
        issue(`${plan.id} costs more per year than twelve months`);
      }
      if (plan.highlight) highlighted += 1;

      for (const feature of plan.features) {
        if (seenFeatures.has(feature.id)) {
          issue(`Duplicate feature id: ${feature.id}`);
        }
        seenFeatures.add(feature.id);
      }
      const limitIds = plan.limits.map((limit) => limit.id);
      if (new Set(limitIds).size !== limitIds.length) {
        issue(`${plan.id} repeats a limit`);
      }
    }

    if (highlighted > 1) issue("Only one plan can be highlighted");
    const free = data.plans.find((plan) => plan.id === "free");
    if (!free || free.monthlyPrice !== 0 || free.yearlyPrice !== 0) {
      issue("The free plan must exist and cost 0");
    }
  });

export type Localized = z.infer<typeof localizedSchema>;
export type PlanFeature = z.infer<typeof featureSchema>;
export type PlanLimit = z.infer<typeof limitSchema>;
export type Plan = z.infer<typeof planSchema>;
export type PricingData = z.infer<typeof pricingSchema>;
