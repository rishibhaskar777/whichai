# Verifying tool data

Every record in `src/data/catalogue/tools/*.json` (one file per category) starts as `"verified": false` with `"pricing": "[verify]"`. The site shows these as sample data. This page is the checklist for turning one record into a checked one.

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

Change these fields in that tool's file under `tools/`:

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
npm run data:version   # after any change to a catalogue file
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

## Verify a download link safely

Download links are the most dangerous data on the site, because a wrong one can send someone to a fake installer. A link is checked separately from the record: `linkCheckedOn` records the day an address was opened and ended on an official page. It never sets `verified`.

Do this for each `getIt` link you add or review:

1. **Start from the tool's own site**, using `officialUrl`, typed or from a bookmark. Do not use a search result, an ad, a comparison blog, a "download" site or a link someone sent you.
2. **Find the download or install page from there.** Read the address bar. The host must be the tool's own domain (or a subdomain). Look for look-alikes: an extra letter, `-download`, a different top-level domain.
3. **Compare with the stored address.** If the official page moved, update the record to the new address, on a domain that is already in `officialDomains`. Add a domain only if the company says it is theirs on its own site.
4. **App stores.** Open the store link and check that the publisher is the company (or the project), and that the listing links back to the official site. Names are easy to copy. The store allowlist proves nothing about the publisher.
5. **Browser and editor extensions.** Same: check the publisher name and that the listing links to the official site. Be careful with extensions that share a name.
6. **Install commands.** Copy the command from the tool's own documentation, not from a forum. Keep it to one line. Do not add `sudo`. Any address inside it must be on the tool's domains.
7. **Models.** Open the organisation page and check it is the company's verified organisation, not a copy.
8. **Record it.** Run `npm run links:check -- --only=<tool-id>`. If it passes, `npm run links:check -- --only=<tool-id> --stamp` writes `linkCheckedOn`. For a site that refuses scripts, open it by hand, and set the date yourself only after following the steps above.
9. If you cannot confirm a link, **delete it**. The interface then shows "Find downloads on the official site". Missing is better than wrong.

The checker reports broken addresses, redirects that leave the official domains, store pages whose title does not name the tool, and moves. A weekly workflow runs it and keeps one issue titled "Broken catalogue links" up to date.

Products are renamed and domains move. When a tool's own site shows a new name, change `name` and `summary`, keep the `id` so saved plans keep working, and mention it in the commit.
