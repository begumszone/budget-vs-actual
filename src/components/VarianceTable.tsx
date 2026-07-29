import { useMemo, useState } from 'react';
import type { CurrencyCode, Locale } from '../types';
import type { EnrichedVarianceRow } from '../lib/enrichRowsWithFx';
import { formatPercent } from '../lib/formatters';
import type { ModeLabels } from '../lib/modeLabels';
import { NoRateCell } from './NoRateCell';

type SortKey = 'displayVariancePercent' | 'displayVariance' | 'account_code' | 'month';

interface Props {
  rows: EnrichedVarianceRow[];
  locale: Locale;
  displayCurrency: CurrencyCode;
  fxActive: boolean;
  targetCurrency: CurrencyCode;
  labels: ModeLabels;
  formatMonth: (month: string) => string;
}

export function VarianceTable({ rows, locale, displayCurrency, fxActive, targetCurrency, labels, formatMonth }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('displayVariancePercent');

  const matchedRows = useMemo(() => rows.filter((r) => r.status === 'matched'), [rows]);

  const sorted = useMemo(() => {
    const copy = [...matchedRows];
    copy.sort((a, b) => {
      if (sortKey === 'displayVariancePercent' || sortKey === 'displayVariance') {
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
            <option value="displayVariancePercent">Biggest variance (%)</option>
            <option value="displayVariance">Biggest variance (amount)</option>
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
              <tr
                key={row.key}
                className={
                  row.displayIsSignificant ? `row--significant row--${row.displayDirection}` : undefined
                }
              >
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
                <td className="num">
                  <NoRateCell
                    value={row.displayVariance}
                    missingRate={row.baseRateMissing || row.comparisonRateMissing}
                    locale={locale}
                    currency={displayCurrency}
                  />
                </td>
                <td className="num">
                  {row.baseRateMissing || row.comparisonRateMissing ? (
                    <span className="no-rate-flag">No rate</span>
                  ) : (
                    formatPercent(row.displayVariancePercent, locale)
                  )}
                </td>
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
            {sorted.length === 0 && (
              <tr>
                <td colSpan={columnCount} className="empty-row">
                  No matched {labels.base.toLowerCase()}/{labels.comparison.toLowerCase()} rows to display.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
