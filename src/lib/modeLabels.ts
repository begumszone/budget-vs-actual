import type { AnalysisMode, YearSelection } from '../types';

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

export function getModeLabels(mode: AnalysisMode, years?: YearSelection): ModeLabels {
  if (mode === 'yoy') {
    const base = years?.baseYear != null ? String(years.baseYear) : 'Base year';
    const comparison = years?.comparisonYear != null ? String(years.comparisonYear) : 'Comparison year';
    return {
      title: `Year over Year (${base} vs ${comparison})`,
      base,
      comparison,
      increaseBadOption: `Higher than ${base} is bad`,
      decreaseBadOption: `Lower than ${base} is bad`,
      baseRateLabel: `${base} rate`,
      comparisonRateLabel: `${comparison} rate`,
      baseOnlyLabel: `${base} only`,
      comparisonOnlyLabel: `${comparison} only`,
      actualsFileLabel: 'Actuals file (all years)',
      amountFieldLabel: 'Amount',
    };
  }
  return {
    title: 'Budget vs Actual',
    base: 'Budget',
    comparison: 'Actual',
    increaseBadOption: 'Over budget is bad (expenses)',
    decreaseBadOption: 'Under budget is bad (revenue)',
    baseRateLabel: 'Budget rate (plan)',
    comparisonRateLabel: 'Actual rate (realized)',
    baseOnlyLabel: 'Budget only',
    comparisonOnlyLabel: 'Actual only',
    actualsFileLabel: 'Budget file',
    amountFieldLabel: 'Budget amount',
  };
}
