import { useT } from '../lib/i18n';
import type { CurrencyCode, Locale } from '../types';
import { formatCurrency } from '../lib/formatters';

interface Props {
  value: number | null;
  missingRate: boolean;
  locale: Locale;
  currency: CurrencyCode;
}

/** Renders a currency amount, or a visually flagged "No rate" when the month's rate hasn't been entered. */
export function NoRateCell({ value, missingRate, locale, currency }: Props) {
  const t = useT();
  if (missingRate) {
    return (
      <span className="no-rate-flag" title={t('fx.noRateTitle')}>
        {t('fx.noRate')}
      </span>
    );
  }
  return <>{formatCurrency(value, locale, currency)}</>;
}
