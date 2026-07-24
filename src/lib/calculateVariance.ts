import type { ThresholdSettings } from '../types';

export interface VarianceResult {
  variance_amount: number | null;
  variance_percent: number | null;
  isSignificant: boolean;
  direction: 'over' | 'under' | null;
}

/**
 * Computes variance amount/percent and whether it crosses the significance
 * threshold. Budget of null or 0 makes the percentage undefined ("N/A")
 * rather than an error, since division by zero has no meaningful ratio.
 */
export function calculateVariance(
  budget: number | null,
  actual: number | null,
  threshold: ThresholdSettings,
): VarianceResult {
  if (budget === null || actual === null) {
    return { variance_amount: null, variance_percent: null, isSignificant: false, direction: null };
  }

  const variance_amount = actual - budget;
  const variance_percent = budget === 0 ? null : (variance_amount / Math.abs(budget)) * 100;

  const direction: 'over' | 'under' | null =
    variance_amount > 0 ? 'over' : variance_amount < 0 ? 'under' : null;

  const badDirection = threshold.overIsBad ? 'over' : 'under';
  const isSignificant =
    variance_percent !== null &&
    Math.abs(variance_percent) >= threshold.percent &&
    direction === badDirection;

  return { variance_amount, variance_percent, isSignificant, direction };
}
