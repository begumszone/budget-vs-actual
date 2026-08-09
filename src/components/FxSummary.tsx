import { useMemo } from 'react';
import type { CurrencyCode, Locale } from '../types';
import type { EnrichedVarianceRow } from '../lib/enrichRowsWithFx';
import { formatCurrency } from '../lib/formatters';

interface Props {
  rows: EnrichedVarianceRow[];
  targetCurrency: CurrencyCode;
  locale: Locale;
}

export function FxSummary({ rows, targetCurrency, locale }: Props) {
  const totals = useMemo(() => {
    let total = 0;
    let operational = 0;
    let fx = 0;
    let count = 0;
    for (const row of rows) {
      if (!row.fx) continue;
      total += row.fx.totalVarianceTarget;
      operational += row.fx.operationalVarianceTarget;
      fx += row.fx.fxVarianceTarget;
      count += 1;
    }
    return { total, operational, fx, count };
  }, [rows]);

  if (totals.count === 0) return null;

  return (
    <section className="fx-summary">
      <h2>Currency variance split ({targetCurrency})</h2>
      <div className="fx-summary__tiles">
        <div className="fx-summary__tile">
          <span className="fx-summary__label">Total variance</span>
          <span className="fx-summary__value">{formatCurrency(totals.total, locale, targetCurrency)}</span>
        </div>
        <div className="fx-summary__tile">
          <span className="fx-summary__label">Operational variance</span>
          <span className="fx-summary__value">{formatCurrency(totals.operational, locale, targetCurrency)}</span>
        </div>
        <div className="fx-summary__tile">
          <span className="fx-summary__label">FX variance</span>
          <span className="fx-summary__value">{formatCurrency(totals.fx, locale, targetCurrency)}</span>
        </div>
      </div>
      <p className="fx-summary__hint">
        Operational + FX reconciles exactly to total variance, row by row. Covers the {totals.count} matched rows
        only — a line present on just one side has nothing to decompose.
      </p>
    </section>
  );
}
