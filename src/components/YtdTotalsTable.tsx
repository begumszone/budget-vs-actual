import { useMemo, useState } from 'react';
import type { CurrencyCode, Locale } from '../types';
import type { YtdTotalRow } from '../lib/computeYtdTotals';
import { formatCurrency, formatPercent } from '../lib/formatters';
import type { ModeLabels } from '../lib/modeLabels';

type SortKey = 'variance_percent' | 'variance_amount' | 'account_code';

interface Props {
  rows: YtdTotalRow[];
  locale: Locale;
  dataCurrency: CurrencyCode;
  fxActive: boolean;
  targetCurrency: CurrencyCode;
  labels: ModeLabels;
}

export function YtdTotalsTable({ rows, locale, dataCurrency, fxActive, targetCurrency, labels }: Props) {
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
        <h2>Total by account ({labels.base} vs {labels.comparison}, all months)</h2>
        <label className="sort-select">
          Sort by
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
            <option value="variance_percent">Biggest variance (%)</option>
            <option value="variance_amount">Biggest variance (amount)</option>
            <option value="account_code">Account code</option>
          </select>
        </label>
      </div>
      <div className="table-scroll">
        <table className="variance-table">
          <thead>
            <tr>
              <th>Account</th>
              <th>Department</th>
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
                    <span className="account-cell__code">{row.account_code}</span>
                    {row.account_name && <span className="account-cell__name">{row.account_name}</span>}
                  </div>
                </td>
                <td>{row.department ?? '—'}</td>
                <td className="num">{formatCurrency(row.base_amount, locale, dataCurrency)}</td>
                <td className="num">{formatCurrency(row.comparison_amount, locale, dataCurrency)}</td>
                <td className="num">{formatCurrency(row.variance_amount, locale, dataCurrency)}</td>
                <td className="num">{formatPercent(row.variance_percent, locale)}</td>
                {fxActive && (
                  <>
                    <td className="num">
                      {row.fx ? formatCurrency(row.fx.operationalVarianceTarget, locale, targetCurrency) : 'N/A'}
                    </td>
                    <td className="num">
                      {row.fx ? formatCurrency(row.fx.fxVarianceTarget, locale, targetCurrency) : 'N/A'}
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
