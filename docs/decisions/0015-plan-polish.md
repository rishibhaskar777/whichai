# 0015: Plan page polish

Status: accepted. Changes parts of [0005](0005-plan-contract.md), [0007](0007-catalogue-and-engine.md), [0009](0009-local-first-data.md) and [0011](0011-get-it-links.md).

## Context

People using plans asked for four things: to try a different tool in a card without starting over, working Back and Forward buttons, fewer warnings about unfinished data, and no placeholder text such as `[verify]`.

## Decision

### Alternatives can be swapped in

- Every "Choose X if ..." line is a button. A swap shows the alternative's full card (summary, why, free option, pricing, strengths, cautions, Get it, model guidance). The previous pick joins the alternatives, and a "Switch back to <original>" button restores it. Each card also links to `/tools/<id>` in the same tab.
- The choice is stored per job in the plan request as `chosenTools` (`{ [jobId]: toolId }`, default `{}`, so older saved plans and share links still parse). `buildPlan` takes `chosenTools`; an unknown tool, or one that cannot do the job, is ignored. A choice applies at every level where the job appears.
- The toolkit and the starter brief follow the choice. The brief gains a line "Tools I plan to use: ..." built from the picks.
- `JobRecommendation.autoPick` names the engine's own choice when a swap is active.
- A swap fades the card content in (`opacity` and `transform`, fade only under reduced motion), announces "Now showing X for Y." in a status region and moves focus to the new tool's name.

### History follows the steps

- `HomeFlow` pushes a history entry for the understanding card and for the plan. Level, budget, tools used and chosen tools replace the current entry. Editing chips on the understanding card replaces it too, so Back returns to the same chips.
- The fragment holds the request in the share-link format. The understanding step uses the prefix `understanding.`. A goal with no match has a history entry with state only. The fragment is validated like a share link; anything invalid is the home step.
- The raw goal text is never in the address. It stays in the history entry's state (`whichaiHome`, added to the router's own fields), so Back to the start refills the search box and a reload starts empty. "New plan" clears it and adds a home entry.
- Reloading reads the fragment and restores the step. A card's "View full details" link notes the card in the current history entry (`whichaiReturnCard`), so Back from the tool page scrolls to and focuses it.
- Plans opened from Projects or a share link (`/plan`) do not rewrite their address when changed.

### No placeholders, fewer warnings

- Download buttons show only for links with `linkCheckedOn`. A tool with none shows one "Official site" button. The safety line stays. "Link not verified yet" is gone.
- Free option reads "Free plan available", "Paid only" or "Check the official site". Pricing shows the recorded summary with "From the official pricing page, checked <date>", or a "See pricing" link.
- Tools gain optional `pricingUrl` and `pricingCheckedOn`. Pricing text other than `[verify]` is allowed only with both, `pricingUrl` must be on the tool's `officialDomains`, and a date without text is rejected. The concrete-price check skips only pricing text that passed this rule. The currency is kept as the page showed it and is never converted. `verified` stays a person's decision.
- The engine's cost line no longer contains placeholders. `[verify]` stays in the data only as the marker for "not recorded" and is never rendered.
- The sample notice at the top of the plan and per-card "Not verified" text are removed. A verified record shows a "Verified <date>" tick. One quiet line at the bottom links to `/about#data`, which explains `linkCheckedOn`, `pricingCheckedOn`, `verified` and editorial fit scores.

## Consequences

- A shared plan link now holds the chosen tools, so it can be a little longer. The 4 KB limit still applies.
- Plans no longer say, at the top, that their data is unfinished. The honesty now rests on the bottom note, the About section and the absence of numbers where none were read from an official page.
- `JobRecommendation.pricing` changed from a string to `{ text, checkedOn, url }`, and `freeOption` is new.
- Pricing summaries go stale. `pricingCheckedOn` shows their age; re-read the page before relying on one.
