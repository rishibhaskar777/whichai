# WhichAI

A neutral guide that tells people which AI tools to use for a given goal, and how to use them. It returns one clear plan per goal (AI, plugins, libraries, database, deployment, cost) at three levels: Simple, Polished and Advanced.

It does not do the task for the user. It recommends, explains the trade-offs, and lets the user choose.

## Status

Early development. See [docs/ROADMAP.md](docs/ROADMAP.md) for the phases.

| Phase | Scope                                       | State       |
| ----- | ------------------------------------------- | ----------- |
| 1     | Project setup, home page, security baseline | In progress |
| 2     | Understanding step and plan result page     | Planned     |
| 3     | Tool data, rules engine, database           | Planned     |
| 4     | Accounts, saved plans, feedback             | Planned     |
| 5     | News and update pipeline                    | Planned     |

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

- Home page with a goal input, suggestion chips and a sample news panel. The input validates the text and shows a notice; it sends and stores nothing.
- Collapsible sidebar, mobile drawer, light, dark and system themes (the explicit choice is stored in a cookie).
- Pages for Projects, Searches, Tool Library, What Changed and Compare Plans show a coming-soon notice.
- The news panel is marked as sample content and contains no real announcements.

## Security

Please report vulnerabilities privately. See [SECURITY.md](SECURITY.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

All rights reserved. A license will be added if the project is opened up.
