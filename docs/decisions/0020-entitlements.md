# 0020: Entitlements and daily plan limits

Status: accepted. Builds on [0014](0014-pricing-preview.md) and [0019](0019-preview-accounts.md).

## Context

The product has guests, preview accounts and a plan list in `plans.json`, but nothing says what each of them may do. The limits need one home so the plan flow, the locks and the pricing table cannot disagree.

## Decision

`src/lib/plans/entitlements.ts` is the single source of truth. It adds a `guest` tier next to the plan ids in `plans.json`; every plan other than `free` counts as paid.

| Feature                      | Guest           | Free   | Paid      |
| ---------------------------- | --------------- | ------ | --------- |
| Plans from a new goal, a day | 5               | 20     | unlimited |
| Saved projects               | none            | 10     | unlimited |
| Searches                     | this visit only | kept   | kept      |
| Share links                  | no              | yes    | yes       |
| Advanced level               | locked          | locked | yes       |
| Compare tools                | locked          | locked | yes       |
| PDF export                   | locked          | locked | yes       |

Only features that exist can be locked. A feature that is not built yet is left out of the code and the table, not shown as locked.

### These limits are enforced in the browser

There is no server account to hold them. A person who clears site data, uses a private window or edits storage can get past every limit. They are a product boundary for honest use, not a security control, and the pricing page says so. They become firm when online accounts exist and the counts live on the server.

### What counts

The limit works like a message limit in a chat: one use is taken when a new goal is submitted and its understanding card is made. Every way of starting a goal goes through one gate in `src/lib/plans/usage.ts`, `canStartNewGoal()` before and `recordNewGoal()` after: the home search, the composer under a plan, suggestion chips, a goal chosen on the no-match card and a re-run from Searches. In `HomeFlow` they all end in `startGoal()`.

These do not count: Edit (including sending the edited goal back unchanged), the "Add something we missed" chips, Add a part, "Yes, show my plan", switching level, Back and Forward, reloading a plan, opening a saved plan and opening a share link. A goal that no template matches makes no card and is not counted. `/plan` only opens saved and shared plans, which never start a goal, so it does not use the gate.

At the limit the composer stays but its textarea and send button are disabled, and a bar above it says when the count resets ("Resets in 3h 12m", updated every minute) with Register free and Log in for a guest or See plans for a free account. Suggestion chips are disabled and New plan shows the same bar. A card made before the limit can still be confirmed. At local midnight the composer re-enables without a reload. The limit is announced once to screen readers.

The sidebar shows a guest as "Guest" with "5 plans a day", never "Free plan", and the account menu has a "3 of 5 plans left today" line.

### Where usage is kept

`src/lib/plans/usage.ts` stores `{ day, count }` per profile under the key `plan-usage` in the same key-value backend as the preview accounts. It is not one of the plan collections, so Export, Import and "Clear all data" leave it alone; "Delete local account and data" removes it. The day is the local calendar day, so the count resets at local midnight, including while the page stays open.

A profile is `user:<id>` for a preview account, `viewer:<provider>` for a Google or GitHub session, `guest:<id>` for a guest and `guest:visitor` for someone who has done neither. When a guest, or a visitor, logs in, their count for the day is added to the account's and removed from the guest's, and everything stored in the plan collections stays as it was.

### Locks

A locked control looks like the control, carries a lock icon, shows "Available on paid plans" on hover and focus (also as its accessible description) and links to `/pricing`. Saving and share links are open to a free account, so for a guest they say "Free with an account" and open the Register view. A plan opened at Advanced by someone without it is shown at Polished.

Guests keep searches for the visit only: history is held in memory and not written, and entries from earlier visits are hidden until an account is used. When they log in, this visit's searches are written.

### Pricing page

The comparison table is built from `entitlementRows()`, so its numbers are the ones the app uses. Rows from `plans.json` that the entitlements already state are listed in `ENTITLEMENT_FEATURE_IDS` and not repeated. Compare, PDF export and the Advanced level moved from Free to Plus in `plans.json` to match.

### Developer tools

Only when `NODE_ENV` is `development`:

- If `DEV_TEST_EMAIL` and `DEV_TEST_PASSWORD` are set in `.env.local`, that preview account is created on first load, hashed like any other. The layout passes it to the client in development only. Nothing is committed with a real value.
- Settings shows a "Developer tools" section with a plan switcher and "Reset today's usage".

Both are behind `process.env.NODE_ENV === "development"` checks that the bundler folds away. `src/lib/production-bundle.test.ts` reads the output of `npm run build` and fails if it contains "Developer tools" or "DEV_TEST_". The test skips when there is no production build, so CI builds before it tests.

## Consequences

- One place to change a limit, and the pricing page follows.
- The limits are easy to bypass. That is accepted until accounts are online, and the page says it.
- A shared browser profile shares usage between whoever uses it.
