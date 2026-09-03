import { useT } from '../lib/i18n';
import { useMemo, useState } from 'react';
import type { CurrencyCode, Locale } from '../types';
import type { YtdTotalRow } from '../lib/computeYtdTotals';
import { formatCurrency, formatPercent } from '../lib/formatters';
import type { ModeLabels } from '../lib/modeLabels';
import { NoRateCell } from './NoRateCell';

type SortKey = 'variance_percent' | 'variance_amount' | 'account_code';

interface Props {
  rows: YtdTotalRow[];
  locale: Locale;
  displayCurrency: CurrencyCode;
  fxActive: boolean;
  targetCurrency: CurrencyCode;
  labels: ModeLabels;
}

export function YtdTotalsTable({ rows, locale, displayCurrency, fxActive, targetCurrency, labels }: Props) {
  const t = useT();
  const [sortKey, setSortKey] = useState<SortKey>('variance_percent');

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      if (sortKey === 'variance_percent' || sortKey === 'variance_amount') {
        const av = a[sortKey] === null ? -Infinity : Math.abs(a[sortKey] as number);
        const bv = b[sortKey] === null ? -Infinity : Math.abs(b[sortKey] as number);
        return bv - av;
      }
      return a.account_code.localeCompare(b.account_code);
    });
    return copy;
  }, [rows, sortKey]);

  if (rows.length === 0) return null;

  return (
    <section className="variance-table-section">
      <div className="section-header">
        <h2>{t('table.ytdTitle', { base: labels.base, comparison: labels.comparison })}</h2>
        <label className="sort-select">
          {t('table.sortBy')}
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
            <option value="variance_percent">{t('sort.variancePct')}</option>
            <option value="variance_amount">{t('sort.varianceAmount')}</option>
            <option value="account_code">{t('sort.accountCode')}</option>
          </select>
        </label>
      </div>
      {fxActive && rows.some((r) => r.monthsMissingRate > 0) && (
        <p className="fx-panel__note">
          ⚠ Some accounts have months with no rate entered -- their totals only include the months that could be
          converted (see the ⚠ marker below).
        </p>
      )}
      <div className="table-scroll">
        <table className="variance-table">
          <thead>
            <tr>
              <th>{t('col.account')}</th>
              <th>{t('col.department')}</th>
              <th className="num">{labels.base}</th>
              <th className="num">{labels.comparison}</th>
              <th className="num">Variance</th>
              <th className="num">Variance %</th>
              {fxActive && (
                <>
                  <th className="num">Operational Var. ({targetCurrency})</th>
                  <th className="num">FX Var. ({targetCurrency})</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.key} className={row.isSignificant ? `row--significant row--${row.direction}` : undefined}>
                <td>
                  <div className="account-cell">
                    <span className="account-cell__code">
                      {row.account_code}
                      {fxActive && row.monthsMissingRate > 0 && (
                        <span title={`${row.monthsMissingRate} of ${row.monthsPresent} months have no rate entered`}>
                          {' '}
                          ⚠
                        </span>
                      )}
                    </span>
                    {row.account_name && <span className="account-cell__name">{row.account_name}</span>}
                  </div>
                </td>
                <td>{row.department ?? '—'}</td>
                <td className="num">{formatCurrency(row.base_amount, locale, displayCurrency)}</td>
                <td className="num">{formatCurrency(row.comparison_amount, locale, displayCurrency)}</td>
                <td className="num">{formatCurrency(row.variance_amount, locale, displayCurrency)}</td>
                <td className="num">{formatPercent(row.variance_percent, locale)}</td>
                {fxActive && (
                  <>
                    <td className="num">
                      <NoRateCell
                        value={row.fx?.operationalVarianceTarget ?? null}
                        missingRate={!row.fx}
                        locale={locale}
                        currency={targetCurrency}
                      />
                    </td>
                    <td className="num">
                      <NoRateCell
                        value={row.fx?.fxVarianceTarget ?? null}
                        missingRate={!row.fx}
                        locale={locale}
                        currency={targetCurrency}
                      />
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
