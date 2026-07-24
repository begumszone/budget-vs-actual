import type { Locale } from '../types';

const LOCALE_TAGS: Record<Locale, string> = {
  en: 'en-US',
  tr: 'tr-TR',
};

const CURRENCY: Record<Locale, string> = {
  en: 'USD',
  tr: 'TRY',
};

export function formatCurrency(value: number | null, locale: Locale): string {
  if (value === null || Number.isNaN(value)) return 'N/A';
  return new Intl.NumberFormat(LOCALE_TAGS[locale], {
    style: 'currency',
    currency: CURRENCY[locale],
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
