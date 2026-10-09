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
| 4     | Sign-in, saved plans and feedback           | Done        |
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
- **Saved plans (Projects).** Save stores only the plan request (goal type, chips, level, budget, tools you use) in your browser, in IndexedDB with a localStorage fallback. Opening one rebuilds the plan from current data, and a badge shows when tools were updated since you saved. Rename, duplicate, delete with Undo, search and sort. The sidebar shows your five most recent. Nothing is sent to a server ([0009](docs/decisions/0009-local-first-data.md)).
- **Search history (Searches)**, grouped by Today, Yesterday, Previous 7 days and Older, with re-run, delete and clear. It can be switched off.
- **Share links, export and import, PDF.** Copy share link puts the plan request after the `#` so it never reaches the server. Export all local data to one JSON file, import it with validation (max 1 MB, merge or replace). Download PDF opens the print dialog with a clean print stylesheet.
- **Settings** at `/settings`: language (English, हिन्दी), theme, reduce motion, default level and budget, currency display, history, data export, import and clear, account and about. Language and theme are also kept in cookies so the server renders them without a flash.
- **Hindi.** All interface text is translated with a small typed dictionary ([0010](docs/decisions/0010-i18n.md)). The Hindi text still needs native review, and tool details stay in English.
- Help, About and a custom 404 page; keyboard shortcuts (`/`, Ctrl or Cmd+Shift+O, `?`); Send feedback opens a GitHub issue form.
- Collapsible sidebar, mobile drawer, light, dark and system themes (the explicit choice is stored in a cookie).
- Sign in with Google or GitHub from the sidebar, in a glass popup (or at `/sign-in` without JavaScript). The session is an encrypted cookie that holds only your provider, provider id and name; there is no database, and your plans still stay in this browser. The popup lists Google, GitHub, Microsoft, Apple, email and phone; Google and GitHub work once configured and the rest say they are coming in an upcoming update. See [0008](docs/decisions/0008-sign-in.md).
- A plain-language privacy page at `/privacy` that says what stays on your device and how to delete it.
- Tool Library, What Changed and Compare Plans show a coming-soon notice.
- The news panel is marked as sample content and contains no real announcements.

## Security

Please report vulnerabilities privately. See [SECURITY.md](SECURITY.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

All rights reserved. A license will be added if the project is opened up.
