# Budget vs Actual

A small, client-side web app for comparing budgeted amounts against actual amounts and instantly seeing variances — built for accounting and FP&A teams who currently do this comparison by hand in Excel every month.

Upload a budget file and an actual file (or one combined file), map your columns, and the tool matches rows by account code, month, and department, calculates the variance in amount and percent, flags anything that crosses a threshold you control, and lets you export the result back to Excel — all in your browser. Nothing is uploaded to a server, which makes it safe to use with real financial data.

> _Screenshot / GIF coming soon._

## How it works

1. **Upload** — two files (Budget + Actual) by default, or toggle to one combined file that already has both amount columns.
2. **Map columns** — the app guesses which of your uploaded columns map to each expected field (account code, account name, department, month, budget/actual amount) and lets you correct any guess. Your original headers don't need to match ours.
3. **Review** — a bar chart of budget vs actual by department (or account, if departments aren't present), a monthly trend line (once more than one month is present), a sortable variance table (biggest variances first), and a separate section listing any rows that only appear in one file.
4. **Adjust** — change the significance threshold (default ±10%) and flip which direction counts as "bad" (over budget for expense lines, under budget for revenue lines) — the table and charts update immediately.
5. **Export** — download an `.xlsx` with the original data plus calculated variance columns, and a summary sheet by department.

Use **Reset / start over** on the results screen to clear everything and upload a new pair of files.

## Locale vs. currency

The **EN / TR toggle** in the header controls *only* number and date formatting conventions — `1,234.56` (EN) vs `1.234,56` (TR). It never changes what currency your amounts are in.

The currency itself is set separately with the **Data currency** selector (TRY, USD, EUR, GBP) — you're telling the app what currency the numbers in your file already represent. This is a label/symbol choice only; the app does not fetch or apply any exchange rate for it. If you need to see the numbers converted into another currency, see the next section.

## Reporting in a different currency (FX variance decomposition)

Sometimes actual and budget were planned at one FX rate and closed at another, and you want to know how much of the total variance is genuinely operational (you spent/earned more or less than planned) versus just currency movement. Enable **"Report in a different currency"** on the results screen to see that split:

- Pick a **target currency** and enter two rates: the **budget rate** (the plan/rate you budgeted at) and the **actual rate** (the rate that actually applied), both expressed as *target currency per 1 unit of data currency*.
- For each row, the total variance in the target currency is split into:

  ```
  Total variance       = actual_local × r_actual − budget_local × r_budget
  Operational variance = (actual_local − budget_local) × r_budget
  FX variance           = actual_local × (r_actual − r_budget)
  ```

  `Operational variance + FX variance` always equals `Total variance` exactly — the app runs a reconciliation check on every row and throws if it doesn't add up, so this isn't just a documentation promise.

- **Convention:** the FX effect is measured **on actual volume** — it's "what would the rate movement alone be worth if the actual amount had been converted at the budget rate instead?" This means the operational variance is valued at the *budget* rate and the residual (the FX variance) absorbs the rest.
- If you pick a target currency that's the same as your data currency, there's nothing to convert, so the split is hidden.
- Missing or non-positive rates (blank, zero, or negative) are treated as "not entered yet" — the split shows "N/A" rather than dividing by zero or producing a nonsensical rate.

When enabled, the variance table gains **Operational Variance** and **FX Variance** columns (in the target currency), and a small summary above the table shows the totals for all three figures. The Excel export adds the same two columns to the detail sheet, department-level totals to the Summary sheet, and a rates note to the Notes sheet.

Try it with the bundled USD sample data ([`sample-data/budget-usd.csv`](sample-data/budget-usd.csv) / [`sample-data/actual-usd.csv`](sample-data/actual-usd.csv)): set **Data currency** to USD, upload those two files, then enable currency reporting with target **TRY**, budget rate **32**, and actual rate **34** — one row (`6000`, January) has identical budget and actual amounts in USD, so its entire variance in TRY is pure FX, making the split easy to sanity-check.

## Expected input format

Column headers don't need to match exactly — you'll map them in step 2 — but here's the shape the tool expects:

| Field | Required | Example |
|---|---|---|
| `account_code` | Yes | `5000` |
| `account_name` | No | `Marketing Expenses` |
| `department` | No | `Sales` |
| `month` | Yes | `2026-01`, `Jan-26`, `January 2026` |
| `budget_amount` (budget file) / `actual_amount` (actual file) | Yes | `40000` |

Sample budget row:

| GL Code | Account Name | Department | Period | Budget Amount |
|---|---|---|---|---|
| 5000 | Marketing Expenses | Sales | 2026-01 | 40000 |

Sample actual row:

| GL Code | Account Name | Department | Period | Actual Amount |
|---|---|---|---|---|
| 5000 | Marketing Expenses | Sales | 2026-01 | 47000 |

Try it immediately with the bundled sample data in [`sample-data/budget.csv`](sample-data/budget.csv) and [`sample-data/actual.csv`](sample-data/actual.csv) — it includes multiple months and departments, plus a couple of intentionally unmatched rows so you can see how those are surfaced. A second, USD-denominated pair ([`sample-data/budget-usd.csv`](sample-data/budget-usd.csv) / [`sample-data/actual-usd.csv`](sample-data/actual-usd.csv)) is included to try the currency-reporting feature described above.

Rows are matched by `account_code` + `month` (+ `department`, when present). Rows that exist in only one file are never silently dropped — they show up in their own "unmatched" section. A blank or zero budget doesn't cause an error; the variance percent is shown as "N/A".

## Running locally

```bash
npm install
npm run dev
```

Then open the printed local URL in your browser.

To build for production:

```bash
npm run build
npm run preview
```

## Deploying

This is a static site — any static host works. The simplest options:

- **Vercel**: import the repo, framework preset "Vite", no environment variables needed.
- **Netlify**: build command `npm run build`, publish directory `dist`.

Because everything runs client-side, there's no backend to configure and no data ever leaves the visitor's browser.

## Tech stack

- React + Vite + TypeScript
- [Recharts](https://recharts.org/) for the bar and trend charts
- [PapaParse](https://www.papaparse.com/) for CSV parsing
- [ExcelJS](https://github.com/exceljs/exceljs) for reading and writing `.xlsx` files (chosen over the `xlsx`/SheetJS package on npm, which has unpatched high-severity advisories)

## Roadmap / known limitations

- **v1 is client-side only** — there's no saved history. Re-uploading files starts a fresh comparison every time.
- The "bad direction" for significant-variance highlighting (over vs under budget) is a single global setting, not configurable per account or department yet.
- FX rates are entered manually — there's no live exchange-rate lookup (by design, since the app makes no network calls with your data).
- All rows share a single data currency; multi-currency datasets (different rows already in different currencies) aren't supported in v1.
- Column mappings aren't saved between sessions — you'll re-map if your file headers change.
- Number/date parsing handles common US, EU, and Turkish formatting conventions, but very unusual formats may need manual cleanup before upload.
- Possible v2: optional backend + auth so a small team can save uploads and compare month over month without re-uploading.
- Possible v2: department-level access control (a department only sees its own budget lines).

## License

MIT — see [LICENSE](LICENSE).
