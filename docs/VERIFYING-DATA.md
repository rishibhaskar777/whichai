# Verifying tool data

Every record in `src/data/catalogue/tools.json` starts as `"verified": false` with `"pricing": "[verify]"`. The site shows these as sample data. This page is the checklist for turning one record into a checked one.

Fit scores (`fitScores`) are editorial estimates. Verifying a record does not turn them into test results, and they stay marked `"scoreSource": "editorial-estimate"`.

## Pick a record

```bash
npm run data:report
```

The report shows how many tools are verified, the oldest verified records (re-check these first once there are some) and any job with fewer than 3 tools. Start with the tools that appear in the most plans, usually the AI assistants.

## Check one tool

Use the tool's own pages only. Start from `officialUrl` and follow its pricing link. Do not copy from review sites, comparison blogs, search ads or memory.

1. **Open the official page.** Confirm the tool still exists, the name matches and the `officialUrl` is the right company.
2. **Find the pricing page.** Note the date you looked.
3. **Free option.** Is there a free plan, a free trial only, or nothing free?
   - Free plan: `"hasFreeOption": true`.
   - Trial only, or paid only: `"hasFreeOption": false`. A trial that needs a card is not a free option.
4. **Price.** Write the price for the cheapest paid plan in ₹ or $, exactly as the page shows it, with the billing period (per month or per year). If the page shows several currencies, prefer ₹ for an Indian visitor and say which. If the price depends on region, say so.
5. **Limits that matter for the goals this tool appears in.** For example messages per day, credits, number of projects, export limits, or whether commercial use is allowed on the free plan. Keep to what you can see on the page.
6. **Date.** Today's date in `YYYY-MM-DD`.
7. **Still true?** Read the record's `summary`, `strengths` and `watchOutFor`. Edit anything that is no longer accurate. Remove a claim you cannot confirm.

If you cannot confirm something, leave the record unverified. A record that is half checked is still unverified.

## Edit the record

Change these fields in `tools.json` for that tool:

```json
"hasFreeOption": true,
"pricing": "Free plan with limits: <what the page says>. Paid plan: <price> per month.",
"verified": true,
"lastVerified": "2026-10-09"
```

- `pricing` is plain text, up to 200 characters. It replaces `[verify]`. A price may appear here and nowhere else in the record.
- `lastVerified` must be a real date. A verified record without one does not pass the checks.
- Do not change `scoreSource`, and do not change `fitScores` as part of verification.

## Run the checks

```bash
npm test
npm run data:report
```

The tests reject a verified record with no date, an unverified record with a date or a price, a non-https link, and a price anywhere outside a verified record's `pricing`. The report should show one more verified tool.

## Commit

One tool, or a few tools from the same company, per commit:

```
chore(data): verify <tool name> pricing
```

Put the page you checked and the date in the pull request description so a reviewer can open the same page.

## After verifying

- The card for that tool shows the date and the official-docs source instead of "Not verified".
- A plan stops showing the sample notice only when every tool it names is verified.
- Prices and limits change. Re-check records on a schedule and always before a release. The oldest verified records in the report are the next ones to check.
