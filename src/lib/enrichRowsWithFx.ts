import type {
  AnalysisMode,
  CurrencyCode,
  FxDecomposition,
  FxReportingSettings,
  ThresholdSettings,
  VarianceRow,
  YearSelection,
} from '../types';
import { calculateFxDecomposition } from './calculateFxVariance';
import { calculateVariance } from './calculateVariance';
import { getRatesForRow } from './monthlyRates';
import { getEffectiveMultiplier } from './fxQuote';

export interface EnrichedVarianceRow extends VarianceRow {
  fx: FxDecomposition | null;
  /** True when this row has a base amount but no usable rate for its month -- flagged, never assumed 1.0. */
  baseRateMissing: boolean;
  comparisonRateMissing: boolean;
  /**
   * The amount to actually display, in whichever currency is currently
   * active. When FX reporting is off this is just the original local
   * amount; when it's on, it's the amount converted at that row's own
   * month's rate, or null if that rate hasn't been entered yet. Every
   * display component reads these fields instead of base_amount/
   * comparison_amount directly, so the screen is never showing two
   * currencies at once.
   */
  displayBase: number | null;
  displayComparison: number | null;
  displayVariance: number | null;
  displayVariancePercent: number | null;
  displayIsSignificant: boolean;
  displayDirection: 'increase' | 'decrease' | null;
}

/**
 * Whether the FX split should be shown at all: the panel must be enabled
 * and targeting a currency different from the data currency (nothing to
 * decompose when they match). Per-row rate coverage is handled separately
 * -- a missing rate for one month doesn't disable the feature, it flags
 * just that row.
 */
export function isFxActive(fx: FxReportingSettings, dataCurrency: string): boolean {
  return fx.enabled && fx.targetCurrency !== dataCurrency;
}

export function enrichRowsWithFx(
  rows: VarianceRow[],
  fx: FxReportingSettings,
  dataCurrency: CurrencyCode,
  mode: AnalysisMode,
  years: YearSelection,
  threshold: ThresholdSettings,
): EnrichedVarianceRow[] {
  const active = isFxActive(fx, dataCurrency);

  return rows.map((row): EnrichedVarianceRow => {
    if (!active) {
      return {
        ...row,
        fx: null,
        baseRateMissing: false,
        comparisonRateMissing: false,
        displayBase: row.base_amount,
        displayComparison: row.comparison_amount,
        displayVariance: row.variance_amount,
        displayVariancePercent: row.variance_percent,
        displayIsSignificant: row.isSignificant,
        displayDirection: row.direction,
      };
    }

    const { baseRate, comparisonRate } = getRatesForRow(row, mode, years, fx.rates);
    const baseRateMissing = row.base_amount !== null && !(baseRate !== null && baseRate > 0);
    const comparisonRateMissing = row.comparison_amount !== null && !(comparisonRate !== null && comparisonRate > 0);

    // Rates are entered against the pair's quote convention (see fxQuote.ts),
    // not necessarily as a direct target-per-data multiplier -- convert to an
    // effective multiplier before doing any arithmetic with them.
    const baseMultiplier =
      baseRate !== null && baseRate > 0 ? getEffectiveMultiplier(baseRate, dataCurrency, fx.targetCurrency) : null;
    const comparisonMultiplier =
      comparisonRate !== null && comparisonRate > 0
        ? getEffectiveMultiplier(comparisonRate, dataCurrency, fx.targetCurrency)
        : null;

    const displayBase =
      !baseRateMissing && row.base_amount !== null ? row.base_amount * (baseMultiplier as number) : null;
    const displayComparison =
      !comparisonRateMissing && row.comparison_amount !== null
        ? row.comparison_amount * (comparisonMultiplier as number)
        : null;

    const fxDecomposition = calculateFxDecomposition(
      row.base_amount,
      row.comparison_amount,
      baseMultiplier,
      comparisonMultiplier,
    );

    let displayVariance: number | null = null;
    let displayVariancePercent: number | null = null;
    let displayIsSignificant = false;
    let displayDirection: 'increase' | 'decrease' | null = null;
    if (displayBase !== null && displayComparison !== null) {
      const result = calculateVariance(displayBase, displayComparison, threshold);
      displayVariance = result.variance_amount;
      displayVariancePercent = result.variance_percent;
      displayIsSignificant = result.isSignificant;
      displayDirection = result.direction;
    }

    return {
      ...row,
      fx: fxDecomposition,
      baseRateMissing,
      comparisonRateMissing,
      displayBase,
      displayComparison,
      displayVariance,
      displayVariancePercent,
      displayIsSignificant,
      displayDirection,
    };
  });
}
