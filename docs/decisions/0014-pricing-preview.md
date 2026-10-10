# 0014: Pricing preview

Status: accepted. Applies [0006](0006-zero-cost.md) and [0010](0010-i18n.md).

## Context

The project wants paid plans eventually, and people need to see what is planned. But there is no payment gateway, no database and no budget ([0006](0006-zero-cost.md)), and taking money before those exist would be dishonest and unsafe. The site also stores nothing per user on a server ([0008](0008-sign-in.md), [0009](0009-local-first-data.md)), so there is nowhere to record a subscription.

## Decision

Build the whole customer-facing journey as a preview and take no payment:

- **Plan data** is one JSON file validated by Zod ([PRICING.md](../PRICING.md)), with prices in rupees and every visible string in English and Hindi.
- **Everyone is on Free.** `getCurrentPlan()` returns `"free"`. Every screen that shows the plan calls it, so a later phase changes one function.
- **/pricing** shows the plans, a monthly and yearly switch kept in the URL, a comparison table and a FAQ. Free lists only features that work today. Paid plans list planned features and the page says so.
- **/checkout** validates its query with Zod and redirects to `/pricing` for anything invalid, including Free. It shows an order summary. The Pay button opens a dialog that says payments are not open. The page has no input, form or network call, and never asks for card, UPI or bank details.
- **Settings** has a Subscription section with the same dialog behind "Manage subscription".
- **Terms, refund policy and contact** are drafts, marked as such on the page, so the wording is visible before launch and cannot be mistaken for final.
- **No gateway SDK, external script or font.** The CSP is unchanged.
- **Honesty rules.** No user counts, ratings, testimonials or discounts that never existed. "Recommended" on Pro is a label. Yearly savings are computed from the prices.

## What a later payment phase must add

None of this exists yet. Each item needs a decision and, for some, a cost, so each goes through [0006](0006-zero-cost.md) first.

1. **A payment gateway.** For India this is typically one that supports UPI and cards. The checkout page should hand over to the gateway's hosted page so card and UPI details never touch this site.
2. **Webhooks.** A route that receives signed payment events, verifies the signature, is idempotent and is rate limited. The browser's return to the site is not proof of payment.
3. **A database for subscriptions.** Plan, period, status, renewal date and provider ids, keyed by the signed-in account. This is the first server-side storage in the project; it needs backups, a retention rule and a privacy page update.
4. **Reading the plan from it.** `getCurrentPlan()` takes the session and reads the subscription. Features that are paid must then be enforced on the server, not only hidden in the interface.
5. **GST and invoices.** Whether the prices include tax, GST registration and invoicing, and what the checkout shows.
6. **Legal review.** Terms, refund and cancellation policy, privacy page and any consumer-protection requirements. The current pages are drafts.
7. **Cancellation and failed-payment flows**, and an answer to what happens to features when a plan ends.
8. **Security checklist items**: webhook verification, no card data stored, secrets only in the host environment, and logs without payment details.

## Consequences

- People can see and plan around the paid tiers without anything being charged.
- Prices and features can be edited by changing one file, but the numbers are not final until the legal and tax questions are answered.
- Several paid features (alerts, sync, team sharing, exports) do not exist. Listing them is allowed only because the page says they are planned. Each one still has to be built, and some may need a server or a paid service, which the zero-cost rule would block.
- The Hindi text needs a native review like the rest of the interface.
- Anyone can type `/checkout?plan=pro` and see the preview. That is intended, and the page is not indexed.
