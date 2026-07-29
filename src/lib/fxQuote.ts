import type { CurrencyCode } from '../types';

/**
 * Which currency conventionally anchors an FX quote as "1 unit" against a
 * weaker one, matching how these pairs actually trade (EUR/USD, GBP/USD,
 * and USD/TRY are always quoted "1 [stronger] = X [weaker]", never the
 * other way round). This is what makes the quote label the same for a
 * given currency PAIR no matter which one happens to be the data currency
 * and which is the target -- the anchor depends only on the pair, not on
 * that role.
 */
const CURRENCY_PRIORITY: CurrencyCode[] = ['EUR', 'GBP', 'USD', 'TRY'];

export interface QuoteConvention {
  /** The currency that is "1 unit" in the quote, e.g. "USD" in "1 USD = 34 TRY". */
  anchor: CurrencyCode;
  /** The currency being priced per unit of the anchor. */
  quoted: CurrencyCode;
}

/** Same result regardless of argument order -- the pair determines the convention, not which one is "first". */
export function getQuoteConvention(currencyA: CurrencyCode, currencyB: CurrencyCode): QuoteConvention {
  const rankA = CURRENCY_PRIORITY.indexOf(currencyA);
  const rankB = CURRENCY_PRIORITY.indexOf(currencyB);
  return rankA <= rankB ? { anchor: currencyA, quoted: currencyB } : { anchor: currencyB, quoted: currencyA };
}

/** e.g. "1 USD = ? TRY" for the pair (TRY, USD) or (USD, TRY) -- same label either way. */
export function formatQuoteLabel(currencyA: CurrencyCode, currencyB: CurrencyCode): string {
  const { anchor, quoted } = getQuoteConvention(currencyA, currencyB);
  return `1 ${anchor} = ? ${quoted}`;
}

/**
 * Turns a rate value entered against the pair's quote convention into the
 * multiplier that actually converts a `dataCurrency` amount into
 * `targetCurrency` amounts (i.e. `converted = localAmount * multiplier`).
 *
 * If the data currency is the quote's anchor, the entered rate already
 * *is* target-per-1-data, so it's used as-is (multiply). If the target
 * currency is the anchor, the entered rate is data-per-1-target, so
 * converting requires dividing instead -- e.g. rate 42 meaning
 * "1 USD = 42 TRY": data=USD -> multiply by 42 to get TRY; data=TRY ->
 * divide by 42 to get USD. Both directions use the identical entered
 * value, which is what makes them reciprocal.
 */
export function getEffectiveMultiplier(
  rateValue: number,
  dataCurrency: CurrencyCode,
  targetCurrency: CurrencyCode,
): number {
  const { anchor } = getQuoteConvention(dataCurrency, targetCurrency);
  return anchor === dataCurrency ? rateValue : 1 / rateValue;
}

/** Converts a local (data-currency) amount into the target currency using a rate entered against the pair's quote convention. */
export function convertWithQuote(
  localAmount: number,
  rateValue: number,
  dataCurrency: CurrencyCode,
  targetCurrency: CurrencyCode,
): number {
  return localAmount * getEffectiveMultiplier(rateValue, dataCurrency, targetCurrency);
}
