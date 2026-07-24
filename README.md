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

Try it immediately with the bundled sample data in [`sample-data/budget.csv`](sample-data/budget.csv) and [`sample-data/actual.csv`](sample-data/actual.csv) — it includes multiple months and departments, plus a couple of intentionally unmatched rows so you can see how those are surfaced.

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
- Column mappings aren't saved between sessions — you'll re-map if your file headers change.
- Number/date parsing handles common US, EU, and Turkish formatting conventions, but very unusual formats may need manual cleanup before upload.
- Possible v2: optional backend + auth so a small team can save uploads and compare month over month without re-uploading.
- Possible v2: department-level access control (a department only sees its own budget lines).

## License

MIT — see [LICENSE](LICENSE).
