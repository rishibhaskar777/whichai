# Architecture

## Overview

A single Next.js application. Pages are rendered on the server. A small set of route handlers and a proxy (the Next.js 16 name for middleware) provide the server behaviour. Recommendation logic is plain TypeScript, separate from the UI, so it can be tested without a browser.

```
Browser
  |
  v
proxy.ts             security headers, CSP nonce
  |
  v
app/                 routes, layouts, server components
  |
  +--> components/   presentational and interactive UI
  +--> lib/plan/     goal interpreter (keywords, typos, tasks)
  +--> lib/engine/   rules engine that chooses tools and builds the plan
  +--> lib/schemas/  Zod schemas: goal input, plan contract, catalogue
  +--> data/         JSON catalogue; sample news in data/sample/
```

## Directory layout

```
src/
  proxy.ts             nonce, CSP and security headers on every request
  app/                 routes and layouts
    api/health/        health check route
    api/auth/          OAuth sign-in, callback and sign-out routes
    sign-in/, privacy/ sign-in page for users without JavaScript, privacy page
    .well-known/       security.txt
    plan/              plan from a saved id or a share link
    projects/, searches/, settings/, help/, about/, not-found
    tool-library/, what-changed/, compare-plans/   coming-soon pages
  components/          UI components, one folder per component
    app-shell/         three-region layout, drawer, panel state
    sidebar/           navigation, sign-in button, account menu
    sign-in/           glass sign-in popup (native dialog), shared panel, provider marks
    news-panel/        sample news panel
    home-flow/         home page state: empty, understanding, no match, plan
    goal-form/         search input (full and compact), suggestions
    understanding-card/ editable chips, confirm and edit
    no-match-card/     honest "no plan yet" state
    plan-view/         level switch, toolkit, job cards, model guidance,
                       workflow, accuracy card
    copy-button/       clipboard copy with visible success and failure states
    local-data/        provider over the storage layer, plan actions, storage notice
    projects/, searches/, settings/, plan-route/   the pages' interface
    toast/, dialog/, shortcuts/, state-page/, content/   shared interface pieces
    theme-control/, wordmark/, coming-soon/, icons/
  lib/
    env.ts             validated environment variables (sign-in variables are optional)
    auth/              sessions, OAuth flow, CSRF, redirect allowlist, rate limiter
    theme.ts           theme cookie name and parsing
    preferences.ts     writes the theme and language cookies, motion attribute
    i18n/              typed English and Hindi dictionaries, translator, provider
    storage/           local storage layer (see below)
    share/             share-link encode and decode
    new-plan-signal.tsx lets the sidebar reset the home flow
    plan/              goal interpreter, text matching, chip helpers
    engine/            tool selection, plan assembly, text for cards
    catalogue/         cross-file data checks and the data report
    schemas/           goal input, plan contract and catalogue schemas
    security/          CSP builder and static security headers
  styles/
    tokens.css         design tokens (colour, type, spacing, motion)
    global.css         reset and base styles
    controls.module.css shared button and screen-reader-only classes
  data/
    catalogue/         providers, jobs, tools, model classes, goal templates
    sample/            sample news only
    suggestions.ts     suggestion chips and placeholder examples
scripts/
  data-report.ts       prints verification status of the catalogue
docs/
  decisions/           architecture decision records
  VERIFYING-DATA.md    how to check a tool record

public/                static assets
```

## The catalogue

Five JSON files in `src/data/catalogue/`, described by `src/lib/schemas/catalogue.ts`:

| File                 | Holds                                                                                                                                                          |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `providers.json`     | Company or project id, name and homepage                                                                                                                       |
| `jobs.json`          | The roles a tool can play (AI assistant, hosting, flashcards ...) with a category and keywords for matching tasks                                              |
| `tools.json`         | Each tool: provider, jobs, plain summary, kind, skill level, free-option flag, strengths, cautions, per-job fit score, compatible tools, official link, status |
| `model-classes.json` | Capability classes with plain "use it for" and effort advice. No model names                                                                                   |
| `goals.json`         | Goal templates: keywords, synonyms, features and, for each of the three levels, the jobs, workflow, mistakes, upgrade advice and model guidance                |

