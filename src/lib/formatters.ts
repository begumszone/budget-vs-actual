import type { CurrencyCode, Locale } from '../types';

const LOCALE_TAGS: Record<Locale, string> = {
  en: 'en-US',
  tr: 'tr-TR',
};

/**
 * Formats a currency amount. `locale` controls only number formatting
 * conventions (1,234.56 vs 1.234,56) -- it must never change which currency
 * the amount is displayed in. `currency` is the actual currency the amount
 * represents and is always explicit.
 */
export function formatCurrency(value: number | null, locale: Locale, currency: CurrencyCode): string {
  if (value === null || Number.isNaN(value)) return 'N/A';
  return new Intl.NumberFormat(LOCALE_TAGS[locale], {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number | null, locale: Locale): string {
  if (value === null || Number.isNaN(value)) return 'N/A';
  return new Intl.NumberFormat(LOCALE_TAGS[locale], {
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number | null, locale: Locale): string {
  if (value === null || Number.isNaN(value) || !Number.isFinite(value)) return 'N/A';
  return new Intl.NumberFormat(LOCALE_TAGS[locale], {
    style: 'percent',
    maximumFractionDigits: 1,
    signDisplay: 'exceptZero',
  }).format(value / 100);
}

/**
 * Formats a currency amount that may be blocked by a missing FX rate for
 * its month. Distinct from `formatCurrency`'s "N/A" (which means "no data
 * for this row") -- "No rate" specifically means the amount exists but
 * can't be converted yet, so it must never be silently shown as 0 or in
 * the wrong currency.
 */
export function formatConvertedAmount(
  value: number | null,
  missingRate: boolean,
  locale: Locale,
  currency: CurrencyCode,
): string {
  if (missingRate) return 'No rate';
  return formatCurrency(value, locale, currency);
}

/** Formats a bare exchange rate (not a currency amount) with locale-aware decimals. */
export function formatRate(value: number | null, locale: Locale): string {
  if (value === null || Number.isNaN(value) || !Number.isFinite(value)) return 'N/A';
  return new Intl.NumberFormat(LOCALE_TAGS[locale], {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(value);
}
