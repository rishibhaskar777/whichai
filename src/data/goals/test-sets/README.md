# Test sets for goal understanding

`user-written.json` holds sentences written by a real user, each with the goal
or parts that user expected. One object per sentence:

```json
{ "text": "ppt banao for my clg seminar", "goal": "presentation" }
{ "text": "razorpay with login", "parts": ["payments-india", "authentication"] }
{ "text": "the weather today", "none": true }
```

`goal` is a goal id from `goals.json`, `parts` are job ids from `jobs.json`
(alone, they expect a plan built from parts), and `none` marks a sentence that
should not lead to a plan.

`npm run goals:report` prints this set's match rate on its own, apart from the
sets in `src/lib/plan/goal-corpus.ts`. Record its rate before and after any
keyword change, and prefer general synonyms to phrases that only fit one
sentence.
