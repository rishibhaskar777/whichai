# 0016: More goals, plans from parts and learning from misses

Status: accepted. Extends [0007](0007-catalogue-and-engine.md) and applies [0006](0006-zero-cost.md).

## Context

Nine goal templates left most sentences with "no plan yet". People describe what they want in many ways, in English, in Hindi words typed in English letters ("resume banao", "ppt for clg") and in half sentences. A language model would cover more, and [0006](0006-zero-cost.md) rules it out. The answer has to stay keywords, data and rules.

## Decision

### More templates, and a plan from parts for the rest

- `goals.json` holds 45 goals and one special goal, `custom-plan`. Each has all three levels, with jobs, workflow, mistakes, upgrade advice and model guidance, and 15 to 30 keywords and synonyms.
- Every job in `jobs.json` has 20 to 40 trigger words and phrases and a `stage` (idea, design, build, data, payments, launch, grow).
- Goals and jobs are scored together. A goal that fits is the plan, and jobs the sentence names beyond what the goal provides become **parts** (job chips). When no goal fits, the parts alone make a `custom-plan`, ordered by stage, with a generic workflow.
- A parts plan is a plan like any other: the engine picks a tool for each job, and each part gets its own workflow step.

### Keeping false parts down

- A phrase that is claimed by a longer phrase is not read again. Words that matched the goal or a feature are not read again as parts.
- Skill words (React, Git, deploy) set the level and are not parts.
- A short list of loose single words (`loose-words.ts`) is not enough to add a part once a goal has matched. They still count when the plan is built from parts alone.
- Words may sit apart in a phrase (up to two words between) at three quarters of the weight, because people do not write keyword phrases.

### Confidence and "Did you mean"

A goal is a clear match when it scores at least one (a distinctive word or a two-word phrase) and leads the runner-up by half a point. Otherwise the understanding card says so, offers the three best goals and, when the sentence names parts, a plan built from them. A goal that only shares a word ("website") gives way to parts the sentence really names.

### Parts are part of the plan request

`addedJobs` and `removedJobs` join the plan request, so saved plans, share links, the address fragment and the news matching all carry them. Both default to empty, so older plans and links still open. Empty lists are left out of share links.

### Learning from misses stays on the device

Goals with no match, goals that only parts explained, and goals the interpreter was unsure about go into a list of at most 50 in local storage, only while search history is on. Nothing is sent. Settings shows the list and, only when the person presses the button, opens a prefilled GitHub issue that they can edit and submit themselves. The list is not in backups and is removed by "Clear all data".

### Measuring

`goal-corpus.ts` holds the test sentences, each with the goal (and parts) it should lead to, and a test fails below a 90% match rate. `npm run goals:report` prints the rate and every miss. The set is split in two. The second set was written after the first had been tuned against, and was run once before any keyword was changed.

## Consequences

- Adding a goal or a trigger word is a data change plus corpus sentences. The interpreter does not change.
- The corpus is the author's own reading of how people type. It shows regressions and gaps. It is not a measure of real use, and the rate on new phrasings will be lower than on sentences the keywords were tuned against. The misses list in Settings is how real gaps reach the project.
- 45 goals make the "no match" card long. It lists every goal as a button.
- Phrase matching with gaps and many more phrases cost a few milliseconds per sentence in the browser. The interpreter caches the split phrases.
