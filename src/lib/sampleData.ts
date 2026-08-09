import budgetCsv from '../../sample-data/budget.csv?raw';
import actualCsv from '../../sample-data/actual.csv?raw';
import actualsTwoYearCsv from '../../sample-data/actuals-2yr.csv?raw';
import type { AnalysisMode } from '../types';

/**
 * The bundled sample CSVs, exposed as in-memory File objects so the
 * "try with sample data" button can go through exactly the same parsing
 * and mapping path as a real upload -- no separate code path that could
 * drift from what users actually experience.
 */
function toCsvFile(contents: string, fileName: string): File {
  return new File([contents], fileName, { type: 'text/csv' });
}

export interface BudgetVsActualSample {
  budget: File;
  actual: File;
}

export function getBudgetVsActualSample(): BudgetVsActualSample {
  return {
    budget: toCsvFile(budgetCsv, 'budget.csv'),
    actual: toCsvFile(actualCsv, 'actual.csv'),
  };
}

export function getYoySample(): File {
  return toCsvFile(actualsTwoYearCsv, 'actuals-2yr.csv');
}

/** One-line description of what the sample contains, for the button's helper text. */
export function describeSample(mode: AnalysisMode): string {
  return mode === 'yoy'
    ? '2025 vs 2026 actuals across 2 departments, including a new and a discontinued account'
    : '3 months of budget vs actual across 2 departments, including 2 intentionally unmatched rows';
}
