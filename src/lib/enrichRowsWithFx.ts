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
    fx.budgetRate !== null &&
    fx.actualRate !== null &&
    fx.budgetRate > 0 &&
    fx.actualRate > 0
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
    fx: active ? calculateFxDecomposition(row.budget_amount, row.actual_amount, fx.budgetRate, fx.actualRate) : null,
  }));
}
