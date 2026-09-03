import { useT } from '../lib/i18n';
import { useState } from 'react';
import type { CurrencyCode, Locale } from '../types';
import type { ExclusionReason } from '../lib/detectSubtotals';
import { formatCurrency } from '../lib/formatters';

/** Display-ready view of an excluded line, flattened from either row shape. */
export interface ExcludedRowView {
  account_code: string;
  account_name: string;
  department: string | null;
  month: string;
  amount: number | null;
  reason: ExclusionReason;
}

interface Props {
  excluded: ExcludedRowView[];
  locale: Locale;
  dataCurrency: CurrencyCode;
  included: boolean;
  onToggleInclude: (include: boolean) => void;
}

const REASON_KEY: Record<ExclusionReason, string> = {
  'no-account-code': 'excluded.reason.noCode',
  'total-label': 'excluded.reason.totalLabel',
  'parent-rollup': 'excluded.reason.parentRollup',
};

/**
 * Order the list so the least obvious exclusions are read first. A row with
 * no account code is plainly a heading; a parent account that looks exactly
 * like any other coded account is the one worth checking, so it leads.
 */
const REASON_ORDER: Record<ExclusionReason, number> = {
  'parent-rollup': 0,
  'total-label': 1,
  'no-account-code': 2,
};

/**
 * Roll-up rows are excluded so they cannot double-count, but never
 * silently: this shows every excluded line, why, and offers a switch to
 * put them all back if the detection got it wrong for a given file.
 */
export function ExcludedRowsPanel({ excluded, locale, dataCurrency, included, onToggleInclude }: Props) {
  const t = useT();
  const [open, setOpen] = useState(false);

  if (excluded.length === 0) return null;

  const ordered = [...excluded].sort(
    (a, b) =>
      REASON_ORDER[a.reason] - REASON_ORDER[b.reason] ||
      a.account_code.localeCompare(b.account_code) ||
      a.month.localeCompare(b.month),
  );

  return (
    <section className="unmatched-section">
      <button className="unmatched-toggle" onClick={() => setOpen((o) => !o)}>
        {open ? '▾' : '▸'}{' '}
        {t(included ? 'excluded.toggleIncluded' : 'excluded.toggleExcluded', { n: excluded.length })}
      </button>

      {open && (
        <>
          <label className="excluded-rows__switch">
            <input type="checkbox" checked={included} onChange={(e) => onToggleInclude(e.target.checked)} />
            {t('excluded.treatAsNormal')}
          </label>
          <div className="table-scroll">
            <table className="variance-table">
              <thead>
                <tr>
                  <th>{t('col.account')}</th>
                  <th>{t('col.department')}</th>
                  <th>{t('col.month')}</th>
                  <th className="num">{t('col.amount')}</th>
                  <th>{t('excluded.why')}</th>
                </tr>
              </thead>
              <tbody>
                {ordered.map((item, i) => (
                  <tr key={`${item.account_code}-${item.month}-${i}`}>
                    <td>
                      <div className="account-cell">
                        <span className="account-cell__code">{item.account_code || '—'}</span>
                        {item.account_name && (
                          <span className="account-cell__name">{item.account_name}</span>
                        )}
                      </div>
                    </td>
                    <td>{item.department ?? '—'}</td>
                    <td>{item.month}</td>
                    <td className="num">{formatCurrency(item.amount, locale, dataCurrency)}</td>
                    <td className="excluded-rows__reason">{t(REASON_KEY[item.reason])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
