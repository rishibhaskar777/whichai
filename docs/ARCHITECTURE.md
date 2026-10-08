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
  +--> lib/          schemas, goal interpreter, env, pure helpers
  +--> data/         typed data; sample data lives in data/sample/ only
  +--> engine/       (Phase 3) rules engine that selects tools for a goal
```

## Directory layout

```
src/
  proxy.ts             nonce, CSP and security headers on every request
  app/                 routes and layouts
    api/health/        health check route
    .well-known/       security.txt
    projects/, searches/, tool-library/, what-changed/, compare-plans/
                       coming-soon pages
  components/          UI components, one folder per component
    app-shell/         three-region layout, drawer, panel state
    sidebar/           navigation, sign-in notice
    news-panel/        sample news panel
    home-flow/         home page state: empty, understanding, no match, plan
    goal-form/         search input (full and compact), suggestions
    understanding-card/ editable chips, confirm and edit
    no-match-card/     honest "no plan yet" state
    plan-view/         level switch, job cards, tiers, workflow, accuracy card
    copy-button/       clipboard copy with visible success and failure states
    theme-control/, wordmark/, coming-soon/, icons/
  lib/
    env.ts             validated environment variables
    theme.ts           theme cookie name and parsing
    new-plan-signal.tsx lets the sidebar reset the home flow
    plan/              rule-based goal interpreter
    schemas/           Zod schemas: goal input and the plan contract
    security/          CSP builder and static security headers
  styles/
    tokens.css         design tokens (colour, type, spacing, motion)
    global.css         reset and base styles
    controls.module.css shared button and screen-reader-only classes
  data/
    sample/            clearly marked sample data, never shown as real
    suggestions.ts     suggestion chips and placeholder examples
  engine/              Phase 3
docs/
  decisions/           architecture decision records
  prompts/             phase prompts for Claude Code
public/                static assets
```

## Plan data flow

The home page is one client component, `HomeFlow`, that moves through five stages without changing the route:

```
empty -> understanding -> plan
            |  ^
            |  +-- editing (Edit puts the text back in the search)
            +----> no match (honest message, covered goals as chips)
```

1. The person submits a goal. `goalSchema` trims and validates it (1 to 500 characters).
2. `interpretGoal(text)` runs in the browser and returns an `UnderstoodGoal` or `null`. It makes no request.
3. On a match, the understanding card shows the chips. Feature, skill and constraint chips can be removed; features can be added from a fixed list. The goal chip is fixed.
4. "Yes, show my plan" recomputes the level from the chips that remain (`inferLevel`) and looks up the sample plan for the goal type.
5. `PlanView` shows one `PlanLevel` at a time. The level, the tools the person already uses and the monthly budget are component state. Nothing is stored, sent or put in the URL, and the goal text stays in memory until the page is closed or "New plan" is pressed.

"New plan" in the sidebar calls a small context signal (`new-plan-signal`) that `HomeFlow` listens to; it resets the stage, clears the text and focuses the search.

### Schemas

`src/lib/schemas/plan.ts` holds the Zod schemas and inferred types for `UnderstoodGoal`, `Plan`, `PlanLevel`, `JobRecommendation`, `TierComparison` and `WorkflowStep`. They are the contract between the interface and whatever produces plans; see [0005](decisions/0005-plan-contract.md). Sample plans in `src/data/sample/plans.ts` are validated against them in a unit test.

### The rule-based goal interpreter

`src/lib/plan/interpret-goal.ts` is a pure function. Its rules are plain data at the top of the file:

- **Goal rules**: a list of keyword patterns per goal type. The goal with more distinct keyword hits wins; a tie goes to the keyword mentioned first. No hit means `null`.
- **Feature rules**: one pattern per feature chip (animation, blog, contact form, dark mode, notes, quiz). A chip appears only when the feature is mentioned.
- **Skill rules**: one pattern and a level per skill (React, Next.js, API, Git, deploying). The inferred level is the highest level among the skill chips present, and `simple` when there are none.

Later phases extend it in place: more goal types, synonym lists, typo-tolerant matching and constraint rules (for example a budget). Because the output type is fixed by the schemas, the understanding card and the plan view need no changes when the rules grow. Goal understanding never calls an AI service ([0006](decisions/0006-zero-cost.md)).

### Later phases

Phase 3 replaces the sample plan lookup with an engine that selects tools from validated JSON data and builds the same `Plan` shape. The interface does not change.

## Principles

- Server decides, client displays. Nothing security-relevant depends on client code.
- Recommendations come from verified, dated data, not generated text.
- Every external input is validated at the boundary.
- Features are built phase by phase; see ROADMAP.md.
