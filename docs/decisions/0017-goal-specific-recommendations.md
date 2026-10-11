# 0017: Goal-specific recommendations and "Get more"

Status: accepted. Extends [0007](0007-catalogue-and-engine.md) and [0015](0015-plan-polish.md), and applies [0006](0006-zero-cost.md).

## Context

A job card used to show the tool's general summary, so ChatGPT read the same in a game plan, a thesis plan and a blog plan. People also had no help using a tool well once it was chosen. A language model could write goal-specific text, and [0006](0006-zero-cost.md) rules it out. All text has to come from reviewed data in the repository.

## Decision

### Text is data, written per goal, level and job

- Every level of every goal has `goodFor`, one line on who the level suits.
- Every job in a level has a **slot** in `slots`: `task` (what to do with the tool, continuing "Use <tool> to ..."), `tags` (the strengths that matter for it) and `starterPrompt`. The schema requires exactly one slot per job in `jobs`.
- Every job in `jobs.json` has a `defaultSlot`, used for parts a person adds and for feature jobs, which the goal does not write its own text for.
- Each goal has a `category` (websites and apps, games, writing, study, research and reading, media, business, data), or `null` where none fits.
- A test requires a different task for every goal and level of a job, and a different card text per goal for the same tool and job.

### Tools carry what they are good at

- `strengthTags` is a fixed vocabulary. `strengthNotes` holds one short phrase per tag, written to follow the tool's name. Every tool that does an AI job has them.
- The general assistants also carry `categoryNotes`, one note per goal category, marked `source: "editorial"`.
- A card's explanation is built from the category note for the goal, then the notes whose tags the slot lists. A tool with no matching notes falls back to its first general strength. The generic summary moved to a small "About <tool>" line.
- "Choose X if" for an alternative uses the same notes, so alternatives are goal-specific too.

### "Get more from <tool>"

- Shown on cards whose tool is an `ai-tool` and that has recorded data, collapsed by default. A tool with none shows no section.
- Models: `models` (name and capability class), `modelsUrl` and `modelsCheckedOn`. The schema requires all three together. The card shows names with "As of <date>" and a source link, and only the classes the goal calls for. Without names it shows capability-class advice. Names are copied from an official page for the product, never from memory.
- `tips` (with an optional `sourceUrl` and a `tipsCheckedOn`), `freePlanTips` (general advice, no numbers) and `enhancedBy` (catalogue tools with the goal categories they help, each shown with its kind and Get it button).
- The starter prompt for the goal and job, with a copy button.

## Consequences

- The text is written by hand. 634 goal, level and job slots and 51 default slots had to be authored, and each new goal or job needs its own.
- Notes are editorial and can be wrong or biased. They are labelled as such, and they stay general so they do not go out of date with a plan or a version.
- Model names go stale. `modelsCheckedOn` shows their age, and [VERIFYING-DATA.md](../VERIFYING-DATA.md) says how to re-check them. Where an official product page could not be read or did not map names to uses, no names are recorded.
- Feature jobs and added parts use the job's general text, so they read less specifically than a goal's own jobs.
- Data text stays in English. Interface text around it is in English and Hindi.
