import { useMemo, useState } from 'react';
import { useLocale, useT } from '../lib/i18n';
import type { CurrencyCode, Locale } from '../types';
import type { EnrichedVarianceRow } from '../lib/enrichRowsWithFx';
import type { ModeLabels } from '../lib/modeLabels';
import { NoRateCell } from './NoRateCell';

interface Props {
  rows: EnrichedVarianceRow[];
  locale: Locale;
  displayCurrency: CurrencyCode;
  labels: ModeLabels;
  formatMonth: (month: string) => string;
}

export function UnmatchedRows({ rows, locale, displayCurrency, labels, formatMonth }: Props) {
  const t = useT();
  // Turkish lowercases I as ı; use the locale's own casing rules.
  const localeTag = useLocale() === 'tr' ? 'tr-TR' : 'en-US';
  const [open, setOpen] = useState(false);

  const unmatched = useMemo(
    () => rows.filter((r) => r.status !== 'matched'),
    [rows],
  );

  if (unmatched.length === 0) return null;

  const baseOnly = unmatched.filter((r) => r.status === 'base-only');
  const comparisonOnly = unmatched.filter((r) => r.status === 'comparison-only');

  return (
    <section className="unmatched-section">
      <button className="unmatched-toggle" onClick={() => setOpen((o) => !o)}>
        {open ? '▾' : '▸'}{' '}
        {t('unmatched.toggle', {
          n: unmatched.length,
          baseCount: baseOnly.length,
          baseLabel: labels.baseOnlyLabel.toLocaleLowerCase(localeTag),
          compCount: comparisonOnly.length,
          compLabel: labels.comparisonOnlyLabel.toLocaleLowerCase(localeTag),
        })}
      </button>
      {open && (
        <div className="table-scroll">
          <table className="variance-table">
            <thead>
              <tr>
                <th>{t('col.account')}</th>
                <th>{t('col.department')}</th>
                <th>{t('col.month')}</th>
                <th className="num">{labels.base}</th>
                <th className="num">{labels.comparison}</th>
                <th>{t('unmatched.presentIn')}</th>
              </tr>
            </thead>
            <tbody>
              {unmatched.map((row) => (
                <tr key={row.key}>
                  <td>
                    <div className="account-cell">
                      <span className="account-cell__code">{row.account_code}</span>
                      {row.account_name && <span className="account-cell__name">{row.account_name}</span>}
                    </div>
                  </td>
                  <td>{row.department ?? '—'}</td>
                  <td>{formatMonth(row.month)}</td>
                  <td className="num">
                    <NoRateCell value={row.displayBase} missingRate={row.baseRateMissing} locale={locale} currency={displayCurrency} />
                  </td>
                  <td className="num">
                    <NoRateCell
                      value={row.displayComparison}
                      missingRate={row.comparisonRateMissing}
                      locale={locale}
                      currency={displayCurrency}
                    />
                  </td>
                  <td>{row.status === 'base-only' ? labels.baseOnlyLabel : labels.comparisonOnlyLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
