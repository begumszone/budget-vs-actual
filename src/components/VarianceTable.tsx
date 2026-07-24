import { useMemo, useState } from 'react';
import type { CurrencyCode, Locale } from '../types';
import type { EnrichedVarianceRow } from '../lib/enrichRowsWithFx';
import { formatCurrency, formatPercent } from '../lib/formatters';

type SortKey = 'variance_percent' | 'variance_amount' | 'account_code' | 'month';

interface Props {
  rows: EnrichedVarianceRow[];
  locale: Locale;
  dataCurrency: CurrencyCode;
  fxActive: boolean;
  targetCurrency: CurrencyCode;
}

export function VarianceTable({ rows, locale, dataCurrency, fxActive, targetCurrency }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('variance_percent');

  const matchedRows = useMemo(() => rows.filter((r) => r.status === 'matched'), [rows]);

  const sorted = useMemo(() => {
    const copy = [...matchedRows];
    copy.sort((a, b) => {
      if (sortKey === 'variance_percent' || sortKey === 'variance_amount') {
        const av = a[sortKey] === null ? -Infinity : Math.abs(a[sortKey] as number);
        const bv = b[sortKey] === null ? -Infinity : Math.abs(b[sortKey] as number);
        return bv - av;
      }
      return String(a[sortKey]).localeCompare(String(b[sortKey]));
    });
    return copy;
  }, [matchedRows, sortKey]);

  const columnCount = fxActive ? 9 : 7;

  return (
    <section className="variance-table-section">
      <div className="section-header">
        <h2>Variance detail</h2>
        <label className="sort-select">
          Sort by
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
            <option value="variance_percent">Biggest variance (%)</option>
            <option value="variance_amount">Biggest variance (amount)</option>
            <option value="account_code">Account code</option>
            <option value="month">Month</option>
          </select>
        </label>
      </div>
      <div className="table-scroll">
        <table className="variance-table">
          <thead>
            <tr>
              <th>Account</th>
              <th>Department</th>
              <th>Month</th>
              <th className="num">Budget</th>
              <th className="num">Actual</th>
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
              <tr
                key={row.key}
                className={
                  row.isSignificant ? `row--significant row--${row.direction}` : undefined
                }
              >
                <td>
                  <div className="account-cell">
                    <span className="account-cell__code">{row.account_code}</span>
                    {row.account_name && <span className="account-cell__name">{row.account_name}</span>}
                  </div>
                </td>
                <td>{row.department ?? '—'}</td>
                <td>{row.month}</td>
                <td className="num">{formatCurrency(row.budget_amount, locale, dataCurrency)}</td>
                <td className="num">{formatCurrency(row.actual_amount, locale, dataCurrency)}</td>
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
            {sorted.length === 0 && (
              <tr>
                <td colSpan={columnCount} className="empty-row">
                  No matched budget/actual rows to display.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
