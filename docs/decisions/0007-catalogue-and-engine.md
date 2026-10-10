# 0007: Tool catalogue and rules engine

Status: accepted. Extends [0005](0005-plan-contract.md) and applies [0006](0006-zero-cost.md).

## Context

Phase 2 showed two hand-written sample plans. Every goal got the same few tools, and adding a goal meant writing hundreds of lines of plan text. Phase 3 needs plans that show a sensible mix of AI tools, models, libraries and services for each task, without a database, an AI service or any cost.

## Decision

### Data lives in JSON files, validated by Zod

`src/data/catalogue/` holds five files: `providers.json`, `jobs.json`, `tools.json`, `model-classes.json` and `goals.json`. `src/lib/schemas/catalogue.ts` defines their schemas. `src/lib/catalogue/validate.ts` checks what a schema cannot: every referenced id exists, ids are unique, links are root pages, every provider is used, and no price appears where it should not.

`src/data/catalogue/index.ts` parses and validates the files when the module loads, so bad data fails the build. A test runs the same checks.

A **job** is a role a tool plays in a plan (AI assistant, hosting, flashcards). A **tool** lists the jobs it can do and a fit score for each. A **goal template** says which jobs a goal needs at each level and carries the workflow, mistakes, upgrade advice and model guidance for that level.

### The honesty rules are part of the schema

- Every tool is `verified: false` with `pricing: "[verify]"` and `lastVerified: null`. The schema rejects an unverified record that carries a price or a date, and a verified record without a date.
- Fit scores are 1 to 5 and always `scoreSource: "editorial-estimate"`. They are opinions used to order options, not test results, and the card says so.
- Prices and free-tier limits are never written into unverified records. `hasFreeOption` is `true`, `false` or `"verify"`. A price may appear only in the `pricing` text of a verified record.
- Model guidance names classes (`fast-and-cheap`, `deep-reasoning` and so on), never model versions, and tells the reader to check the tool's model picker.
- Links are `https` and point at a root page, so a link cannot go stale because a deep path moved.

[VERIFYING-DATA.md](../VERIFYING-DATA.md) is the checklist for turning a record into a verified one, and `npm run data:report` shows how far along it is.

### The engine is a set of pure functions

`buildPlan(goal, { level, budget, toolsUsed })` in `src/lib/engine/` returns a `Plan` (all three levels). For each job in a level it:

1. Takes the tools that can do the job.
2. Drops those above the plan level's skill (`beginner` for Simple, up to `advanced` for Advanced). If nothing is left it uses the full list and warns that the pick is more technical.
3. At a budget of ₹0, drops tools whose `hasFreeOption` is `false`. Tools marked `"verify"` stay and the card says the free option is not confirmed. Other budgets filter nothing, because prices are not known.
4. Orders what remains by fit score, then by a provider not yet used in the plan, then by known compatibility with tools already chosen, then by a hash of the goal and job so equal tools rotate between goals. The first is the recommendation; the next two are the alternatives.
5. Tags it **Keep** if the person already uses a tool for the job and its score is within 1 of the best, **Better option** if they use a clearly lower-scoring one, and **New** otherwise.

After picking, a second pass looks at the build tools in the plan and adds either "Works with ..." or a warning that no compatibility is known. A tool that lists a job under `includes` (a site builder includes hosting) removes that later job from the plan and says so on its card.

Variety comes from three places: the score order, the provider rule and the rotating tie-break. The scores are editorial opinions, so they are the first thing a reviewer should challenge.

### The plan contract is extended, not replaced

`JobRecommendation` gains `jobId`, `toolId`, `kind`, `fitScore`, `verified`, `modelGuidance` and `compatibilityNote`. `PlanLevel` gains `toolkit`, the chosen tools grouped by job category. `Plan` gains `startLevel`. Alternatives carry a `toolId`. Two relaxations: `isSample` is a boolean (true while any chosen record is unverified) instead of the literal `true`, and `why` may be up to 400 characters. The interface still reads only data that has passed these schemas.

### Goal understanding stays rule-based

The interpreter reads keywords, synonyms and feature words from `goals.json` and job keywords from `jobs.json`. It lowercases, drops filler words and matches phrases, tolerating plurals and typos through a small edit-distance function (`text-match.ts`, no dependency). A typo must keep the first letter and words shorter than 5 letters must match exactly. A phrase is worth its word count divided by the number of goals that list it, so a word every goal uses counts for less than one only a single goal uses. If no goal matches but the text names a task, such as "make a logo", the interpreter returns the generic `pick-an-ai` goal with a chip for each matching job. It returns no match only when nothing is recognised.

## Consequences

- Adding a goal, a job or a tool is a data change plus tests. The engine and interface do not change.
- The plan text for a goal is written once per level, not once per tool. Tool names are filled in with `{job:id}` placeholders.
- Editorial scores can be wrong or biased. They are labelled as such everywhere they are shown and are the first thing to improve once records are verified.
- The data files grow with the catalogue, and goal matching and plan building run in the browser. Since [0011](0011-get-it-links.md) the catalogue is loaded on demand, in its own chunk, when a person focuses the search or opens a plan, and library and tool pages read it on the server.
- A plan keeps its sample notice until every tool it names is verified.
- Compatibility, `includes` and the model-guidance steps are editorial too. Only the schema checks that they refer to real ids.
