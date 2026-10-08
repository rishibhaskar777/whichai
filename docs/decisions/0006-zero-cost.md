# 0006: Zero cost

Status: accepted

## Context

The project is built and run by one person with no budget. A dependency on something that charges, or may start charging, is a risk to the project itself, not just to a feature.

## Decision

The project must never depend on anything that costs money:

- No paid APIs and no AI APIs.
- No hosted databases or other paid services.
- No paid fonts and no trackers.
- Nothing that needs a credit card, or that may charge later (free trials, free tiers that convert).

What is used instead:

- Local code, including a rule-based goal interpreter that runs in the browser.
- JSON data files in the repository, validated by schemas.
- Browser storage for anything a person saves.
- Free, open-source packages, added only after discussion.
- GitHub Actions on the free tier for checks and scheduled scripts.

If a feature seems to need a paid service, work stops and the decision goes back to the project owner. It is not worked around.

## Consequences

- Goal understanding uses keywords, synonyms and fuzzy matching instead of a language model. It is less flexible, so a goal it does not understand gets an honest "no plan yet" message rather than a guess.
- Tool data lives in the repository and is updated by reviewed pull requests, not by a database that an admin edits. This also gives every change a history.
- Plans are saved in the browser of the person who made them. They do not follow a person to another device until a free way to do that is approved.
- Server-side features that need storage (accounts, shared feedback totals) are out of scope until a free option is approved.
- The roadmap reflects this: Phase 3 uses JSON data and a rules engine, Phase 4 saves plans in the browser, Phase 5 uses a scheduled GitHub Actions script for news checks.
