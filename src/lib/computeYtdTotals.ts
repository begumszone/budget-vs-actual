import type { ThresholdSettings } from '../types';
import type { FxDecomposition } from '../types';
import { calculateVariance } from './calculateVariance';
import type { EnrichedVarianceRow } from './enrichRowsWithFx';

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
  /** How many of those months couldn't be converted (fx active, rate missing on either side). */
  monthsMissingRate: number;
  fx: FxDecomposition | null;
}

/**
 * Rolls variance rows up to one total per account (+ department), summing
 * across every month present. Sums the already-converted `display*` amounts
 * from each row -- never the raw local amount times a single rate -- since
 * with per-month rates, a correct multi-month total is the sum of each
 * month's own conversion, not one rate applied to a summed total.
 *
 * Rows are summed regardless of per-month match status, so an account that
 * only exists in one period (a new or discontinued line) still gets a
 * total -- with the missing side at 0 -- which surfaces it clearly rather
 * than letting it disappear into a long list of monthly unmatched rows.
 */
export function computeYtdTotals(rows: EnrichedVarianceRow[], threshold: ThresholdSettings): YtdTotalRow[] {
  const buckets = new Map<
    string,
    {
      account_code: string;
      account_name: string;
      department: string | null;
      base: number;
      comparison: number;
      months: number;
      monthsMissingRate: number;
      operational: number;
      fx: number;
      hasFx: boolean;
    }
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
      monthsMissingRate: 0,
      operational: 0,
      fx: 0,
      hasFx: false,
    };
    bucket.base += row.displayBase ?? 0;
    bucket.comparison += row.displayComparison ?? 0;
    bucket.months += 1;
    if (row.baseRateMissing || row.comparisonRateMissing) bucket.monthsMissingRate += 1;
    if (row.fx) {
      bucket.operational += row.fx.operationalVarianceTarget;
      bucket.fx += row.fx.fxVarianceTarget;
      bucket.hasFx = true;
    }
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
      monthsMissingRate: bucket.monthsMissingRate,
      fx: bucket.hasFx
        ? {
            totalVarianceTarget: bucket.operational + bucket.fx,
            operationalVarianceTarget: bucket.operational,
            fxVarianceTarget: bucket.fx,
          }
        : null,
    });
  }

  return result.sort((a, b) => a.account_code.localeCompare(b.account_code));
}
