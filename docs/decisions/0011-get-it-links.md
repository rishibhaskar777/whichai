# 0011: Get it links, the Tool Library and comparison

Status: accepted. Extends [0007](0007-catalogue-and-engine.md) and applies [0006](0006-zero-cost.md) and [0009](0009-local-first-data.md).

## Context

A plan names tools, and the obvious next question is where to get them. A wrong link is the most dangerous thing the site can show: an address that is one letter off, or a "download" page on a third-party site, sends a person to a fake installer. The catalogue also grew from about 80 tools to about 300, which is too much to carry in the home page's JavaScript and too much to browse as a plan.

## Decision

### Download links are data, and they are restricted

- Every tool lists `officialDomains`: the hosts that belong to it. A host covers its subdomains. A project on a shared host names its owner too (`github.com/ollama`), so a link to another account on the same host fails.
- A tool may have a `getIt` object with `web`, `windows`, `macos`, `linux`, `android`, `ios`, `chromeExtension`, `firefoxAddon`, `edgeAddon`, `vscodeExtension`, `jetbrainsPlugin`, `modelPage` and `cliInstall`. Each link is `{ url, linkCheckedOn }`.
- An address is accepted only if it is https and its host is on the tool's `officialDomains` or on the store allowlist: `play.google.com`, `apps.apple.com`, `chromewebstore.google.com`, `addons.mozilla.org`, `microsoftedge.microsoft.com`, `marketplace.visualstudio.com`, `plugins.jetbrains.com`, `apps.microsoft.com`, `huggingface.co`. URL shorteners and third-party download sites are never accepted. The rule lives in `src/lib/catalogue/links.ts` and runs in the schema checks, the build and the tests.
- `cliInstall` is text. It is one line, uses no `sudo`, and any address inside it must be on the tool's domains. The interface shows it in a code block with a copy button and never runs it.
- **Missing is better than wrong.** When a link is not known with confidence it is left out, and the interface shows "Find downloads on the official site", which goes to the homepage.

### A checked link is not a verified record

`linkCheckedOn` says only that the address was opened and ended on an official page on that date. It does not make a record `verified`; that stays a person's decision ([VERIFYING-DATA.md](../VERIFYING-DATA.md)). The interface shows "Link not verified yet" when there is no date.

`npm run links:check` requests every address (HEAD, then GET), politely, and reports broken addresses, redirects that leave the official domains, store pages whose title does not name the tool, moves, and sites that refuse scripts. `--stamp` writes `linkCheckedOn` for the addresses that passed. It is run by hand. A weekly workflow runs it and opens or updates one issue, "Broken catalogue links". It has `contents: read` and `issues: write` only and its actions are pinned to commit SHAs.

The first run found renamed products and moved sites (a chat assistant that changed its name, a notebook product that now lives on a new domain, a Google Cloud product that had merged into another). Records were renamed or removed on that evidence. This is why the check is repeated and why a record stays unverified until a person has looked.

### The visitor's platform comes first

`navigator.userAgentData` is read first, with the user agent as the fallback. The visitor's system (and, for extensions, browser) is shown first and highlighted. Servers and the first render show the default order, so the markup always matches. Links open in a new tab with `rel="noopener noreferrer"`, and a short note says to check that the address bar shows the official site.

### Tool Library, tool pages and comparison are server-rendered

- `/tools` is a plain GET form. Search, filters, sort and page live in the URL, so a result is shareable, works without JavaScript and is keyboard accessible. Query values are validated and fall back to defaults.
- `/tools/[id]` has static params from the catalogue, its own title, description and canonical address, and a prefilled "Report a problem" issue with the tool id in the title.
- `/compare?tools=a,b,c` holds up to three tools in the URL. The add box is a form with a `datalist`, so it needs no script. On narrow screens the table scrolls sideways and snaps to each column.
- The old `/tool-library` and `/compare-plans` addresses redirect.

### The catalogue loads when it is needed

The home page used to bundle the catalogue and the rules engine. Now the interpreter, the catalogue and the plan view are separate chunks, loaded when the person focuses the search, submits a goal or opens a plan. The saved-plan "catalogue version" is a constant written by `npm run data:version` and checked by a test, so storage code no longer imports the data. Library and tool pages render on the server and send no catalogue to the browser.

## Consequences

- A new tool or link is a data change plus `npm run data:version`; the tests say what is wrong.
- The link rules are strict on purpose. A legitimate link on an unexpected domain needs the domain added to that tool, which is a reviewed change.
- Link checks depend on sites answering scripts. Many sites refuse them and stay unchecked until a person opens them.
- Store pages are on shared hosts, so a store link proves nothing about the publisher by itself. The checker compares the page title with the tool and provider names, and a reviewer should still check the publisher.
- `planTiers` exists in the schema (names only, features `[verify]`) but no record uses it yet, because no tier name has been confirmed from an official page.
