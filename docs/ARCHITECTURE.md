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
  +--> lib/          validation, env, rate limiting, pure helpers
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
    goal-form/         search input, suggestions
    theme-toggle/, wordmark/, coming-soon/, icons/
  lib/
    env.ts             validated environment variables
    theme.ts           theme cookie name and parsing
    schemas/           Zod schemas shared by client and future endpoints
    security/          CSP builder and static security headers
  styles/
    tokens.css         design tokens (colour, type, spacing, motion)
    global.css         reset and base styles
  data/
    sample/            clearly marked sample data, never shown as real
    suggestions.ts     suggestion chips and placeholder examples
  engine/              Phase 3
docs/
  decisions/           architecture decision records
  prompts/             phase prompts for Claude Code
public/                static assets
```

## Data flow (full product, later phases)

1. The user enters a goal.
2. Server-side extraction turns the text into a structured request. Output is validated against a schema and checked against known tools, so it cannot introduce a tool that is not in our data.
3. The user confirms the understood request.
4. The rules engine filters and ranks tools from verified data and builds the plan at three levels.
5. A language model may phrase the explanation from the structured result. It never selects tools.

## Principles

- Server decides, client displays. Nothing security-relevant depends on client code.
- Recommendations come from verified, dated data, not generated text.
- Every external input is validated at the boundary.
- Features are built phase by phase; see ROADMAP.md.
