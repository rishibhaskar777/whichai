# 0005: The plan schema is the contract

Status: accepted. Extended by [0007](0007-catalogue-and-engine.md), which adds fields to the contract and relaxes `isSample` to a boolean.

## Context

Phase 2 builds the whole plan experience before any real tool data or recommendation logic exists. The interface must not be rewritten when that logic arrives, and the logic must not be shaped by whatever the interface happened to need first.

## Decision

`src/lib/schemas/plan.ts` defines the contract between the interface and whatever produces plans, as Zod schemas with inferred TypeScript types:

- `UnderstoodGoal`: goal type, title, chips (`goal`, `feature`, `constraint`, `skill`) and the inferred level. This is what the understanding card shows and edits.
- `Plan`: id, goal type, headline, `isSample` and one `PlanLevel` for each of Simple, Polished and Advanced.
- `PlanLevel`: summary, estimated cost and time, jobs, an optional tier comparison, workflow steps, a starter brief, an optional fact-check note, when to upgrade and common mistakes.
- `JobRecommendation`: job, tool, why, a Keep / Better option / New tag, pricing, what to watch out for, a source label, a last-verified date or `null`, an optional official link and alternatives.

Rules the contract enforces:

- `isSample` is the literal `true`. A plan that is not marked as a sample does not validate until real data exists and the schema is deliberately changed. The interface shows the sample notice whenever the plan is a sample.
- Money, limits and dates are display strings (for example `₹[verify]`). The schema does not accept a number as a price, so a price cannot appear without a decision about where it comes from.
- `lastVerified` is an ISO date or `null`. `null` is shown as "Not verified". Official links must be `https`.
- Source labels are `tested`, `official-docs`, `user-reported` or `sample`. Sample data uses `sample` only.
- An alternative carries `paidOnly`, which the budget question uses to hide options a person at ₹0 cannot use.

The interface never reads plan data that has not passed through these schemas. Sample data is validated by a unit test; later phases validate the JSON data files the same way, in tests and at build time.

The goal interpreter and the future engine both produce values of these types. Neither the interpreter nor the engine imports a component, and no component imports the interpreter's rules.

## Consequences

- Phase 3 fills the contract with verified data. A change to the contract is a deliberate change here, in the schemas and in the tests, not a side effect of a screen.
- Adding a field to a plan means touching the schema, the sample data and the sample-data test together, which keeps sample and real data in step.
- Because prices are strings, the interface cannot sort or filter by cost. If that is needed later, the schema gains a structured price next to the display string.
