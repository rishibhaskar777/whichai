# 0013: Tool discovery

Status: accepted. Applies [0006](0006-zero-cost.md) and [0012](0012-news-from-official-feeds.md), and extends [0007](0007-catalogue-and-engine.md) and [0011](0011-get-it-links.md).

## Context

The catalogue is a reviewed list, and AI tools appear faster than one person notices them. The project has no budget, no database and no AI service ([0006](0006-zero-cost.md)), and a wrong or malicious entry costs more than a missing one: a listed tool is a recommendation, and its download links are the most dangerous data on the site ([0011](0011-get-it-links.md)).

So discovery has to be cheap, slow and reviewed. It should find candidates and show the evidence. A person decides.

## Decision

### A weekly job finds candidates and opens issues

A scheduled GitHub Actions workflow reads four free, public sources: the GitHub search API, the Hugging Face API, Hacker News through Algolia, and the project's own official news feeds. It never writes to the catalogue, pushes a commit or opens a pull request. It creates and edits issues, and its token has `contents: read` and `issues: write`.

Every endpoint was fetched before it was used and needs no key. GitHub search is limited to 10 requests a minute without a token, and the job makes five. Each request has a 10 second timeout, a `User-Agent` that names the project, no redirect and a size limit, and a source that fails is skipped for the run.

### Issues are the state store

There is no database. Each candidate is one issue labelled `tool-candidate`, whose body ends with a hidden HTML comment holding JSON: the candidate id, first-seen date, sources and a signal history of one snapshot a week. The issue's creation date is the first-seen date.

- The JSON is escaped (`<`, `>` and `--` as unicode escapes) so nothing inside it can end the comment, the last block in a body wins, and every field is validated again on read. A body that cannot be read is ignored.
- Only issues written by `github-actions[bot]` are read as state. The labels `tool-candidate`, `ready-for-review`, `approved` and `rejected` are created if missing.
- A run opens at most 10 issues, strongest first, and edits the body of open candidates instead of commenting. A candidate that has any issue, open or closed, never gets another, and a closed issue is never reopened. Names and domains rejected for good are also in `src/data/discovery/rejected.json`.

Issues keep the history in a place the reviewer already uses, with no extra service. The cost is that state lives in text that anyone with write access can edit, which is why it is validated and why only the bot's issues count.

### Admission is five rules, and they never compare quality

A candidate is ready for review when it has a real place and a maker (and its homepage answers one request), was first seen at least 30 days ago, shows one strong or two moderate usage signals sustained over the period, is not in the catalogue, and is not rejected. The thresholds are data in `src/data/discovery/config.json`, not code.

The script does not decide that a candidate is better or worse than a listed tool. It lists the closest listed tools for the same jobs and the reviewer decides. This keeps the editorial judgement where [0007](0007-catalogue-and-engine.md) puts it, with a person.

- **Duplicates** are matched on name, aliases made from the record, official domains and repository addresses. Names use the edit-distance helper of the goal interpreter, so a typo matches. A product that starts with a listed tool's name counts as that tool. Shared hosts never identify a tool by host.
- **Signals are grouped by place** (stars and star growth are one, likes and downloads are one), so one audience is not counted twice. Mentions in two independent sources count as one moderate signal.
- The one outbound request to a candidate's site is a HEAD, or a GET when HEAD is refused, with no redirect followed and no body read. A site that answers 401, 403 or 429 exists but refuses scripts, and counts as an answer.

### Candidate data is hostile

Source text comes from strangers, so it is cleaned at the boundary and again when state is read back: invisible, control and bidirectional characters removed, angle brackets removed and backticks replaced, lengths limited, names and descriptions shown only in code spans or blocks, titles restricted to letters, digits and a few marks, and only plain https addresses kept (no credentials, port, IP address or single-label host). There are no mentions, issue references or clickable candidate text. The approval workflow reads the issue through the API and never interpolates event text into a script.

### Approval posts a draft, import is local

Adding the `approved` label runs a second workflow that posts one comment with a draft record in the catalogue's own schema: unverified, `pricing` `[verify]`, `hasFreeOption` `"verify"`, fit scores of 3 marked `editorial-estimate`, an empty `getIt`. `npm run discover:import -- <issue>` runs on the maintainer's machine, reads that comment from the public issue, validates it against the catalogue schema and the cross-file checks, shows it, asks for confirmation, writes the category file (and `providers.json` for a new maker), runs the data version update and prints the next steps. The maintainer reviews, verifies and commits it.

Drafts never contain download links.

### Small changes made so the same checks can run

- `src/lib/schemas/catalogue.ts` and `src/lib/catalogue/validate.ts` import their siblings with `.ts` extensions, so Node can run the catalogue checks in the import script without a build. Nothing else about them changes.
- A provider's homepage, like a tool's `officialUrl`, may carry a path on a shared host, and `huggingface.co` joins GitHub in that list. A project that lives on GitHub or Hugging Face has no root page of its own, and the alternative was to point its provider at the host's root, which would be wrong.

## Consequences

- No new dependency and no cost. The weekly job needs the free Actions minutes the link check already uses, a few.
- A first run has a large backlog (a few hundred candidates). It is worked through at 10 a week, strongest first, or reduced by raising the `listing` thresholds.
- Signals are the latest snapshot plus history, not a continuous record. Star growth is only known once a candidate has been seen on two runs at least 14 days apart.
- Matching is by name and address. A renamed product or a second brand of a listed tool can look new, and a different tool with a similar name can look listed. Both end up in front of a person.
- Stars, likes and points can be inflated. A strong signal is a reason to look, never to approve.
- Tools that are not on GitHub, Hugging Face or Hacker News, and companies with no feed, are not found. They are still added by hand.
- The workflows only run on GitHub. They are covered by tests that check their permissions, pinning and shape, and by running the same scripts locally, but their first real run is the real test.
