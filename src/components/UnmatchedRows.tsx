import { useMemo, useState } from 'react';
import type { Locale, VarianceRow } from '../types';
import { formatCurrency } from '../lib/formatters';

interface Props {
  rows: VarianceRow[];
  locale: Locale;
}

export function UnmatchedRows({ rows, locale }: Props) {
  const [open, setOpen] = useState(false);

  const unmatched = useMemo(
    () => rows.filter((r) => r.status !== 'matched'),
    [rows],
  );

  if (unmatched.length === 0) return null;

  const budgetOnly = unmatched.filter((r) => r.status === 'budget-only');
  const actualOnly = unmatched.filter((r) => r.status === 'actual-only');

  return (
    <section className="unmatched-section">
      <button className="unmatched-toggle" onClick={() => setOpen((o) => !o)}>
        {open ? '▾' : '▸'} {unmatched.length} unmatched row{unmatched.length === 1 ? '' : 's'} found
        ({budgetOnly.length} in budget only, {actualOnly.length} in actual only)
      </button>
      {open && (
        <div className="table-scroll">
          <table className="variance-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Department</th>
                <th>Month</th>
                <th className="num">Budget</th>
                <th className="num">Actual</th>
                <th>Present in</th>
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
                  <td>{row.month}</td>
                  <td className="num">{formatCurrency(row.budget_amount, locale)}</td>
                  <td className="num">{formatCurrency(row.actual_amount, locale)}</td>
                  <td>{row.status === 'budget-only' ? 'Budget only' : 'Actual only'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
