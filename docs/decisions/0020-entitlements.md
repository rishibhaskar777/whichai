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

One plan counts when it is made from a new goal: the "Yes, show my plan" step of the home flow. These do not count: Back and Forward, switching level on the same plan, reloading a plan, opening a saved plan from Projects, opening a share link. Re-running a goal from Searches is a new goal and counts.

Counting is checked before the plan is shown. At the limit the plan is replaced by an inline card: a guest gets Register and Log in, a free account gets a link to `/pricing`. With two or fewer left, a small note near the search box says how many remain.

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
