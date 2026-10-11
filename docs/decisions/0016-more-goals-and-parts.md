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

### Close goals: what is being made

Two goals can both fit ("business website with whatsapp chatbot and seo"). Scores alone cannot say which is the thing being made, so the words around a phrase decide. A phrase after "for", "with" or "and" names a subject or an add-on, and one after "into" names the result. When goals score within 2.5 points, both having a phrase of their own, the goal that is not an add-on or subject leads, and the other lends its first distinctive job as a part. A goal that only shares a word never decides. This reads English connectors only.

### The "no plan yet" card

Forty-five goals as buttons is too long. The card shows eight common goals (an editorial pick in `common-goals.ts`, not usage data), a search box that filters all goals by title, example and keywords, and a "See all goals" toggle that expands the goals grouped by category (each goal has a `group`). "Build from the parts I described" stays on the understanding card, because a sentence that names parts never reaches the "no plan yet" card: it gets a plan built from parts.

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
