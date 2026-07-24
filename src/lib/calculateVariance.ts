import type { ThresholdSettings } from '../types';

export interface VarianceResult {
  variance_amount: number | null;
  variance_percent: number | null;
  isSignificant: boolean;
  direction: 'increase' | 'decrease' | null;
}

/**
 * Computes variance amount/percent and whether it crosses the significance
 * threshold. A base of null or 0 makes the percentage undefined ("N/A")
 * rather than an error, since division by zero has no meaningful ratio.
 */
export function calculateVariance(
  base: number | null,
  comparison: number | null,
  threshold: ThresholdSettings,
): VarianceResult {
  if (base === null || comparison === null) {
    return { variance_amount: null, variance_percent: null, isSignificant: false, direction: null };
  }

  const variance_amount = comparison - base;
  const variance_percent = base === 0 ? null : (variance_amount / Math.abs(base)) * 100;

  const direction: 'increase' | 'decrease' | null =
    variance_amount > 0 ? 'increase' : variance_amount < 0 ? 'decrease' : null;

  const badDirection = threshold.increaseIsBad ? 'increase' : 'decrease';
  const isSignificant =
    variance_percent !== null &&
    Math.abs(variance_percent) >= threshold.percent &&
    direction === badDirection;

  return { variance_amount, variance_percent, isSignificant, direction };
}
