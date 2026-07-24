export type Locale = 'en' | 'tr';

export type UploadMode = 'two-files' | 'single-file';

/** A row as parsed straight out of a CSV/XLSX file, before any mapping. */
export type RawRow = Record<string, string | number | null>;

export interface ParsedFile {
  fileName: string;
  headers: string[];
  rows: RawRow[];
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
 * Column mapping for a single file that carries one amount column
 * (used per-file in two-files mode: the budget file and the actual file
 * are each mapped independently).
 */
export type SingleAmountMapping = Record<CommonField, string | null> & {
  amount: string | null;
};

/**
 * Column mapping for one combined file that carries both a budget and an
 * actual amount column (used in single-file mode).
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

export type MatchStatus = 'matched' | 'budget-only' | 'actual-only';

export interface VarianceRow {
  key: string;
  account_code: string;
  account_name: string;
  department: string | null;
  month: string;
  budget_amount: number | null;
  actual_amount: number | null;
  variance_amount: number | null;
  variance_percent: number | null;
  status: MatchStatus;
  isSignificant: boolean;
  direction: 'over' | 'under' | null;
}

export interface ThresholdSettings {
  /** Percent, e.g. 10 means +/-10% */
  percent: number;
  /**
   * Whether "actual > budget" (over budget) should be treated as bad.
   * true for typical expense accounts, false for revenue-like accounts
   * where being under budget is the undesirable direction.
   */
  overIsBad: boolean;
}

export type AppStage = 'upload' | 'mapping' | 'results';
