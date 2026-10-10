# Tool discovery

Once a week a job looks for AI tools that are not in the catalogue yet and follows what it finds in one pinned issue, the **Discovery watchlist**. A candidate gets an issue of its own only when it passes every admission rule. You review those issues. Nothing enters the catalogue unless you approve it and import it yourself. The reasons are in [0013](decisions/0013-tool-discovery.md).

The job is a finder, not a judge. It never says a new tool is better or worse than a listed one; it only lists the closest listed tools for the same jobs, and tools with a similar name, so you can compare them.

## How it works

```
GitHub search ----+
Hugging Face -----+--> source filters --> clean --> drop known and rejected --> merge
Hacker News ------+                                                              |
our news feeds ---+                                                              v
                                          Discovery watchlist (one issue, edited in place)
                                          add, refresh signals, expire after 90 days without growth
                                                                                 |
                                          passes all five rules: at most 5 a run, best score first
                                                                                 v
                                          issue "Tool candidate: ..."  (tool-candidate, ready-for-review)
                                                                                 |
                                          you add "approved" --> workflow posts a draft record comment
                                                                                 |
                                          npm run discover:import -- <n> --> validate, confirm, write
                                                                                 |
                                                 you review, verify and commit it yourself
```

- **`.github/workflows/tool-discovery.yml`** runs `scripts/discover.ts` every Wednesday and on demand (Actions, "Tool discovery", Run workflow). It has `contents: read` and `issues: write` only, actions pinned to commit SHAs, `npm ci --ignore-scripts`, and a concurrency group so two runs never overlap. It creates and edits issues. It never writes to the catalogue, pushes a commit or opens a pull request.
- **`.github/workflows/tool-approved.yml`** runs when the label `approved` is added to an issue. It posts one comment with a draft record (`scripts/discover-draft.ts`).
- **`npm run discover:import -- <issue-number>`** runs on your machine and is the only thing that writes catalogue files.
- **`npm run discover:dry-run`** prints what a run would find and do. It reads and writes no issue, so it starts from an empty watchlist: every candidate looks new, and nothing can be ready or expired yet.

### Sources and their filters

All sources are free and public and need no key. Each request has a 10 second timeout, a clear `User-Agent`, no redirect and a size limit. A source that fails (rate limit, outage) is skipped for the run and the others still count. Every threshold below is in [`src/data/discovery/config.json`](../src/data/discovery/config.json).

| Source              | What is read                                                                                     | Filters                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub search API   | Repositories created in the last 120 days with a topic from `github.topics`, most starred first  | At least 500 stars (`minStars`) and at least 5 stars a day since creation (`minStarsPerDay`). Not a fork, archived or disabled. No excluded word (`excludeWords`: awesome, tutorial, course, book, guide, roadmap, dotfiles, paper, arxiv, dataset, benchmark, prompts, list, and more) in the name or topics. Needs a homepage of its own, or a user-facing word in the description (`toolWords`: app, tool, assistant, editor, extension, plugin, cli, ...). |
| Hugging Face API    | Trending models and Spaces created in the last 120 days                                          | At least 200 likes; models also at least 10,000 downloads. No fine-tune, quantisation, merge or adapter (a `base_model:` tag, a tag such as `gguf`, `lora`, `awq`, `mergekit`, or a name such as `-awq`, `-ft`, `-lora`). Only the top 15 of each list are kept: organisations that are verified or on a team or enterprise plan come first, and a person's own account needs 1,000 likes.                                                                     |
| Hacker News Algolia | "Show HN" posts about AI in the last 60 days                                                     | At least 100 points and 20 comments. No "Ask HN" post. An external https link is required; links back to Hacker News and to papers, video and social sites are dropped.                                                                                                                                                                                                                                                                                        |
| Our news feeds      | Launch headlines ("Introducing X", "Announcing X", "X is now available") in `sources.json` feeds | Read with the site's own feed reader. The company behind the feed is the maker.                                                                                                                                                                                                                                                                                                                                                                                |

`discover:dry-run` prints, for each source, how many items it saw, how many its filters kept, how many are duplicates or rejected, and how many are new.

## The watchlist

One issue titled "Discovery watchlist", labelled `discovery-watchlist`. The job creates it on the first real run and tries to pin it; if GitHub refuses, pin it by hand.

