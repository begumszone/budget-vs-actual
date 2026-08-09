export type Locale = 'en' | 'tr';

export const CURRENCIES = ['TRY', 'USD', 'EUR', 'GBP'] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

/**
 * Which analysis this is: comparing budget to actual, or comparing one
 * year's actuals to another's. Both are instances of the same underlying
 * "base period vs comparison period" model.
 */
export type AnalysisMode = 'budget-vs-actual' | 'yoy';

export type UploadMode = 'two-files' | 'single-file';

/** A row as parsed straight out of a CSV/XLSX file, before any mapping. */
export type RawRow = Record<string, string | number | null>;

/** One worksheet, still as a raw grid so the header row can be re-chosen. */
export interface ParsedSheet {
  name: string;
  grid: (string | number | null)[][];
  /** Best guess at which grid row holds the column names. */
  suggestedHeaderRow: number;
}

export interface ParsedWorkbook {
  fileName: string;
  sheets: ParsedSheet[];
}

/** A single sheet resolved into headers + rows, ready for column mapping. */
export interface ParsedFile {
  fileName: string;
  sheetName: string;
  headers: string[];
  rows: RawRow[];
}

/**
 * How the periods are laid out in the uploaded sheet.
 * `long`: one row per account per month, with a month column.
 * `wide`: one row per account, with a column per month -- the layout most
 * company budget files actually use.
 */
export type PeriodLayout = 'long' | 'wide';

/** Which sheet, header row and layout the user settled on for one file. */
export interface SheetSelection {
  sheetIndex: number;
  headerRowIndex: number;
  layout: PeriodLayout;
  /** Headers treated as period columns when layout is 'wide'. */
  monthColumns: string[];
}

/** Fields common to any uploaded file, regardless of upload mode. */
export const COMMON_FIELDS = [
  'account_code',
  'account_name',
  'department',
  'month',
] as const;

export type CommonField = (typeof COMMON_FIELDS)[number];

/**
 * Column mapping for a single file that carries one amount column (used
 * per-file in budget-vs-actual two-files mode, and for the single actuals
 * file in year-over-year mode).
 */
export type SingleAmountMapping = Record<CommonField, string | null> & {
  amount: string | null;
};

/**
 * Column mapping for one combined file that carries both a budget and an
 * actual amount column (budget-vs-actual single-file mode only).
 */
export type DualAmountMapping = Record<CommonField, string | null> & {
  budget_amount: string | null;
  actual_amount: string | null;
};

export interface MappedRow {
  account_code: string;
  account_name: string;
  department: string | null;
  month: string;
  amount: number | null;
}

/**
 * Which two calendar years are being compared in year-over-year mode.
 * `baseYear` plays the role budget plays in budget-vs-actual; `comparisonYear`
 * plays the role actual plays.
 */
export interface YearSelection {
  baseYear: number | null;
  comparisonYear: number | null;
}

export type MatchStatus = 'matched' | 'base-only' | 'comparison-only';

export interface VarianceRow {
  key: string;
  account_code: string;
  account_name: string;
  department: string | null;
  /**
   * Budget-vs-actual: full "YYYY-MM". Year-over-year: month-of-year only
   * ("01".."12"), since matching is done across years on the same month.
   */
  month: string;
  base_amount: number | null;
  comparison_amount: number | null;
  variance_amount: number | null;
  variance_percent: number | null;
  status: MatchStatus;
  isSignificant: boolean;
  direction: 'increase' | 'decrease' | null;
}

export interface ThresholdSettings {
  /** Percent, e.g. 10 means +/-10% */
  percent: number;
  /**
   * Whether "comparison > base" (an increase) should be treated as bad.
   * true for typical expense accounts, false for revenue-like accounts
   * where a decrease is the undesirable direction.
   */
  increaseIsBad: boolean;
}

export type AppStage = 'upload' | 'mapping' | 'results';

/**
 * A rate pair for one specific calendar month ("YYYY-MM"). Rates are
 * expressed as target-currency-per-1-unit-of-data-currency, e.g. if the
 * data currency is USD and target is TRY, a rate of 34 means 1 USD = 34 TRY.
 * `baseRate` converts that month's base-side amount, `comparisonRate` its
 * comparison-side amount -- in budget-vs-actual both apply to the same
 * calendar month (budget rate vs actual rate for that month); in
 * year-over-year, a given "YYYY-MM" key belongs entirely to either the base
 * year or the comparison year, so only the relevant field is ever set.
 */
export interface MonthlyRate {
  baseRate: number | null;
  comparisonRate: number | null;
}

/**
 * Settings for the optional "report in a different currency" conversion.
 * Rates are entered per calendar month rather than once for the whole
 * analysis, since a realized rate genuinely varies month to month. `rates`
 * is keyed by canonical "YYYY-MM" -- see lib/monthlyRates.ts for how a
 * VarianceRow's `month` field maps to that key in each analysis mode.
 */
export interface FxReportingSettings {
  enabled: boolean;
  targetCurrency: CurrencyCode;
  rates: Record<string, MonthlyRate>;
}

export interface FxDecomposition {
  totalVarianceTarget: number;
  operationalVarianceTarget: number;
  fxVarianceTarget: number;
}
