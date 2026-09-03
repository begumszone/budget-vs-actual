import type { AnalysisMode, Locale, YearSelection } from '../types';
import { translate } from './i18n';

export interface ModeLabels {
  title: string;
  /** What the base side is called: "Budget" or the base year, e.g. "2025". */
  base: string;
  /** What the comparison side is called: "Actual" or the comparison year, e.g. "2026". */
  comparison: string;
  increaseBadOption: string;
  decreaseBadOption: string;
  baseRateLabel: string;
  comparisonRateLabel: string;
  baseOnlyLabel: string;
  comparisonOnlyLabel: string;
  actualsFileLabel: string;
  amountFieldLabel: string;
}

export function getModeLabels(mode: AnalysisMode, locale: Locale, years?: YearSelection): ModeLabels {
  const t = (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars);

  if (mode === 'yoy') {
    const base = years?.baseYear != null ? String(years.baseYear) : t('labels.yoy.baseYear');
    const comparison =
      years?.comparisonYear != null ? String(years.comparisonYear) : t('labels.yoy.comparisonYear');
    return {
      title: t('labels.yoy.title', { base, comparison }),
      base,
      comparison,
      increaseBadOption: t('labels.yoy.increaseBad', { base }),
      decreaseBadOption: t('labels.yoy.decreaseBad', { base }),
      baseRateLabel: t('labels.yoy.baseRate', { base }),
      comparisonRateLabel: t('labels.yoy.comparisonRate', { comparison }),
      baseOnlyLabel: t('labels.yoy.baseOnly', { base }),
      comparisonOnlyLabel: t('labels.yoy.comparisonOnly', { comparison }),
      actualsFileLabel: t('labels.yoy.actualsFile'),
      amountFieldLabel: t('labels.yoy.amountField'),
    };
  }
  return {
    title: t('labels.bva.title'),
    base: t('labels.bva.base'),
    comparison: t('labels.bva.comparison'),
    increaseBadOption: t('labels.bva.increaseBad'),
    decreaseBadOption: t('labels.bva.decreaseBad'),
    baseRateLabel: t('labels.bva.baseRate'),
    comparisonRateLabel: t('labels.bva.comparisonRate'),
    baseOnlyLabel: t('labels.bva.baseOnly'),
    comparisonOnlyLabel: t('labels.bva.comparisonOnly'),
    actualsFileLabel: t('labels.bva.actualsFile'),
    amountFieldLabel: t('labels.bva.amountField'),
  };
}
