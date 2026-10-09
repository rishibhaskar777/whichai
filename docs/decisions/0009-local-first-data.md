# 0009: Local-first data

Status: accepted

## Context

People want to keep plans, see past searches and set preferences. The [zero-cost rule](0006-zero-cost.md) rules out a database and anything that charges. Sign-in ([0008](0008-sign-in.md)) is stateless and stores nothing per user.

## Decision

Everything a person saves stays on their device.

- **Where:** IndexedDB first, then localStorage, then memory for the visit. Each failure is caught, so private browsing or blocked storage never breaks a page; the interface says gently that nothing will outlast the visit.
- **What:** saved plans (the plan request, a title, the catalogue version, dates), search history (goal text, understood goal type, date) and settings. A plan is rebuilt with `buildPlan` each time it opens, so it always uses current data and takes little room.
- **How it is read:** each collection is `{ schemaVersion, data }`. Data is migrated to the current version, then every record is validated with Zod and invalid ones are dropped. Data from a newer version is ignored rather than guessed at.
- **Limits:** 100 saved plans, 200 history entries (oldest removed first), 1.5 million characters in total, 1 MB for an imported file. Hitting one shows a clear message.
- **Catalogue version:** a hash of the catalogue data. A plan saved under another version shows "Updated tools" until it is saved again.
- **Leaving:** Export writes one JSON file; Import validates it as untrusted input and offers Merge or Replace; Clear all data needs `CLEAR` typed.
- **Cookies:** only theme and language, one word each, so the server can render them without a flash.
- **Share links** carry the plan request in the URL fragment, which browsers never send to a server.

## Consequences

- Data does not follow a person to another device. Export and Import is the bridge until a free sync option is approved.
- Clearing site data deletes everything. The privacy page and Settings say so.
- There is no server-side copy to recover from, and nothing to breach.
- IndexedDB itself is exercised only in a real browser; unit tests use the in-memory and localStorage backends.
- A schema change needs a new migration registered in `src/lib/storage/envelope.ts` and a version bump in `limits.ts`.