`src/data/catalogue/index.ts` parses the files with the schemas and runs `findProblems` from `src/lib/catalogue/validate.ts` when the module loads. A test runs the same checks, so a bad reference, a duplicate id, a non-https link or a stray price fails both the tests and the build. Every tool is unverified and uses placeholders for prices ([0007](decisions/0007-catalogue-and-engine.md)).

## Plan data flow

The home page is one client component, `HomeFlow`, that moves through five stages without changing the route:

```
empty -> understanding -> plan
            |  ^
            |  +-- editing (Edit puts the text back in the search)
            +----> no match (honest message, covered goals as chips)
```

1. The person submits a goal. `goalSchema` trims and validates it (1 to 500 characters).
2. `interpretGoal(text)` runs in the browser and returns an `UnderstoodGoal` or `null`. It reads keywords from the catalogue and makes no request.
3. On a match, the understanding card shows the chips. Feature, task and skill chips can be removed. The chips that can be added come from the matched goal (`addableChips`). The goal chip is fixed.
4. "Yes, show my plan" recomputes the level from the chips that remain (`inferLevel`) and renders `PlanView` with the understood goal.
5. `PlanView` calls `buildPlan(goal, { level, budget, toolsUsed })` and shows one `PlanLevel` at a time. The level, the tools the person already uses and the monthly budget are component state. Changing the budget or the tools used rebuilds the plan. Nothing is stored, sent or put in the URL, and the goal text stays in memory until the page is closed or "New plan" is pressed.

```
text --interpretGoal--> UnderstoodGoal --buildPlan--> Plan --PlanView--> cards
         |                    chips                      |
   goals.json, jobs.json     (goal, features,     tools.json, goals.json,
                              tasks, skills)      model-classes.json
```

"New plan" in the sidebar calls a small context signal (`new-plan-signal`) that `HomeFlow` listens to; it resets the stage, clears the text and focuses the search.

### Schemas

`src/lib/schemas/plan.ts` holds the Zod schemas and inferred types for `UnderstoodGoal`, `Plan`, `PlanLevel`, `JobRecommendation`, `ToolkitGroup`, `ModelGuidance`, `TierComparison` and `WorkflowStep`. They are the contract between the interface and the engine; see [0005](decisions/0005-plan-contract.md) and the extensions in [0007](decisions/0007-catalogue-and-engine.md). `src/lib/schemas/catalogue.ts` holds the schemas for the data files.

### The goal interpreter

`src/lib/plan/interpret-goal.ts` is a pure function over the goal templates and job keywords in the catalogue:

- **Goals**: each goal lists keywords and synonyms. A phrase scores its word count divided by the number of goals that list it. The highest score wins; a tie goes to the phrase mentioned first.
- **Typos**: `text-match.ts` lowercases, drops filler words and compares words by exact match, plural, or a small edit distance (words under 5 letters must match exactly and the first letter must agree).
- **Features**: each goal lists feature words. A feature chip appears only when the feature is mentioned, and it adds that feature's jobs to the plan.
- **Tasks**: when no goal matches but the text names a task ("make a logo"), the generic `pick-an-ai` goal is returned with a chip for each matching job.
- **Skills**: one pattern and a level per skill (React, Next.js, API, Git, deploying). The inferred level is the highest level among the skill chips present, and `simple` when there are none.

Goal understanding never calls an AI service ([0006](decisions/0006-zero-cost.md)). No match is returned only when nothing is recognised.

### The rules engine

`src/lib/engine/` holds pure functions:

- `select-tools.ts`: level and budget filters, ranking (fit score, provider variety, compatibility, rotating tie-break), keep, better and new tags, and the choice of up to two alternatives.
- `describe.ts`: the text on a card (why, pricing placeholder, cautions, "Choose X if ..."), the cost line, compatibility notes and `{job:id}` filling.
- `build-plan.ts`: `buildPlan`, which picks tools for each job at each level, skips jobs a chosen tool already covers, attaches model guidance to AI tools, groups the chosen tools into the toolkit and assembles a `Plan`.

