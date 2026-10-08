# WhichAI

A neutral guide that tells people which AI tools to use for a given goal, and how to use them. It returns one clear plan per goal (AI, plugins, libraries, database, deployment, cost) at three levels: Simple, Polished and Advanced.

It does not do the task for the user. It recommends, explains the trade-offs, and lets the user choose.

## Status

Early development. See [docs/ROADMAP.md](docs/ROADMAP.md) for the phases.

| Phase | Scope | State |
|---|---|---|
| 1 | Project setup, home page, security baseline | In progress |
| 2 | Understanding step and plan result page | Planned |
| 3 | Tool data, rules engine, database | Planned |
| 4 | Accounts, saved plans, feedback | Planned |
| 5 | News and update pipeline | Planned |

## Tech

TypeScript throughout. Next.js (App Router), React, CSS Modules with CSS custom properties for design tokens, Vitest for tests. Details and reasons are in [docs/decisions/0001-tech-stack.md](docs/decisions/0001-tech-stack.md).

## Getting started

Requirements: Node.js (current LTS) and npm.

```bash
git clone https://github.com/rishibhaskar777/whichai-1.git
cd whichai-1
npm ci
cp .env.example .env.local
npm run dev
```

The site runs at http://localhost:3000.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run the TypeScript compiler without emitting files |
| `npm test` | Run unit tests |

## Project layout

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Security

Please report vulnerabilities privately. See [SECURITY.md](SECURITY.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

All rights reserved. A license will be added if the project is opened up.
