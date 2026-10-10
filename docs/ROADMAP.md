# Roadmap

Each phase ends with a working, deployed-quality increment. Do not start a phase before the previous one passes its checks.

Every phase follows the [zero-cost rule](decisions/0006-zero-cost.md): local code, JSON data in the repository, browser storage and free open-source packages. If a feature seems to need a paid service, stop and ask.

## Phase 1: Foundation and home page (done)

- Repository, tooling, CI, security baseline
- Design tokens and base layout (sidebar, centre, news panel)
- Home page with search input, suggestion chips, sample news panel
- Light and dark themes, responsive layout, reduced-motion support
- No backend features. The search input does not send data anywhere yet.

## Phase 2: Understanding step and plan view (done)

- Plan contract: Zod schemas for the understood goal and the plan ([0005](decisions/0005-plan-contract.md))
- Two hand-written sample plans with all three levels (replaced in Phase 3)
- Rule-based goal interpreter that runs in the browser
- Understanding card with removable and addable chips, honest no-match state
- Plan view: level switch, job cards, tier block, workflow, starter brief, facts box
- "Make this more accurate" card (tools already used, monthly budget), all in memory
- No accounts, database, network request or real tool data

## Phase 3: Tool data and rules engine (current)

### 3a: Catalogue and engine (done, [0007](decisions/0007-catalogue-and-engine.md))

- Tool, job, provider, model-class and goal-template data as JSON files in `src/data/catalogue/`, validated by Zod schemas and a cross-file check in tests and at build time
- Nine goal templates (portfolio website, study plan, resume and job search, make a video, build an app, research and reading, business website, presentation and a generic "pick the right AI" goal), each at three levels
- Rules engine that selects tools per job by level, budget, editorial fit score, provider variety and compatibility, and builds the plan with a toolkit summary and model guidance
- Goal understanding stays rule-based and local: keywords, synonyms, typo tolerance and task detection, no AI API
- Every record is unverified and uses placeholders. The interface shows "Sample data, not verified" and "Not verified" on each card

### 3b: Verification (next)

- Check records against official pages with [VERIFYING-DATA.md](VERIFYING-DATA.md), starting with the tools that appear in the most plans, and track progress with `npm run data:report`
- Add sources and tier details to verified records, and re-examine the editorial fit scores once records are checked
- A check that every verified record has a source and a date, and a way to flag records older than a set age

## Phase 4: Sign-in, saved plans and feedback

### 4a: Sign-in (done, [0008](decisions/0008-sign-in.md))

- Sign in with Google or GitHub (free OAuth, no database, no hosted auth service), shown as a glass popup and at `/sign-in`
- Stateless encrypted session cookie holding provider, provider id and display name; `getSession()` for later phases
- Privacy page, account menu with a CSRF-protected sign-out, setup guide in [AUTH-SETUP.md](AUTH-SETUP.md)
- Plans still stay in the browser; nothing is stored per user on a server

### 4b: Saved plans and app basics (done, [0009](decisions/0009-local-first-data.md), [0010](decisions/0010-i18n.md))

- Local storage layer (IndexedDB with a localStorage fallback), Zod-validated, versioned and limited
- Saved plans (Projects), search history (Searches), settings, export and import, share links and print to PDF
- English and Hindi interface text, help, about and not-found pages, keyboard shortcuts
- Feedback through a GitHub issue form. Saving per account on a server and aggregated feedback wait for a free option that has been approved
- Follow-ups: native review of the Hindi text, translated catalogue content, goal understanding in Hindi, syncing between devices

## Phase 5: Catalogue growth, library and updates

### 5a: Tool catalogue, Get it links, library and comparison (done, [0011](decisions/0011-get-it-links.md))

- About 300 tools, 50 jobs, split into one file per category, with models (`model`), extensions (`extension`) and command-line tools (`cli`) as new kinds
- `officialDomains` and optional `getIt` links per tool, restricted to the tool's own domains and official stores, with `linkCheckedOn` kept apart from `verified`
- Tool Library at `/tools`, a page per tool, and `/compare`, all server-rendered with the state in the URL
- `npm run links:check` and a weekly issue for broken links
- The catalogue and the rules engine load on demand instead of in the home page bundle
- Every record is still unverified. Plan tier names are supported by the schema but none has been confirmed

### 5b: News from official feeds (done, [0012](decisions/0012-news-from-official-feeds.md))

- About 30 official RSS and Atom feeds listed in `src/data/news/sources.json` and read by the server, refreshed at most every 30 minutes with an in-memory cache. This replaces the earlier idea of a scheduled script that opens pull requests: every headline is shown with its source and age, and the reviewed list of sources is the point of review
- The news panel shows the six newest headlines; `/what-changed` lists the last 60 days with search, tag and source filters and pages; each tool page shows its recent news
- "Affects your plans" is computed in the browser from the plans saved on the device
- Adding or removing a source: [NEWS-SOURCES.md](NEWS-SOURCES.md). The weekly workflow fetches every source and reports failing, empty or quiet feeds in the same issue as broken catalogue links
- Not done: alerts when a saved plan's tools change in the catalogue (as opposed to news)

### 5c: Tool discovery (done, [0013](decisions/0013-tool-discovery.md))

- A weekly GitHub Actions job finds candidate tools from GitHub search, Hugging Face, Hacker News (Show HN) and our own news feeds, using free public endpoints only
- Candidates are tracked in one pinned issue, "Discovery watchlist", edited in place with a hidden state block; a candidate gets an issue of its own (`tool-candidate`, `ready-for-review`) only when it passes all five rules, at most 5 per run. Candidates with no growth for 90 days expire and are not re-added for 180
- Per-source filters (GitHub, Hugging Face, Hacker News) with thresholds in `config.json`, and a name that merely starts with a listed tool's name counts as that tool only when the domain or maker matches
- Five admission rules (a real place and maker, 30 days, usage signals, not in the catalogue, not rejected) with thresholds in `src/data/discovery/config.json`; the job lists the closest listed tools and never judges better or worse
- The `approved` label posts a draft record; `npm run discover:import` validates and adds it locally for review, verification and a commit
- `npm run discover:dry-run` for local use. How it works and the review checklist: [TOOL-DISCOVERY.md](TOOL-DISCOVERY.md)
- Nothing is added to the catalogue without a person; download links are never filled in

## Later

Test results pages, pricing, institution features, a way to flag records older than a set age.
