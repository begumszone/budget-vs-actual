import type { ParsedFile, RawRow } from '../types';
import { normalizeMonth } from './normalizeMonth';
import { parseLocaleNumber } from './parseNumber';

export const PERIOD_COLUMN = 'Period';
export const AMOUNT_COLUMN = 'Amount';

/**
 * Headers that look like a calendar period. A company budget sheet puts
 * the months across the top ("Jan-26", "Şubat", "2026-03", "Q1"...), so
 * this is what tells us the sheet is wide rather than long.
 */
export function detectMonthColumns(headers: string[]): string[] {
  return headers.filter((h) => normalizeMonth(h) !== null);
}

/** True when the sheet is laid out with a column per month rather than a month column. */
export function looksWide(headers: string[]): boolean {
  return detectMonthColumns(headers).length >= 2;
}

function uniqueName(base: string, taken: string[]): string {
  if (!taken.includes(base)) return base;
  let i = 2;
  while (taken.includes(`${base} (${i})`)) i++;
  return `${base} (${i})`;
}

export interface UnpivotResult {
  file: ParsedFile;
  periodColumn: string;
  amountColumn: string;
}

/**
 * Turns a wide sheet into the long shape the rest of the pipeline already
 * understands: one row per account per period. Nothing downstream -- the
 * matching, the variance maths, the FX split -- needs to know the file was
 * ever wide.
 *
 * Cells that are blank or non-numeric are skipped rather than written as
 * zero, so an empty month stays absent instead of becoming a real 0.
 */
export function unpivot(file: ParsedFile, monthColumns: string[]): UnpivotResult {
  const idColumns = file.headers.filter((h) => !monthColumns.includes(h));
  const periodColumn = uniqueName(PERIOD_COLUMN, idColumns);
  const amountColumn = uniqueName(AMOUNT_COLUMN, [...idColumns, periodColumn]);

  const rows: RawRow[] = [];
  for (const row of file.rows) {
    for (const monthCol of monthColumns) {
      const raw = row[monthCol];
      const amount = parseLocaleNumber(raw);
      if (amount === null) continue; // blank month: leave the period absent, never 0

      const out: RawRow = {};
      for (const id of idColumns) out[id] = row[id];
      // Keep the original header text: normalizeMonth understands it, and it
      // is what the user recognises if they revisit the mapping.
      out[periodColumn] = monthCol;
      out[amountColumn] = amount;
      rows.push(out);
    }
  }

  return {
    file: {
      fileName: file.fileName,
      sheetName: file.sheetName,
      headers: [...idColumns, periodColumn, amountColumn],
      rows,
    },
    periodColumn,
    amountColumn,
  };
}
