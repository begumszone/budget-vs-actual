# Budget vs Actual

A small, client-side web app for comparing two periods of financial data and instantly seeing variances — built for accounting and FP&A teams who currently do this comparison by hand in Excel every month.

Upload your data, map your columns, and the tool matches rows by account code, month, and department, calculates the variance in amount and percent, flags anything that crosses a threshold you control, and lets you export the result back to Excel — all in your browser. Nothing is uploaded to a server, which makes it safe to use with real financial data.

> _Screenshot / GIF coming soon._

## Two analysis modes, one underlying model

Under the hood, every comparison this tool does is the same shape: a **base period** vs a **comparison period**. The mode switch at the top of the app picks what those two sides mean:

- **Budget vs Actual** — base = your budget, comparison = your actual. Rows are matched by account code + month (+ department).
- **Year over Year** — base = one calendar year's actuals, comparison of another year's actuals. Rows are matched by account code + *month-of-year* (+ department), so January lines up with January regardless of year. Useful when there's no budget to compare against at all, which is common for some periods/entities.

Because both modes share the same matching, variance math, threshold flagging, bad-direction toggle, charts, unmatched-row handling, currency-reporting, and Excel export, switching modes doesn't change how any of that behaves — only what the two sides are called and how they're uploaded.

Switching modes clears the current upload and results (with a confirmation if you're mid-flow), since the two modes need differently-shaped input.

## How it works

1. **Pick a mode** — Budget vs Actual or Year over Year, from the switch at the top.
2. **Upload**
   - *Budget vs Actual*: two files (Budget + Actual) by default, or toggle to one combined file that already has both amount columns.
   - *Year over Year*: one actuals file that spans multiple years — you don't need to split it into separate files per year.
3. **Map columns** — the app guesses which of your uploaded columns map to each expected field (account code, account name, department, month, amount) and lets you correct any guess. Your original headers don't need to match ours. In Year over Year mode, you also pick which two years to compare from the years detected in your file.
4. **Review** — a bar chart of base vs comparison by department (or account, if departments aren't present), a monthly trend line (once more than one month is present), a sortable variance table (biggest variances first), a **Total by account** roll-up across all uploaded months (handy for year-over-year, which is usually read cumulatively), and a separate section listing any rows that only appear on one side — including accounts that only exist in one year (new or discontinued lines), which are never silently dropped.
5. **Adjust** — change the significance threshold (default ±10%) and flip which direction counts as "bad" — the table and charts update immediately.
6. **Export** — download an `.xlsx` with the original data plus calculated variance columns, a YTD-totals sheet, and a summary sheet by department.

Use **Reset / start over** on the results screen to clear everything and upload new data.

## Locale vs. currency

The **EN / TR toggle** in the header controls *only* number and date formatting conventions — `1,234.56` (EN) vs `1.234,56` (TR). It never changes what currency your amounts are in.

The currency itself is set separately with the **Data currency** selector (TRY, USD, EUR, GBP) — you're telling the app what currency the numbers in your file already represent. This is a label/symbol choice only; the app does not fetch or apply any exchange rate for it. If you need to see the numbers converted into another currency, see the next section.

## Reporting in a different currency (FX variance decomposition)

Sometimes the base and comparison periods were valued at different FX rates, and you want to know how much of the total variance is genuinely operational (you spent/earned more or less) versus just currency movement. This works the same way in both analysis modes — in Budget vs Actual the two rates are the budget (plan) rate and the actual (realized) rate; in Year over Year they're each year's own rate. Enable **"Report in a different currency"** on the results screen to see the split:

- Pick a **target currency** and enter the **base rate** and the **comparison rate**, both expressed as *target currency per 1 unit of data currency*.
- For each row, the total variance in the target currency is split into:

  ```
  Total variance       = comparison_local × r_comparison − base_local × r_base
  Operational variance = (comparison_local − base_local) × r_base
  FX variance          = comparison_local × (r_comparison − r_base)
  ```

  `Operational variance + FX variance` always equals `Total variance` exactly — the app runs a reconciliation check on every row and throws if it doesn't add up, so this isn't just a documentation promise.

- **Convention:** the FX effect is measured **on comparison-side volume** — it's "what would the rate movement alone be worth if the comparison amount had been converted at the base rate instead?" This means the operational variance is valued at the *base* rate and the residual (the FX variance) absorbs the rest.
- If you pick a target currency that's the same as your data currency, there's nothing to convert, so the split is hidden.
- Missing or non-positive rates (blank, zero, or negative) are treated as "not entered yet" — the split shows "N/A" rather than dividing by zero or producing a nonsensical rate.

When enabled, the variance table (and the Total-by-account roll-up) gain **Operational Variance** and **FX Variance** columns in the target currency, and a small summary above the table shows the totals for all three figures. The Excel export adds the same columns to the detail and YTD-totals sheets, department-level totals to the Summary sheet, and a rates note to the Notes sheet.

Try it with the bundled USD sample data ([`sample-data/budget-usd.csv`](sample-data/budget-usd.csv) / [`sample-data/actual-usd.csv`](sample-data/actual-usd.csv)): set **Data currency** to USD, upload those two files, then enable currency reporting with target **TRY**, base rate **32**, and comparison rate **34** — one row (`6000`, January) has identical amounts on both sides in USD, so its entire variance in TRY is pure FX, making the split easy to sanity-check.

## Expected input format

Column headers don't need to match exactly — you'll map them in the mapping step — but here's the shape the tool expects.

**Budget vs Actual:**

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

**Year over Year:** the same `account_code` / `account_name` / `department` / `month` fields, plus a single `amount` column — but the file should contain rows for *at least two different calendar years* so there's something to compare. You'll pick the base and comparison years after mapping columns.

| GL Code | Account Name | Department | Period | Amount |
|---|---|---|---|---|
| 5000 | Marketing Expenses | Sales | 2025-01 | 38000 |
| 5000 | Marketing Expenses | Sales | 2026-01 | 47000 |

Try it immediately with the bundled sample data:
- [`sample-data/budget.csv`](sample-data/budget.csv) / [`sample-data/actual.csv`](sample-data/actual.csv) — Budget vs Actual, multiple months and departments, plus a couple of intentionally unmatched rows.
- [`sample-data/budget-usd.csv`](sample-data/budget-usd.csv) / [`sample-data/actual-usd.csv`](sample-data/actual-usd.csv) — USD-denominated, for trying the currency-reporting feature above.
- [`sample-data/actuals-2yr.csv`](sample-data/actuals-2yr.csv) — Year over Year, 2025 vs 2026 actuals for the same accounts, including one account that only exists in 2026 (a new "Cloud Hosting" line) and one that only exists in 2025 (a discontinued "Print Advertising" line) so you can see how new/discontinued lines show up.

Rows are matched by `account_code` + month (+ `department`, when present) -- the full month in Budget vs Actual mode, month-of-year in Year over Year mode. Rows that exist on only one side are never silently dropped — they show up in their own "unmatched" section. A blank or zero base amount doesn't cause an error; the variance percent is shown as "N/A".

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
- The "bad direction" for significant-variance highlighting is a single global setting, not configurable per account or department yet.
- FX rates are entered manually — there's no live exchange-rate lookup (by design, since the app makes no network calls with your data), and each side gets one rate for the whole analysis (not, say, a different rate per month within a year).
- All rows share a single data currency; multi-currency datasets (different rows already in different currencies) aren't supported in v1.
- Year over Year currently compares exactly two years at a time; multi-year trends (3+ years) aren't visualized yet.
- Column mappings aren't saved between sessions — you'll re-map if your file headers change.
- Number/date parsing handles common US, EU, and Turkish formatting conventions, but very unusual formats may need manual cleanup before upload.
- Possible v2: optional backend + auth so a small team can save uploads and compare month over month without re-uploading.
- Possible v2: department-level access control (a department only sees its own budget lines).

## License

MIT — see [LICENSE](LICENSE).
