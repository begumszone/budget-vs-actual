import type { AnalysisMode, Locale } from '../types';

const LOCALE_TAGS: Record<Locale, string> = {
  en: 'en-US',
  tr: 'tr-TR',
};

/**
 * Returns a function that formats a VarianceRow's `month` field for display.
 * Budget-vs-actual stores full "YYYY-MM" and is shown as-is. Year-over-year
 * stores just the month-of-year ("01".."12") since matching is done across
 * years on the same month, so it's rendered as a short month name instead.
 */
export function makeMonthFormatter(mode: AnalysisMode, locale: Locale): (month: string) => string {
  if (mode !== 'yoy') {
    return (month: string) => month;
  }
  const formatter = new Intl.DateTimeFormat(LOCALE_TAGS[locale], { month: 'short', timeZone: 'UTC' });
  return (month: string) => {
    const monthNum = Number(month);
    if (!Number.isFinite(monthNum) || monthNum < 1 || monthNum > 12) return month;
    return formatter.format(new Date(Date.UTC(2000, monthNum - 1, 1)));
  };
}
