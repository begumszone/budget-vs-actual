import type { AnalysisMode, MonthlyRate, VarianceRow, YearSelection } from '../types';

/**
 * Which calendar month ("YYYY-MM") a row's base-side amount actually
 * occurred in. Budget-vs-actual: the row's own month, since a budget line
 * and its actual line share the same calendar month. Year-over-year: the
 * row's month-of-year within the selected base year, since the year was
 * stripped off when the two years were split apart for matching.
 */
export function getBaseMonthKey(row: Pick<VarianceRow, 'month'>, mode: AnalysisMode, years: YearSelection): string {
  if (mode === 'yoy') return `${years.baseYear}-${row.month}`;
  return row.month;
}

/** Same as {@link getBaseMonthKey} but for the comparison side. */
export function getComparisonMonthKey(
  row: Pick<VarianceRow, 'month'>,
  mode: AnalysisMode,
  years: YearSelection,
): string {
  if (mode === 'yoy') return `${years.comparisonYear}-${row.month}`;
  return row.month;
}

export interface MonthlyRateEntry {
  /** Canonical "YYYY-MM" key, also the key used in FxReportingSettings.rates. */
  key: string;
  year: number;
  /** Month-of-year, 1-12. */
  month: number;
  /** Whether this month has data on the base side, the comparison side, or both. */
  appliesTo: 'base' | 'comparison' | 'both';
}

function mergeAppliesTo(current: MonthlyRateEntry['appliesTo'] | undefined, next: 'base' | 'comparison') {
  if (!current || current === next) return next;
  return 'both' as const;
}

/**
 * Detects every distinct calendar month actually present in the data (on
 * either side), for rendering one rate-entry row per month. Grouping by
 * year happens at render time by reading each entry's `year`.
 */
export function detectMonthlyRateEntries(
  rows: VarianceRow[],
  mode: AnalysisMode,
  years: YearSelection,
): MonthlyRateEntry[] {
  const map = new Map<string, MonthlyRateEntry['appliesTo']>();

  for (const row of rows) {
    if (row.base_amount !== null) {
      const key = getBaseMonthKey(row, mode, years);
      map.set(key, mergeAppliesTo(map.get(key), 'base'));
    }
    if (row.comparison_amount !== null) {
      const key = getComparisonMonthKey(row, mode, years);
      map.set(key, mergeAppliesTo(map.get(key), 'comparison'));
    }
  }

  const entries: MonthlyRateEntry[] = [];
  for (const [key, appliesTo] of map) {
    const [yearStr, monthStr] = key.split('-');
    entries.push({ key, year: Number(yearStr), month: Number(monthStr), appliesTo });
  }

  return entries.sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month));
}

/** Looks up the base/comparison rates that apply to a specific row, or null if not entered. */
export function getRatesForRow(
  row: Pick<VarianceRow, 'month'>,
  mode: AnalysisMode,
  years: YearSelection,
  rates: Record<string, MonthlyRate>,
): { baseRate: number | null; comparisonRate: number | null } {
  const baseKey = getBaseMonthKey(row, mode, years);
  const comparisonKey = getComparisonMonthKey(row, mode, years);
  return {
    baseRate: rates[baseKey]?.baseRate ?? null,
    comparisonRate: rates[comparisonKey]?.comparisonRate ?? null,
  };
}
