# 0013: Tool discovery

Status: accepted. Applies [0006](0006-zero-cost.md) and [0012](0012-news-from-official-feeds.md), and extends [0007](0007-catalogue-and-engine.md) and [0011](0011-get-it-links.md).

## Context

The catalogue is a reviewed list, and AI tools appear faster than one person notices them. The project has no budget, no database and no AI service ([0006](0006-zero-cost.md)), and a wrong or malicious entry costs more than a missing one: a listed tool is a recommendation, and its download links are the most dangerous data on the site ([0011](0011-get-it-links.md)).

So discovery has to be cheap, slow and reviewed. It should find candidates and show the evidence. A person decides.

## Decision

### A weekly job follows candidates on a watchlist

A scheduled GitHub Actions workflow reads four free, public sources: the GitHub search API, the Hugging Face API, Hacker News through Algolia, and the project's own official news feeds. It never writes to the catalogue, pushes a commit or opens a pull request. It creates and edits issues, and its token has `contents: read` and `issues: write`.

Every endpoint was fetched before it was used and needs no key. GitHub search is limited to 10 requests a minute without a token, and the job makes five. Each request has a 10 second timeout, a `User-Agent` that names the project, no redirect and a size limit, and a source that fails is skipped for the run.

The first version opened an issue for every candidate it found. A dry run found about 240 of them, which would have buried the issue list. The decision was changed before it ran: candidates are followed in **one pinned issue, the Discovery watchlist**, and only a candidate that passes every admission rule gets an issue of its own.

### Sources are filtered before anything is tracked

A search result is not a candidate. Each source applies its own filters, with thresholds in `src/data/discovery/config.json`:

- **GitHub:** a minimum star count and a minimum rise in stars a day since creation; no fork, archived or disabled repository; no list, course, tutorial, dotfiles or paper-only repository by name or topic; and a homepage of its own or a user-facing word in the description.
- **Hugging Face:** a likes threshold, and a downloads threshold for models; no fine-tune, quantisation, merge or adapter; only the top few of each list, with verified or team and enterprise organisations first and a higher likes threshold for a person's own account. "Official organisation" is a heuristic from the public organisation overview, because the list endpoints do not carry it.
- **Hacker News:** minimum points and comments; no "Ask HN"; an external https link is required.
- **News feeds:** launch headlines only, read with the site's own feed reader.

The filters keep out most of what a search returns (a dry run on 2026-10-11 saw about 680 items and kept about 200). They are blunt on purpose. A real tool that is filtered out is found again the day it clears a threshold, and a tool that was never going to clear one was not going to pass the usage rule either.

### The watchlist is one issue, edited in place

The issue is labelled `discovery-watchlist`. Its visible part is a short summary and a table of the top 20 candidates by score, with names in code spans. Its hidden part is an HTML comment holding JSON for every tracked candidate and the expired list.

- The body is edited each run and never commented on. Only an issue written by `github-actions[bot]` with the label is read as state, the JSON is escaped so nothing in it can end the comment, the last block in a body wins, and every field is validated again on read.
- Fields are compact (short keys, trimmed descriptions, three addresses, six weekly snapshots), at most 100 candidates are tracked, and the body is held under 60,000 characters, below GitHub's 65,536, by dropping the lowest scores first and then the oldest expired entries.
- The 30 day clock starts when a candidate first enters the watchlist.
- A candidate whose usage numbers have not gone up for 90 days expires, and is written to the expired list for 180 days so the next search does not add it again.
- A candidate that has joined the catalogue, been rejected, or been given an issue leaves the watchlist.

State lives in text that anyone with write access can edit, which is why it is validated and why only the bot's issues count. Issues keep the history in a place the reviewer already uses, with no extra service.

### Admission is five rules, and they never compare quality

A candidate is ready for review when it has a real place and a maker (and its homepage answers one request), has been on the watchlist for at least 30 days, shows one strong or two moderate usage signals sustained over the period, is not in the catalogue, and is not rejected. Thresholds are data, not code.

