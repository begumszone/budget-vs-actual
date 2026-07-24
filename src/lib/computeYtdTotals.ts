import type { FxReportingSettings, ThresholdSettings, VarianceRow } from '../types';
import { calculateVariance } from './calculateVariance';
import { calculateFxDecomposition } from './calculateFxVariance';
import { isFxActive } from './enrichRowsWithFx';
import type { FxDecomposition } from '../types';

export interface YtdTotalRow {
  key: string;
  account_code: string;
  account_name: string;
  department: string | null;
  base_amount: number;
  comparison_amount: number;
  variance_amount: number | null;
  variance_percent: number | null;
  isSignificant: boolean;
  direction: 'increase' | 'decrease' | null;
  monthsPresent: number;
  fx: FxDecomposition | null;
}

/**
 * Rolls variance rows up to one total per account (+ department), summing
 * across every month present. Rows are summed regardless of per-month match
 * status, so an account that only exists in one period (a new or
 * discontinued line) still gets a total -- with the missing side at 0 --
 * which surfaces it clearly rather than letting it disappear into a long
 * list of monthly unmatched rows.
 */
export function computeYtdTotals(
  rows: VarianceRow[],
  threshold: ThresholdSettings,
  fx: FxReportingSettings,
  dataCurrency: string,
): YtdTotalRow[] {
  const fxActive = isFxActive(fx, dataCurrency);

  const buckets = new Map<
    string,
    { account_code: string; account_name: string; department: string | null; base: number; comparison: number; months: number }
  >();

  for (const row of rows) {
    const key = `${row.account_code} ${row.department ?? ''}`;
    const bucket = buckets.get(key) ?? {
      account_code: row.account_code,
      account_name: row.account_name,
      department: row.department,
      base: 0,
      comparison: 0,
      months: 0,
    };
    bucket.base += row.base_amount ?? 0;
    bucket.comparison += row.comparison_amount ?? 0;
    bucket.months += 1;
    if (!bucket.account_name) bucket.account_name = row.account_name;
    buckets.set(key, bucket);
  }

  const result: YtdTotalRow[] = [];
  for (const [key, bucket] of buckets) {
    const { variance_amount, variance_percent, isSignificant, direction } = calculateVariance(
      bucket.base,
      bucket.comparison,
      threshold,
    );
    result.push({
      key,
      account_code: bucket.account_code,
      account_name: bucket.account_name,
      department: bucket.department,
      base_amount: bucket.base,
      comparison_amount: bucket.comparison,
      variance_amount,
      variance_percent,
      isSignificant,
      direction,
      monthsPresent: bucket.months,
      fx: fxActive ? calculateFxDecomposition(bucket.base, bucket.comparison, fx.baseRate, fx.comparisonRate) : null,
    });
  }

  return result.sort((a, b) => a.account_code.localeCompare(b.account_code));
}
