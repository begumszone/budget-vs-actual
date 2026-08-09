import { useMemo } from 'react';
import type { CurrencyCode, Locale, ThresholdSettings } from '../types';
import type { EnrichedVarianceRow } from '../lib/enrichRowsWithFx';
import { formatCurrency, formatPercent } from '../lib/formatters';
import type { ModeLabels } from '../lib/modeLabels';

interface Props {
  rows: EnrichedVarianceRow[];
  locale: Locale;
  displayCurrency: CurrencyCode;
  labels: ModeLabels;
  threshold: ThresholdSettings;
}

/**
 * The at-a-glance numbers a finance reader looks for before touching any
 * table: what was planned, what happened, the gap, and how many lines
 * actually need attention. Reads the same converted `display*` fields the
 * tables do, so it can never disagree with them.
 */
export function HeadlineStats({ rows, locale, displayCurrency, labels, threshold }: Props) {
  const stats = useMemo(() => {
    let base = 0;
    let comparison = 0;
    let significant = 0;
    for (const row of rows) {
      base += row.displayBase ?? 0;
      comparison += row.displayComparison ?? 0;
      if (row.displayIsSignificant) significant += 1;
    }
    const variance = comparison - base;
    const variancePercent = base === 0 ? null : (variance / Math.abs(base)) * 100;
    return { base, comparison, variance, variancePercent, significant };
  }, [rows]);

  if (rows.length === 0) return null;

  // Colour by whether the movement is *bad*, per the user's chosen bad
  // direction -- not by its arithmetic sign. On a revenue line, coming in
  // under plan is the red case, not the green one.
  const varianceTone =
    stats.variance === 0
      ? 'neutral'
      : (stats.variance > 0) === threshold.increaseIsBad
        ? 'bad'
        : 'good';

  return (
    <section className="headline-stats">
      <div className="headline-stats__tile">
        <span className="headline-stats__label">Total {labels.base}</span>
        <span className="headline-stats__value">{formatCurrency(stats.base, locale, displayCurrency)}</span>
      </div>
      <div className="headline-stats__tile">
        <span className="headline-stats__label">Total {labels.comparison}</span>
        <span className="headline-stats__value">{formatCurrency(stats.comparison, locale, displayCurrency)}</span>
      </div>
      <div className={`headline-stats__tile headline-stats__tile--${varianceTone}`}>
        <span className="headline-stats__label">Variance</span>
        <span className="headline-stats__value">{formatCurrency(stats.variance, locale, displayCurrency)}</span>
        <span className="headline-stats__meta">{formatPercent(stats.variancePercent, locale)}</span>
      </div>
      <div className="headline-stats__tile">
        <span className="headline-stats__label">Flagged lines</span>
        <span className="headline-stats__value">{stats.significant}</span>
        <span className="headline-stats__meta">of {rows.length} rows</span>
      </div>
    </section>
  );
}
