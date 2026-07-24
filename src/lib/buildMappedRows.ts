import type { DualAmountMapping, MappedRow, ParsedFile, SingleAmountMapping } from '../types';
import { normalizeMonth } from './normalizeMonth';
import { parseLocaleNumber } from './parseNumber';

function toNumberOrNull(value: string | number | null | undefined): number | null {
  return parseLocaleNumber(value);
}

function toStringOrEmpty(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

export interface MappingIssues {
  rowsSkippedMissingKey: number;
}

/** Builds normalized rows from a single-amount file (budget or actual, in two-files mode). */
export function buildSingleAmountRows(
  file: ParsedFile,
  mapping: SingleAmountMapping,
): { rows: MappedRow[]; issues: MappingIssues } {
  let rowsSkippedMissingKey = 0;
  const rows: MappedRow[] = [];
  for (const raw of file.rows) {
    const account_code = toStringOrEmpty(mapping.account_code ? raw[mapping.account_code] : null);
    const month = normalizeMonth(mapping.month ? raw[mapping.month] : null);
    if (!account_code || !month) {
      rowsSkippedMissingKey += 1;
      continue;
    }
    rows.push({
      account_code,
      account_name: toStringOrEmpty(mapping.account_name ? raw[mapping.account_name] : null),
      department: mapping.department ? toStringOrEmpty(raw[mapping.department]) || null : null,
      month,
      amount: toNumberOrNull(mapping.amount ? raw[mapping.amount] : null),
    });
  }
  return { rows, issues: { rowsSkippedMissingKey } };
}

export interface DualAmountRow {
  account_code: string;
  account_name: string;
  department: string | null;
  month: string;
  budget_amount: number | null;
  actual_amount: number | null;
}

/** Builds normalized rows from one combined file that has both amount columns. */
export function buildDualAmountRows(
  file: ParsedFile,
  mapping: DualAmountMapping,
): { rows: DualAmountRow[]; issues: MappingIssues } {
  let rowsSkippedMissingKey = 0;
  const rows: DualAmountRow[] = [];
  for (const raw of file.rows) {
    const account_code = toStringOrEmpty(mapping.account_code ? raw[mapping.account_code] : null);
    const month = normalizeMonth(mapping.month ? raw[mapping.month] : null);
    if (!account_code || !month) {
      rowsSkippedMissingKey += 1;
      continue;
    }
    rows.push({
      account_code,
      account_name: toStringOrEmpty(mapping.account_name ? raw[mapping.account_name] : null),
      department: mapping.department ? toStringOrEmpty(raw[mapping.department]) || null : null,
      month,
      budget_amount: toNumberOrNull(mapping.budget_amount ? raw[mapping.budget_amount] : null),
      actual_amount: toNumberOrNull(mapping.actual_amount ? raw[mapping.actual_amount] : null),
    });
  }
  return { rows, issues: { rowsSkippedMissingKey } };
}
