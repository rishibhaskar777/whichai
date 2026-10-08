# WhichAI

A neutral guide that tells people which AI tools to use for a given goal, and how to use them. It returns one clear plan per goal (AI, plugins, libraries, database, deployment, cost) at three levels: Simple, Polished and Advanced.

It does not do the task for the user. It recommends, explains the trade-offs, and lets the user choose.

## Status

Early development. See [docs/ROADMAP.md](docs/ROADMAP.md) for the phases.

| Phase | Scope                                       | State       |
| ----- | ------------------------------------------- | ----------- |
| 1     | Project setup, home page, security baseline | Done        |
| 2     | Understanding step and plan view (samples)  | In progress |
| 3     | Tool data in JSON, rules engine             | Planned     |
| 4     | Saved plans and feedback in the browser     | Planned     |
| 5     | News and update pipeline                    | Planned     |

The project follows a [zero-cost rule](docs/decisions/0006-zero-cost.md): no paid APIs, no AI APIs, no hosted databases, no trackers.

## Tech

TypeScript throughout. Next.js (App Router), React, CSS Modules with CSS custom properties for design tokens, Vitest for tests. Details and reasons are in [docs/decisions/0001-tech-stack.md](docs/decisions/0001-tech-stack.md).

## Getting started

Requirements: Node.js 24 (see `.nvmrc`) and npm. The first build downloads the font files once, so it needs network access.

```bash
git clone https://github.com/rishibhaskar777/whichai-1.git
cd whichai-1
npm ci
cp .env.example .env.local
npm run dev
```

The site runs at http://localhost:3000.

## Scripts

| Command             | What it does                                       |
| ------------------- | -------------------------------------------------- |
| `npm run dev`       | Start the development server                       |
| `npm run build`     | Production build                                   |
| `npm run start`     | Serve the production build                         |
| `npm run lint`      | Run ESLint                                         |
| `npm run typecheck` | Run the TypeScript compiler without emitting files |
| `npm test`          | Run unit tests                                     |

## Project layout

Next.js App Router with a `src/` directory: `app/` for routes, `components/` for UI, `lib/` for validation and security helpers, `styles/` for design tokens, `data/sample/` for sample content. `src/proxy.ts` sets the CSP nonce and security headers on every request. Details are in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## What works now

- Home page with a goal input, suggestion chips and a sample news panel.
- Describe a goal and a local, rule-based interpreter (no AI service) shows what it understood as chips you can remove or add. Goals it does not cover get an honest "no plan yet" message.
- Confirm to see a sample plan for a portfolio website or a 60-day study plan, at Simple, Polished and Advanced levels, with job cards, tool plan comparison, workflow, copyable prompts and a starter brief.
- A "Make this more accurate" card marks tools you already use as Keep and hides paid-only alternatives at a ₹0 budget.
- **All plan content is sample data.** Tool names are examples; every price, limit and date is a placeholder, and the plan says so. Nothing you type is sent, stored or put in the URL.
- Save, Download PDF and Share are visible but disabled until a later release.
- Collapsible sidebar, mobile drawer, light, dark and system themes (the explicit choice is stored in a cookie).
- Pages for Projects, Searches, Tool Library, What Changed and Compare Plans show a coming-soon notice.
- The news panel is marked as sample content and contains no real announcements.

## Security

Please report vulnerabilities privately. See [SECURITY.md](SECURITY.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

All rights reserved. A license will be added if the project is opened up.
