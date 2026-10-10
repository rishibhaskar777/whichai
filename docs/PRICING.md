# Pricing

Plans, prices and features live in one file, [src/data/pricing/plans.json](../src/data/pricing/plans.json). The pricing page, the checkout preview, the Settings subscription section and the sidebar label all read it, so changing the file changes every screen. No code edit is needed.

Nobody can subscribe yet. Every account and every guest is on Free, and `getCurrentPlan()` in `src/lib/pricing/current-plan.ts` returns `"free"`. See [0014](decisions/0014-pricing-preview.md).

## File shape

```json
{
  "currency": "INR",
  "plans": [
    {
      "id": "plus",
      "name": { "en": "Plus", "hi": "प्लस" },
      "tagline": { "en": "...", "hi": "..." },
      "includes": "free",
      "monthlyPrice": 49,
      "yearlyPrice": 490,
      "highlight": false,
      "features": [
        {
          "id": "change-alerts",
          "name": { "en": "Change alerts", "hi": "..." },
          "description": { "en": "...", "hi": "..." }
        }
      ],
      "limits": [
        {
          "id": "compare-tools",
          "label": { "en": "Tools in one comparison", "hi": "..." },
          "value": 3
        }
      ]
    }
  ]
}
```

| Field             | Meaning                                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| `id`              | One of `free`, `plus`, `pro`, `ultra`, `institution`. Adding a new id needs a code change (`PLAN_IDS` in `schema.ts`) |
| `name`, `tagline` | Shown on the card. Every visible string has an `en` and a `hi` version                                                |
| `label`           | Optional word shown on the card, such as "Recommended"                                                                |
| `includes`        | The plan whose features this one also has. It must be listed earlier in the file                                      |
| `monthlyPrice`    | Whole rupees. `0` for Free. `null` for "contact us"                                                                   |
| `yearlyPrice`     | Whole rupees, never above twelve months. `null` together with `monthlyPrice`                                          |
| `highlight`       | Gives the card the accent border. Only one plan can have it                                                           |
| `features`        | Features this plan **adds**. Inherited ones come from `includes`, so list each feature once                           |
| `limits`          | Numeric limits. Shown in the comparison table's Limits group, with a dash where a plan has none                       |

## Common changes

**Change a price.** Edit `monthlyPrice` and `yearlyPrice`. The "2 months free" text is computed as `(monthly × 12 − yearly) ÷ monthly`. If the result is not a whole number the page shows "Save ₹X a year" instead, so the text is never wrong.

**Add a feature to a plan.** Add an object to that plan's `features` with a new unique `id`, and both languages for `name` and `description`. Higher plans that include it pick it up through `includes`, and the comparison table gets a new row.

**Move a feature to another plan.** Cut it from one plan's `features` and paste it into another's. Keep the `id`.

**Add a limit.** Add `{ id, label, value }` to every plan that has the limit. Plans without it show a dash.

**Change who is recommended.** Move `highlight: true` and `label` to another plan.

## Rules

- **Free lists only what works today.** Before adding a feature to `free`, check that it works in the current release. Paid plans list planned features, and the pricing page says so.
- **No invented numbers.** No user counts, ratings, testimonials or discounts that never existed. "Recommended" is a label, not a claim about data.
- **Both languages.** A missing `hi` string fails the schema. Hindi text still needs a native review ([0010](decisions/0010-i18n.md)).
- **Rupees only.** `currency` must be `INR`. Taxes are not included in the numbers; the page says "Taxes may apply" ([0014](decisions/0014-pricing-preview.md)).

## Checks

`src/lib/pricing/schema.ts` validates the file when the module loads, so a bad edit fails the build and the tests. It checks both languages everywhere, both prices or neither, a yearly price no higher than twelve months, unique plan and feature ids, `includes` pointing at an earlier plan, one highlighted plan at most, and a Free plan that costs 0. `npm test` also checks the computed savings, the price formatting and the comparison table.

## Where the data is used

| Place                      | File                                       |
| -------------------------- | ------------------------------------------ |
| `/pricing`                 | `src/components/pricing/PricingView.tsx`   |
| `/checkout?plan=&billing=` | `src/components/pricing/CheckoutView.tsx`  |
| Settings, Subscription     | `src/components/settings/SettingsView.tsx` |
| Sidebar "Free plan" label  | `src/components/sidebar/PlanLabel.tsx`     |
| Helpers (savings, table)   | `src/lib/pricing/plans.ts`                 |