- **Edited, never commented on.** The body is replaced each run. The visible part is a short summary: counts for the run and a table of the top 20 candidates by score, with names in code spans.
- **Hidden state.** A compact JSON block in an HTML comment holds every tracked candidate (id, name, trimmed description, links, maker, kind, sources, suggested jobs, first-seen date, the last six weekly snapshots of its signals, the homepage check, score, and the date it last grew) and the expired list. It is escaped so nothing inside it can end the comment, and it is validated again on every read.
- **The clock.** The 30 days start the first time a candidate enters the watchlist. It is not reset when the candidate is seen again.
- **Score.** Stronger signal levels first, then more sources, then the size of the largest number. It only orders the table and decides which ready candidates get an issue first. It is not a quality judgement.
- **Expiry.** A candidate none of whose usage numbers (stars, likes, downloads, points) has gone up for 90 days is removed and noted on the expired list for 180 days, so the next search does not add it again. After that it can enter again with a new clock.
- **Size.** At most 100 candidates are tracked. The body is kept under `maxBodyChars` (60,000, GitHub's limit is 65,536) by dropping the lowest scores first, then the oldest expired entries.
- **Leaving.** A candidate also leaves when it has joined the catalogue, is on the rejected list, or has been given an issue.

## The admission rules

A candidate gets an issue of its own, labelled `tool-candidate` and `ready-for-review`, only when all five are true. The same list appears, with the numbers, in the issue.

1. **A real place and someone behind it.** It has an official https website or an official repository (or, for a news item, an announcement on an official feed), and a named maker: the repository owner, the Hugging Face organisation, the "Show HN" poster or the company that owns the feed. When there is a website, one request to it (HEAD, then GET if HEAD is refused) must get an answer that is not 404, 410 or 5xx. Redirects are noted and never followed.
2. **Age.** It has been on the watchlist for at least 30 days (`minAgeDays`).
3. **Real usage.** In the latest snapshot there is at least **1 strong** signal or **2 moderate** ones, the candidate was seen over at least half the age period, and its signals were refreshed in the last 21 days.

   | Signal                          | Moderate | Strong |
   | ------------------------------- | -------- | ------ |
   | GitHub stars                    | 300      | 1,000  |
   | GitHub stars gained per 30 days | 100      | 500    |
   | Hugging Face likes              | 100      | 500    |
   | Hugging Face downloads          | 5,000    | 50,000 |
   | Hacker News points              | 50       | 150    |
   | Announced on an official feed   | -        | strong |
   | Seen in 2 independent sources   | moderate | -      |

   Signals are grouped by place, so stars and star growth count once, and likes and downloads count once.

4. **Not already in the catalogue.** No match on name, alias, official domain or repository address. Names are compared with the same edit-distance helper the goal interpreter uses (`src/lib/plan/text-match.ts`), so "Cursur" matches "Cursor". Aliases are made from what a record has: its id, its name without the company's name in front, and the name with the company's name added. Shared hosts (GitHub, Hugging Face, `github.io`) never identify a tool by host alone.
5. **Not rejected.** Not on `src/data/discovery/rejected.json` (names, and domains or `github.com/owner`), and not in a closed issue labelled `rejected`.

At most **5 new issues a run**, highest score first. The rest stay on the watchlist and are tried next week.

### Names that start with a listed tool's name

"Ollama Desktop" starts with "Ollama". It counts as the listed tool only when it is also on one of that tool's `officialDomains` (a host, or `github.com/<owner>`), or its maker is the tool's provider (the maker's name equals or begins with the provider's name). Otherwise it is a different thing with a similar name: it is added as a new candidate, and the listed tool appears in its issue under "closest existing tools" as "similar name, not the same tool".

## The candidate issues

- The body shows the maker, links, first-seen date, suggested jobs, the description, where it was found, usage signals, the five rules with their status, and the closest listed tools.
- A hidden state block at the end (escaped JSON in an HTML comment) lets the approval workflow read the candidate back. Only issues written by `github-actions[bot]` with the `tool-candidate` label are read as state.
- The issue is not edited again. A candidate that has any issue, open or closed, is never added to the watchlist or given a second issue, and a closed issue is never reopened.
- If you label an open issue `rejected`, the next run closes it as not planned.

### What is treated as hostile

Everything from a source is text from strangers. Before it is stored or shown:

- Control, invisible and bidirectional-override characters are removed, text is normalised, `<` and `>` are removed and backticks are replaced, and lengths are limited (name 60, description 300, address 300).
- Names, makers and descriptions appear only in code spans or in a code block. Issue titles use letters, digits and a few marks. So there are no `@mentions`, no `#123` or `owner/repo#12` references and no clickable links from candidate text.
- Only https addresses are kept, with no credentials, port, IP address or single-label host. They are shown as plain autolinks.
- No candidate website is fetched beyond the single homepage request in rule 1. No page is crawled, no file is downloaded and nothing from a candidate's site is read.

## Review checklist

Do this for each issue labelled `ready-for-review`. You may also look at the top of the watchlist at any time.

1. **Open the official site** by hand, from the link in the issue. Is it a real product page, with a name that matches? Check the address bar for look-alike domains.
2. **Check it is real and safe.** Who is behind it (company, team or a named maintainer)? Is there a privacy policy and terms? For a repository: is the owner the real project, with history, issues and a licence? Does it ask for sign-in, payment or permissions that do not fit what it does? If you doubt it, reject it.
3. **Check usage.** Look at the signals in the issue and the links under "Found in". Is the usage plausible for the time it has existed (not a sudden spike from one post)? Is it still being updated?
4. **Compare with the listed tools** under "Closest existing tools". Does it do something those do not, or serve a different kind of person, or is it a copy of what is listed? If a tool is marked "similar name", check that this is not just a new version or sibling of it. Add it only when it earns a place; a longer list is not better.
5. **Approve or reject.**
   - Reject: add the label `rejected` and close the issue. If it should never come back by name or domain, add it to `src/data/discovery/rejected.json` too.
   - Approve: add the label `approved`. Within a minute the workflow posts a comment with a draft record.
6. **Import.** On your machine, with the draft comment present:

   ```bash
   npm run discover:import -- 42
   ```

   It reads the draft from the public issue, validates it against the catalogue schema and the cross-file checks, shows it, and asks you to type `yes`. It adds the record to the right category file (and `providers.json` for a new maker), formats it and runs `npm run data:version`.

7. **Verify.** The record is unverified, with `pricing` `[verify]`, fit scores that are editorial estimates, and an empty `getIt`. Follow [VERIFYING-DATA.md](VERIFYING-DATA.md): official page, pricing, free option, download links. Rewrite the summary, strengths and cautions in your own words, correct the jobs, and set `verified` and `lastVerified` only for what you checked.
8. **Check and commit.** `npm run data:version && npm test`, then commit it yourself, for example `feat(data): add Notefox`. Close the issue.

## What the draft record holds

`name`, `provider` (an existing provider when the maker matches one, otherwise a new one), `summary` (the candidate's own description, cut to 180 characters, or a placeholder), `kind` (from topics: `cli`, `extension`, `library`, `model`, otherwise `ai-tool`), suggested `jobs` from the job keywords (or `ai-assistant` when none match, which you should change), `officialUrl`, `officialDomains`, an empty `getIt`, `verified` false, `lastVerified` null, `pricing` `[verify]`, `hasFreeOption` `"verify"`, and `fitScores` of 3 with `scoreSource` `editorial-estimate`.

Download links are never filled in. They are the riskiest data on the site, so they are added by hand after the checks in [VERIFYING-DATA.md](VERIFYING-DATA.md).

A candidate on Hugging Face or GitHub with no website gets its repository page as `officialUrl` and `github.com/<owner>` or `huggingface.co/<owner>` as its domain. If the maker has a real website, replace them.

## Running it

```bash
npm run discover:dry-run                 # finds and reports, touches no issue
npm run discover:import -- <issue>       # after "approved"
GITHUB_TOKEN=... GITHUB_REPOSITORY=owner/name npm run discover   # a real run, from your machine
```

To get fewer candidates, raise the source thresholds in `config.json`; to get more, lower them. `maxNewIssuesPerRun` (at most 25) limits how many reviews you are handed in a week.

Repository settings: Actions must be allowed to create issues. If "Workflow permissions" is set to read-only for the whole repository, the `permissions` block in the workflow files still applies, but an organisation policy can override it.

## What it cannot tell you

- It cannot tell whether a tool is good, safe or honest. It tells you a tool has been followed for a month and has some usage.
- Stars and points can be bought or borrowed from one post. A strong signal is a reason to look, not a reason to approve.
- Names are matched, not products. A rename or a second brand of a listed tool can look new; a different tool with a similar name can look listed or, with a similar name only, new.
- Star growth is only known once a candidate has been seen on two runs at least 14 days apart.
- "Official organisation" on Hugging Face is a heuristic (verified, or a team or enterprise plan). A real project's organisation may not have either.
- Some real tools are not on GitHub, Hugging Face or Hacker News, and some companies have no feed. They will not be found. Add them by hand as before.
