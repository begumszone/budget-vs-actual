import type { FxDecomposition, FxReportingSettings, VarianceRow } from '../types';
import { calculateFxDecomposition } from './calculateFxVariance';

export interface EnrichedVarianceRow extends VarianceRow {
  fx: FxDecomposition | null;
}

/**
 * Returns whether the FX split should actually be shown: the panel must be
 * enabled, targeting a currency different from the data currency (nothing
 * to decompose when they match), with both rates present.
 */
export function isFxActive(fx: FxReportingSettings, dataCurrency: string): boolean {
  return (
    fx.enabled &&
    fx.targetCurrency !== dataCurrency &&
    fx.baseRate !== null &&
    fx.comparisonRate !== null &&
    fx.baseRate > 0 &&
    fx.comparisonRate > 0
  );
}

export function enrichRowsWithFx(
  rows: VarianceRow[],
  fx: FxReportingSettings,
  dataCurrency: string,
): EnrichedVarianceRow[] {
  const active = isFxActive(fx, dataCurrency);
  return rows.map((row) => ({
    ...row,
    fx: active
      ? calculateFxDecomposition(row.base_amount, row.comparison_amount, fx.baseRate, fx.comparisonRate)
      : null,
  }));
}
