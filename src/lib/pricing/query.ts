import { z } from "@/lib/schemas/zod";
import {
  BILLINGS,
  CHECKOUT_PLAN_IDS,
  DEFAULT_BILLING,
  type Billing,
  type CheckoutPlanId,
} from "./plans";

type RawParams = Record<string, string | string[] | undefined>;

/** The pricing page switch. Anything unknown falls back to monthly. */
export function parseBilling(params: RawParams): Billing {
  const value = params.billing;
  const single = Array.isArray(value) ? value[0] : value;
  return (BILLINGS as readonly (string | undefined)[]).includes(single)
    ? (single as Billing)
    : DEFAULT_BILLING;
}

const checkoutSchema = z.object({
  plan: z.enum(CHECKOUT_PLAN_IDS),
  billing: z.enum(BILLINGS).default(DEFAULT_BILLING),
});

export interface CheckoutQuery {
  plan: CheckoutPlanId;
  billing: Billing;
}

/**
 * Reads /checkout parameters. A missing billing period means monthly; any other
 * problem (an unknown plan, Free, a repeated parameter) returns null so the
 * page can send the person back to /pricing.
 */
export function parseCheckoutQuery(params: RawParams): CheckoutQuery | null {
  const parsed = checkoutSchema.safeParse({
    plan: params.plan,
    billing: params.billing,
  });
  return parsed.success ? parsed.data : null;
}

export function pricingHref(billing: Billing): string {
  return billing === DEFAULT_BILLING
    ? "/pricing"
    : `/pricing?billing=${billing}`;
}

export function checkoutHref(plan: CheckoutPlanId, billing: Billing): string {
  return `/checkout?plan=${plan}&billing=${billing}`;
}
