# WhichAI

A neutral guide that tells people which AI tools to use for a given goal, and how to use them. It returns one clear plan per goal (AI, plugins, libraries, database, deployment, cost) at three levels: Simple, Polished and Advanced.

It does not do the task for the user. It recommends, explains the trade-offs, and lets the user choose.

## Status

Early development. See [docs/ROADMAP.md](docs/ROADMAP.md) for the phases.

| Phase | Scope                                       | State       |
| ----- | ------------------------------------------- | ----------- |
| 1     | Project setup, home page, security baseline | Done        |
| 2     | Understanding step and plan view            | Done        |
| 3     | Tool data in JSON, rules engine             | In progress |
| 4     | Sign-in, saved plans and feedback           | In progress |
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

The site runs at http://localhost:3000. Sign-in is optional and needs free Google and GitHub OAuth credentials; see [docs/AUTH-SETUP.md](docs/AUTH-SETUP.md).

## Scripts

| Command               | What it does                                       |
| --------------------- | -------------------------------------------------- |
| `npm run dev`         | Start the development server                       |
| `npm run build`       | Production build                                   |
| `npm run start`       | Serve the production build                         |
| `npm run lint`        | Run ESLint                                         |
| `npm run typecheck`   | Run the TypeScript compiler without emitting files |
| `npm test`            | Run unit tests                                     |
| `npm run data:report` | Print how much of the tool catalogue is verified   |

## Project layout

Next.js App Router with a `src/` directory: `app/` for routes, `components/` for UI, `lib/` for validation and security helpers, `styles/` for design tokens, `data/catalogue/` for the tool catalogue (JSON), `lib/engine/` for the rules engine, `lib/plan/` for the goal interpreter, `data/sample/` for sample news. `src/proxy.ts` sets the CSP nonce and security headers on every request. Details are in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## What works now

- Home page with a goal input, suggestion chips and a sample news panel.
- Describe a goal and a local, rule-based interpreter (no AI service) shows what it understood as chips you can remove or add. It tolerates typos, understands synonyms, and turns a task such as "make a logo" into tool picks. Only text it recognises nothing in gets an honest "no plan yet" message.
- Confirm to see a plan at Simple, Polished and Advanced levels. It lists the right mix of AI tools, models, libraries and services for the goal: a toolkit at a glance, a card per job with the kind of tool, which model class to use for which step, compatibility, other options, a workflow with copyable prompts and a starter brief. Nine goals are covered.
- A "Make this more accurate" card feeds your monthly budget and the tools you already use back into the engine. At ₹0 only tools with a free option, or one not yet confirmed, remain. A tool you already use is marked Keep when it scores close to the best.
- **All tool data is unverified.** The catalogue (about 80 tools) holds stable facts only. Every price and limit is a placeholder, and fit scores are editorial estimates, not test results. Each card says "Not verified" and the plan says "Sample data, not verified" until records are checked ([docs/VERIFYING-DATA.md](docs/VERIFYING-DATA.md)). Nothing you type is sent, stored or put in the URL.
- Save, Download PDF and Share are visible but disabled until a later release.
- Collapsible sidebar, mobile drawer, light, dark and system themes (the explicit choice is stored in a cookie).
- Sign in with Google or GitHub from the sidebar, in a glass popup (or at `/sign-in` without JavaScript). The session is an encrypted cookie that holds only your provider, provider id and name; there is no database, and your plans still stay in this browser. Without credentials the popup says sign-in is not configured. See [0008](docs/decisions/0008-sign-in.md).
- A plain-language [privacy page](src/app/privacy/page.tsx) at `/privacy`.
- Pages for Projects, Searches, Tool Library, What Changed and Compare Plans show a coming-soon notice.
- The news panel is marked as sample content and contains no real announcements.

## Security

Please report vulnerabilities privately. See [SECURITY.md](SECURITY.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

All rights reserved. A license will be added if the project is opened up.