An issue of its own, labelled `tool-candidate` and `ready-for-review`, is opened for a ready candidate, at most 5 a run and highest score first. The script does not decide that a candidate is better or worse than a listed tool. It lists the closest listed tools for the same jobs and the reviewer decides. This keeps the editorial judgement where [0007](0007-catalogue-and-engine.md) puts it, with a person.

- **Duplicates** are matched on name, aliases made from the record, official domains and repository addresses. Names use the edit-distance helper of the goal interpreter, so a typo matches.
- **A name that starts with a listed tool's name** ("Ollama Desktop") counts as that tool only when the candidate is on one of the tool's `officialDomains` or its maker is the tool's provider. Otherwise it is treated as a new candidate and the listed tool is shown next to it as a similar name. The first version treated every such name as the listed tool, which would have hidden a stranger's namesake behind a real product.
- **Signals are grouped by place** (stars and star growth are one, likes and downloads are one), so one audience is not counted twice. Mentions in two independent sources count as one moderate signal.
- The one outbound request to a candidate's site is a HEAD, or a GET when HEAD is refused, with no redirect followed and no body read. It is made only for a candidate that passes the other four rules. A site that answers 401, 403 or 429 exists but refuses scripts, and counts as an answer.

### Candidate data is hostile

Source text comes from strangers, so it is cleaned at the boundary and again when state is read back: invisible, control and bidirectional characters removed, angle brackets removed and backticks replaced, lengths limited, names and descriptions shown only in code spans or blocks, titles restricted to letters, digits and a few marks, and only plain https addresses kept (no credentials, port, IP address or single-label host). There are no mentions, issue references or clickable candidate text. The approval workflow reads the issue through the API and never interpolates event text into a script.

### Approval posts a draft, import is local

Adding the `approved` label runs a second workflow that posts one comment with a draft record in the catalogue's own schema: unverified, `pricing` `[verify]`, `hasFreeOption` `"verify"`, fit scores of 3 marked `editorial-estimate`, an empty `getIt`. `npm run discover:import -- <issue>` runs on the maintainer's machine, reads that comment from the public issue, validates it against the catalogue schema and the cross-file checks, shows it, asks for confirmation, writes the category file (and `providers.json` for a new maker), runs the data version update and prints the next steps. The maintainer reviews, verifies and commits it.

Drafts never contain download links.

### Small changes made so the same checks can run

- `src/lib/schemas/catalogue.ts` and `src/lib/catalogue/validate.ts` import their siblings with `.ts` extensions, so Node can run the catalogue checks in the import script without a build. Nothing else about them changes.
- A provider's homepage, like a tool's `officialUrl`, may carry a path on a shared host, and `huggingface.co` joins GitHub in that list. A project that lives on GitHub or Hugging Face has no root page of its own, and the alternative was to point its provider at the host's root, which would be wrong.
- A `.gitattributes` file makes line endings explicit (`* text=auto eol=lf`, binary rules for images and fonts), because Windows checkouts showed every file as modified.

## Consequences

- No new dependency and no cost. The weekly job needs the free Actions minutes the link check already uses, a few.
- The review queue is short: at most 5 issues a week, each with the evidence. The watchlist is where the long tail waits, and most of it will expire without a person ever seeing it.
- A first real run adds up to 100 candidates to the watchlist and opens nothing for at least 30 days, because nothing is old enough.
- Signals are the latest snapshot plus six weekly snapshots, not a continuous record. Star growth is only known once a candidate has been seen on two runs at least 14 days apart.
- Matching is by name and address. A renamed product or a second brand of a listed tool can look new, and a different tool with a similar name can look new beside the listed one. Both end up in front of a person, with the similar tool named.
- Stars, likes and points can be inflated. A strong signal is a reason to look, never to approve.
- Tools that are not on GitHub, Hugging Face or Hacker News, and companies with no feed, are not found. They are still added by hand.
- Pinning an issue is a GraphQL call the workflow token may be refused. The job reports it and the issue is pinned by hand.
- The workflows only run on GitHub. They are covered by tests that check their permissions, pinning and shape, and by running the same scripts locally, but their first real run is the real test.
