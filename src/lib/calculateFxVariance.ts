import type { FxDecomposition } from '../types';

export class FxReconciliationError extends Error {}

/**
 * Splits the total variance (in the target reporting currency) into an
 * operational component (the base-vs-comparison difference, valued at the
 * base period's rate) and an FX component (the effect of the rate moving,
 * valued on comparison volume -- i.e. comparison_local is held constant and
 * only the rate varies). By construction operational + fx === total; a
 * reconciliation check runs on every call so a formula regression would fail
 * loudly rather than silently producing a table that doesn't add up.
 *
 * Returns null when the inputs can't be converted: a missing base or
 * comparison amount (unmatched row), or a missing/non-positive rate (an FX
 * rate of zero or less is never a legitimate rate, so it's treated the same
 * as "not entered yet").
 */
export function calculateFxDecomposition(
  baseLocal: number | null,
  comparisonLocal: number | null,
  baseRate: number | null,
  comparisonRate: number | null,
): FxDecomposition | null {
  if (baseLocal === null || comparisonLocal === null) return null;
  if (
    baseRate === null ||
    comparisonRate === null ||
    !Number.isFinite(baseRate) ||
    !Number.isFinite(comparisonRate) ||
    baseRate <= 0 ||
    comparisonRate <= 0
  ) {
    return null;
  }

  const totalVarianceTarget = comparisonLocal * comparisonRate - baseLocal * baseRate;
  const operationalVarianceTarget = (comparisonLocal - baseLocal) * baseRate;
  const fxVarianceTarget = comparisonLocal * (comparisonRate - baseRate);

  const reconciled = operationalVarianceTarget + fxVarianceTarget;
  const epsilon = 1e-6 * Math.max(1, Math.abs(totalVarianceTarget));
  if (Math.abs(reconciled - totalVarianceTarget) > epsilon) {
    throw new FxReconciliationError(
      `FX decomposition does not reconcile: operational (${operationalVarianceTarget}) + fx (${fxVarianceTarget}) = ` +
        `${reconciled}, expected total (${totalVarianceTarget})`,
    );
  }

  return { totalVarianceTarget, operationalVarianceTarget, fxVarianceTarget };
}
