import { useMemo } from 'react';
import type { CurrencyCode, Locale, ThresholdSettings } from '../types';
import type { EnrichedVarianceRow } from '../lib/enrichRowsWithFx';
import { formatCurrency, formatPercent } from '../lib/formatters';
import { useT } from '../lib/i18n';
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
  const t = useT();
  const stats = useMemo(() => {
    let base = 0;
    let comparison = 0;
    let significant = 0;
    let converted = 0;
    let blockedByMissingRate = 0;
    for (const row of rows) {
      const rowBlocked = row.baseRateMissing || row.comparisonRateMissing;
      if (rowBlocked) {
        blockedByMissingRate += 1;
      } else {
        converted += 1;
      }
      base += row.displayBase ?? 0;
      comparison += row.displayComparison ?? 0;
      if (row.displayIsSignificant) significant += 1;
    }
    const variance = comparison - base;
    const variancePercent = base === 0 ? null : (variance / Math.abs(base)) * 100;
    return { base, comparison, variance, variancePercent, significant, converted, blockedByMissingRate };
  }, [rows]);

  if (rows.length === 0) return null;

  // With FX reporting on but no rates entered yet, every amount is
  // unconvertible. Summing those nulls to 0 would print a confident
  // "0" and read as "your data vanished" -- say what is actually true
  // instead, the same way the tables print "No rate".
  if (stats.converted === 0) {
    return (
      <section className="headline-stats headline-stats--empty">
        <p className="headline-stats__empty-note">
          {t('stats.awaitingRates', { n: rows.length })}
        </p>
      </section>
    );
  }

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
        <span className="headline-stats__label">{t('stats.total', { name: labels.base })}</span>
        <span className="headline-stats__value">{formatCurrency(stats.base, locale, displayCurrency)}</span>
      </div>
      <div className="headline-stats__tile">
        <span className="headline-stats__label">{t('stats.total', { name: labels.comparison })}</span>
        <span className="headline-stats__value">{formatCurrency(stats.comparison, locale, displayCurrency)}</span>
      </div>
      <div className={`headline-stats__tile headline-stats__tile--${varianceTone}`}>
        <span className="headline-stats__label">{t('stats.variance')}</span>
        <span className="headline-stats__value">{formatCurrency(stats.variance, locale, displayCurrency)}</span>
        <span className="headline-stats__meta">{formatPercent(stats.variancePercent, locale)}</span>
      </div>
      <div className="headline-stats__tile">
        <span className="headline-stats__label">{t('stats.flagged')}</span>
        <span className="headline-stats__value">{stats.significant}</span>
        <span className="headline-stats__meta">
          {stats.blockedByMissingRate > 0
            ? t('stats.ofConverted', { n: stats.converted })
            : t('stats.ofRows', { n: rows.length })}
        </span>
      </div>
      {stats.blockedByMissingRate > 0 && (
        <p className="headline-stats__note">
          {'\u26A0 '}
          {t('stats.someExcluded', { blocked: stats.blockedByMissingRate, total: rows.length })}
        </p>
      )}
    </section>
  );
}
