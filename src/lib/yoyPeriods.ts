import type { MappedRow, ParsedFile } from '../types';
import { normalizeMonth } from './normalizeMonth';

/** Returns the distinct calendar years present in a file's month column, newest first. */
export function extractAvailableYears(file: ParsedFile, monthColumn: string | null): number[] {
  if (!monthColumn) return [];
  const years = new Set<number>();
  for (const row of file.rows) {
    const normalized = normalizeMonth(row[monthColumn]);
    if (normalized) years.add(Number(normalized.slice(0, 4)));
  }
  return [...years].sort((a, b) => b - a);
}

/**
 * Filters mapped rows down to a single calendar year and rekeys `month` from
 * "YYYY-MM" to just the month-of-year ("MM"), so two years' rows can be
 * matched on the same month via the regular base/comparison join.
 */
export function splitByYear(rows: MappedRow[], year: number): MappedRow[] {
  const prefix = `${year}-`;
  return rows
    .filter((row) => row.month.startsWith(prefix))
    .map((row) => ({ ...row, month: row.month.slice(5) }));
}
