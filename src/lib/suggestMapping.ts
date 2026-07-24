import type { CommonField } from '../types';

const SYNONYMS: Record<CommonField | 'amount' | 'budget_amount' | 'actual_amount', string[]> = {
  account_code: ['account_code', 'account code', 'gl code', 'gl account', 'account #', 'account no', 'code', 'acct code', 'acct_code'],
  account_name: ['account_name', 'account name', 'account', 'description', 'gl description', 'acct name'],
  department: ['department', 'dept', 'cost center', 'cost_center', 'division', 'team'],
  month: ['month', 'period', 'date', 'fiscal period', 'fiscal_period'],
  amount: ['amount', 'value', 'total'],
  budget_amount: ['budget_amount', 'budget amount', 'budget', 'budgeted', 'planned amount', 'plan'],
  actual_amount: ['actual_amount', 'actual amount', 'actual', 'actuals', 'actual total'],
};

function normalize(s: string): string {
  return s.toLowerCase().replace(/[_\-.]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Picks the best-matching header for a canonical field, or null if nothing looks close. */
export function suggestColumn(
  field: keyof typeof SYNONYMS,
  headers: string[],
): string | null {
  const candidates = SYNONYMS[field];
  const normalizedHeaders = headers.map((h) => ({ original: h, normalized: normalize(h) }));

  for (const candidate of candidates) {
    const exact = normalizedHeaders.find((h) => h.normalized === candidate);
    if (exact) return exact.original;
  }
  for (const candidate of candidates) {
    const partial = normalizedHeaders.find(
      (h) => h.normalized.includes(candidate) || candidate.includes(h.normalized),
    );
    if (partial) return partial.original;
  }
  return null;
}