The engine imports no component, and no component imports a ranking rule.

## Sign-in

Optional and stateless ([0008](decisions/0008-sign-in.md)). `src/lib/auth/` holds the logic and the routes under `src/app/api/auth/` are thin:

```
Sign in button --> /api/auth/sign-in/{provider}   state (+ PKCE for Google) in an encrypted 10 minute cookie
                          |
                          v
                  Google or GitHub  --> /api/auth/callback/{provider}
                          |   check state, exchange code, keep provider + id + name
                          v
               encrypted session cookie (7 days) --> allowlisted page
```

- `session.ts` encodes and decodes the cookie (JWE, A256GCM) and defines the cookie flags. `transaction.ts` does the same for the short sign-in cookie.
- `providers.ts` wraps `arctic`: authorization URLs, scopes, code exchange, and reducing the profile to three values.
- `csrf.ts` makes the sign-out token (an HMAC of the session cookie) and checks the origin. `redirect.ts` is the path allowlist. `rate-limit.ts` is the in-memory limiter.
- `get-session.ts` exports `getSession()` for server components and route handlers, and `getViewer()` for the layout. The layout passes the viewer and the available providers to `AppShell`, which shows the popup or the account menu.
- `config.ts` returns `null` when sign-in is not set up, and every caller then shows the "coming soon" message.

## Local data

Saved plans, search history and settings live in the browser ([0009](decisions/0009-local-first-data.md)). `src/lib/storage/`:

- `backend.ts`: a string key-value interface with three implementations, chosen in order: IndexedDB, localStorage, in-memory. In-memory means nothing survives the page and the interface says so.
- `envelope.ts`: every collection is stored as `{ schemaVersion, data }`. `readEnvelope` runs registered migrations up to the current version and refuses data from a newer version.
- `schemas.ts`: Zod schemas for `SavedPlan`, `HistoryEntry`, `Settings` and the backup file. Items are validated one by one on read and invalid ones are dropped. Each setting falls back to its default on its own.
- `store.ts`: loads and saves the three collections, never throws, reports `full` or `unavailable`, and refuses writes past a total size limit.
- `operations.ts`: pure functions for add, rename, duplicate, remove, restore, history grouping, backup parsing and merge or replace.
- `catalogue-version.ts`: a hash of the catalogue data. A saved plan stores the version it was saved with; a different version shows the "Updated tools" badge.

A saved plan holds the plan request (`src/lib/schemas/plan-request.ts`), not the plan, so `buildPlan` always uses current data. Limits: 100 plans, 200 history entries, 1.5 million characters in total, 1 MB for an imported file.

`LocalDataProvider` keeps the data in React state, writes through a queue, applies settings to the page at once and turns failures into messages. Components only talk to `useLocalData()`.

## Share links

`/plan#<base64url JSON>` holds a plan request. The fragment is never sent to a server. `decodePlanRequest` rejects anything over 4 KB, any character outside base64url, invalid UTF-8 or JSON, and anything that fails the strict request schema. `/plan?id=<id>` opens a saved plan. Both rebuild with `buildPlan`.

## Internationalisation

`src/lib/i18n/en.ts` is the source of truth and `hi.ts` is typed to the same keys, so a missing translation fails the compile. `createI18n(locale)` gives `t`, `tn` (plurals), `rich` (placeholders that are elements) and Intl formatting. The language is a cookie read by the root layout, which sets `<html lang>` and the provider's locale; server components use `getI18n()`. Changing it in Settings writes the cookie, updates the page and calls `router.refresh()`. Catalogue content stays in English ([0010](decisions/0010-i18n.md)).

## Principles

- Server decides, client displays. Nothing security-relevant depends on client code.
- Recommendations come from reviewed, dated data, not generated text. Until a record is verified the interface says so.
- Every external input is validated at the boundary.
- Features are built phase by phase; see ROADMAP.md.
