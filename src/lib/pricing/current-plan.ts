import type { PlanId } from "./schema";

/**
 * The plan the person is on. Nobody can subscribe yet, so everyone, signed in
 * or not, is on Free. A later phase will read the plan from a stored
 * subscription here, and every screen that shows the plan already calls this.
 */
export function getCurrentPlan(): PlanId {
  return "free";
}
