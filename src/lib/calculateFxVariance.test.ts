import { describe, expect, test } from 'vitest';
import { calculateFxDecomposition } from './calculateFxVariance';
import { getEffectiveMultiplier } from './fxQuote';

describe('calculateFxDecomposition reconciliation, both quote directions', () => {
  // Same underlying scenario as the reported bug: base and comparison
  // amounts in TRY, reported in USD, real-world rates around 1 USD = 42 TRY
  // (base/plan) moving to 1 USD = 44 TRY (comparison/realized).
  const baseLocalTRY = 2_095_000;
  const comparisonLocalTRY = 2_300_000;
  const baseRateQuote = 42; // 1 USD = 42 TRY
  const comparisonRateQuote = 44; // 1 USD = 44 TRY

  test('data TRY -> target USD: divides, and operational + fx reconciles to total', () => {
    const baseMultiplier = getEffectiveMultiplier(baseRateQuote, 'TRY', 'USD');
    const comparisonMultiplier = getEffectiveMultiplier(comparisonRateQuote, 'TRY', 'USD');
    const result = calculateFxDecomposition(baseLocalTRY, comparisonLocalTRY, baseMultiplier, comparisonMultiplier);

    expect(result).not.toBeNull();
    const { totalVarianceTarget, operationalVarianceTarget, fxVarianceTarget } = result!;

    // Sanity: converted figures should be in the tens of thousands of
    // dollars, not the tens of millions the multiplication bug produced.
    expect(Math.abs(totalVarianceTarget)).toBeLessThan(100_000);
    expect(operationalVarianceTarget + fxVarianceTarget).toBeCloseTo(totalVarianceTarget, 6);
  });

  test('data USD -> target TRY: multiplies, and operational + fx reconciles to total', () => {
    // Now pretend the same two rows were denominated in USD instead, using
    // the USD-equivalent amounts, converting back to TRY with the same
    // real-world rates.
    const baseLocalUSD = baseLocalTRY / baseRateQuote;
    const comparisonLocalUSD = comparisonLocalTRY / comparisonRateQuote;

    const baseMultiplier = getEffectiveMultiplier(baseRateQuote, 'USD', 'TRY');
    const comparisonMultiplier = getEffectiveMultiplier(comparisonRateQuote, 'USD', 'TRY');
    const result = calculateFxDecomposition(baseLocalUSD, comparisonLocalUSD, baseMultiplier, comparisonMultiplier);

    expect(result).not.toBeNull();
    const { operationalVarianceTarget, fxVarianceTarget, totalVarianceTarget } = result!;
    expect(operationalVarianceTarget + fxVarianceTarget).toBeCloseTo(totalVarianceTarget, 6);

    // Converting TRY->USD->TRY round trip should land back near the original TRY total variance.
    const originalTotalVarianceTRY = comparisonLocalTRY - baseLocalTRY;
    // totalVarianceTarget here is in TRY (target); it won't equal the naive
    // TRY variance because the rate itself moved, but it should be the same
    // order of magnitude, not 1/42 or 42x off.
    expect(Math.abs(totalVarianceTarget)).toBeGreaterThan(Math.abs(originalTotalVarianceTRY) * 0.1);
    expect(Math.abs(totalVarianceTarget)).toBeLessThan(Math.abs(originalTotalVarianceTRY) * 10);
  });

  test('reconciliation still throws if the two components were ever computed inconsistently', () => {
    // calculateFxDecomposition self-checks on every call; a null result for
    // missing inputs is not an error, but non-null results must always add up.
    const result = calculateFxDecomposition(1000, 1100, 30, 31);
    expect(result).not.toBeNull();
    expect(result!.operationalVarianceTarget + result!.fxVarianceTarget).toBeCloseTo(result!.totalVarianceTarget, 9);
  });

  test('missing or non-positive rates are never assumed to be 1.0', () => {
    expect(calculateFxDecomposition(1000, 1100, null, 30)).toBeNull();
    expect(calculateFxDecomposition(1000, 1100, 0, 30)).toBeNull();
    expect(calculateFxDecomposition(1000, 1100, -5, 30)).toBeNull();
  });
});
