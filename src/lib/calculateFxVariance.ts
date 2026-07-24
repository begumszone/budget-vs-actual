import type { FxDecomposition } from '../types';

export class FxReconciliationError extends Error {}

/**
 * Splits the total variance (in the target reporting currency) into an
 * operational component (the budget-vs-actual difference, valued at the
 * budget/plan rate) and an FX component (the effect of the rate moving,
 * valued on actual volume -- i.e. actual_local is held constant and only
 * the rate varies). By construction operational + fx === total; a
 * reconciliation check runs on every call so a formula regression would
 * fail loudly rather than silently producing a table that doesn't add up.
 *
 * Returns null when the inputs can't be converted: a missing budget or
 * actual amount (unmatched row), or a missing/non-positive rate (an FX
 * rate of zero or less is never a legitimate rate, so it's treated the
 * same as "not entered yet").
 */
export function calculateFxDecomposition(
  budgetLocal: number | null,
  actualLocal: number | null,
  budgetRate: number | null,
  actualRate: number | null,
): FxDecomposition | null {
  if (budgetLocal === null || actualLocal === null) return null;
  if (
    budgetRate === null ||
    actualRate === null ||
    !Number.isFinite(budgetRate) ||
    !Number.isFinite(actualRate) ||
    budgetRate <= 0 ||
    actualRate <= 0
  ) {
    return null;
  }

  const totalVarianceTarget = actualLocal * actualRate - budgetLocal * budgetRate;
  const operationalVarianceTarget = (actualLocal - budgetLocal) * budgetRate;
  const fxVarianceTarget = actualLocal * (actualRate - budgetRate);

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
