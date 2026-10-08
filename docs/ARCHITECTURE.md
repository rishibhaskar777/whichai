# Architecture

## Overview

A single Next.js application. Pages are rendered on the server. A small set of route handlers and a middleware layer provide the server behaviour. Recommendation logic is plain TypeScript, separate from the UI, so it can be tested without a browser.

```
Browser
  |
  v
middleware.ts        security headers, CSP nonce, basic request checks
  |
  v
app/                 routes, layouts, server components
  |
  +--> components/   presentational and interactive UI
  +--> lib/          validation, env, rate limiting, pure helpers
  +--> data/         typed data; sample data lives in data/sample/ only
  +--> engine/       (Phase 3) rules engine that selects tools for a goal
```

## Directory layout (target)

```
src/
  app/                 routes and layouts
  components/          UI components, one folder per component
  lib/
    env.ts             validated environment variables
    security/          CSP builder, rate limiter, input schemas
  styles/
    tokens.css         design tokens (colour, type, spacing, motion)
    global.css         reset and base styles
  data/
    sample/            clearly marked sample data, never shown as real
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
