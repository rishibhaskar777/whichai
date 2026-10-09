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

## Phase 5: News and updates

- A scheduled GitHub Actions script checks official sources and opens a pull request that changes the JSON data, so every change is reviewed before it ships
- The news panel and the What Changed page read from JSON in the repository
- Alerts for saved plans are computed in the browser by comparing a saved plan with the latest data

## Later

Tool library, plan comparison pages, test results pages, pricing, institution features.
