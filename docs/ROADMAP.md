# Roadmap

Each phase ends with a working, deployed-quality increment. Do not start a phase before the previous one passes its checks.

Every phase follows the [zero-cost rule](decisions/0006-zero-cost.md): local code, JSON data in the repository, browser storage and free open-source packages. If a feature seems to need a paid service, stop and ask.

## Phase 1: Foundation and home page (done)

- Repository, tooling, CI, security baseline
- Design tokens and base layout (sidebar, centre, news panel)
- Home page with search input, suggestion chips, sample news panel
- Light and dark themes, responsive layout, reduced-motion support
- No backend features. The search input does not send data anywhere yet.

## Phase 2: Understanding step and plan view (current)

- Plan contract: Zod schemas for the understood goal and the plan ([0005](decisions/0005-plan-contract.md))
- Two sample plans (portfolio website, 60-day study plan) with all three levels
- Rule-based goal interpreter that runs in the browser
- Understanding card with removable and addable chips, honest no-match state
- Plan view: level switch, job cards, tier block, workflow, starter brief, facts box
- "Make this more accurate" card (tools already used, monthly budget), all in memory
- No accounts, database, network request or real tool data

## Phase 3: Tool data and rules engine

- Tool, job and goal-template data as JSON files in the repository, validated by the Phase 2 schemas in tests and at build time, with verified dates and sources
- Rules engine that selects tools from that data and builds the plan at three levels
- Goal understanding stays rule-based and local: more keywords, synonyms and fuzzy matching in `interpret-goal.ts`, no AI API
- Tests for the engine and a check that every price, limit and date in the data has a source and a verification date

## Phase 4: Saved plans and feedback in the browser

- Plans and search history saved in the browser (local storage or IndexedDB), with export and import as a file
- No server accounts and no sign-in
- Feedback through a prefilled link to the repository's issue form. Aggregated feedback with response thresholds needs a server and waits for a free option that has been approved

## Phase 5: News and updates

- A scheduled GitHub Actions script checks official sources and opens a pull request that changes the JSON data, so every change is reviewed before it ships
- The news panel and the What Changed page read from JSON in the repository
- Alerts for saved plans are computed in the browser by comparing a saved plan with the latest data

## Later

Tool library, plan comparison pages, test results pages, pricing, institution features.
