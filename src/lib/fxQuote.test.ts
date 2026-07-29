import { describe, expect, test } from 'vitest';
import { convertWithQuote, formatQuoteLabel, getEffectiveMultiplier, getQuoteConvention } from './fxQuote';

describe('getQuoteConvention', () => {
  test('is symmetric -- same pair gives the same anchor regardless of argument order', () => {
    expect(getQuoteConvention('TRY', 'USD')).toEqual({ anchor: 'USD', quoted: 'TRY' });
    expect(getQuoteConvention('USD', 'TRY')).toEqual({ anchor: 'USD', quoted: 'TRY' });
  });

  test('EUR outranks GBP, GBP outranks USD, USD outranks TRY', () => {
    expect(getQuoteConvention('EUR', 'GBP').anchor).toBe('EUR');
    expect(getQuoteConvention('GBP', 'EUR').anchor).toBe('EUR');
    expect(getQuoteConvention('GBP', 'USD').anchor).toBe('GBP');
    expect(getQuoteConvention('USD', 'TRY').anchor).toBe('USD');
    expect(getQuoteConvention('EUR', 'TRY').anchor).toBe('EUR');
  });
});

describe('formatQuoteLabel', () => {
  test('matches the real-world quote convention regardless of data/target role', () => {
    expect(formatQuoteLabel('TRY', 'USD')).toBe('1 USD = ? TRY');
    expect(formatQuoteLabel('USD', 'TRY')).toBe('1 USD = ? TRY');
  });
});

describe('convertWithQuote -- the reported bug scenario', () => {
  // Real-world quote: 1 USD = 42 TRY.
  const RATE = 42;

  test('data TRY, target USD: divides, since the entered rate is data-per-1-target', () => {
    // ~2,095,000 TRY at 1 USD = 42 TRY should be ~49,880.95 USD, not $87,980,000.
    const converted = convertWithQuote(2_095_000, RATE, 'TRY', 'USD');
    expect(converted).toBeCloseTo(2_095_000 / 42, 6);
    expect(converted).toBeCloseTo(49880.952381, 4);
  });

  test('data USD, target TRY: multiplies, since the entered rate is already target-per-1-data', () => {
    const converted = convertWithQuote(100, RATE, 'USD', 'TRY');
    expect(converted).toBe(4200);
  });

  test('both directions are reciprocal for the same rate value', () => {
    const usdAmount = 1000;
    const tryAmount = convertWithQuote(usdAmount, RATE, 'USD', 'TRY');
    const roundTripUsd = convertWithQuote(tryAmount, RATE, 'TRY', 'USD');
    expect(roundTripUsd).toBeCloseTo(usdAmount, 9);
  });
});

describe('convertWithQuote -- other currency pairs', () => {
  test('EUR/GBP: data EUR multiplies (EUR is the anchor)', () => {
    // 1 EUR = 0.86 GBP
    expect(convertWithQuote(100, 0.86, 'EUR', 'GBP')).toBeCloseTo(86, 9);
  });

  test('EUR/GBP: data GBP divides (GBP is the quoted side)', () => {
    expect(convertWithQuote(86, 0.86, 'GBP', 'EUR')).toBeCloseTo(100, 9);
  });

  test('round trip holds for every supported pair with an arbitrary rate', () => {
    const pairs: Array<['TRY' | 'USD' | 'EUR' | 'GBP', 'TRY' | 'USD' | 'EUR' | 'GBP']> = [
      ['TRY', 'USD'],
      ['USD', 'EUR'],
      ['GBP', 'USD'],
      ['EUR', 'TRY'],
      ['GBP', 'TRY'],
    ];
    for (const [data, target] of pairs) {
      const rate = 17.3456;
      const amount = 123456.789;
      const converted = convertWithQuote(amount, rate, data, target);
      const roundTrip = convertWithQuote(converted, rate, target, data);
      expect(roundTrip).toBeCloseTo(amount, 6);
    }
  });
});

describe('getEffectiveMultiplier', () => {
  test('multiplier for the two directions of the same pair/rate are reciprocals of each other', () => {
    const m1 = getEffectiveMultiplier(42, 'USD', 'TRY');
    const m2 = getEffectiveMultiplier(42, 'TRY', 'USD');
    expect(m1 * m2).toBeCloseTo(1, 9);
    expect(m1).toBe(42);
    expect(m2).toBeCloseTo(1 / 42, 9);
  });
});
