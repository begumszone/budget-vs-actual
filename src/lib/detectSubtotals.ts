/** Minimal shape needed to judge a row -- works for both single- and dual-amount rows. */
export interface AccountLike {
  account_code: string;
  account_name: string;
}

/**
 * Tokens that appear in roll-up labels. Used for an *exact phrase* test --
 * a label counts as a total only when every one of its words is one of
 * these, so "Total Rewards Program" and "Toplam Kalite Yönetimi" stay the
 * real accounts they are.
 */
const TOTAL_TOKENS = new Set([
  'total', 'totals', 'subtotal', 'sub', 'grand', 'sum', 'summary',
  'toplam', 'toplami', 'toplamı', 'ara', 'aratoplam', 'genel',
  'yekun', 'yekûn', 'net', 'brut', 'brüt', 'gross',
]);

/** Looser test, used only for files that carry no account codes at all. */
const TOTAL_WORD_RE =
  /(^|[\s\-–—:/(])(total|totals|subtotal|sub-total|grand total|toplam|toplamı|ara toplam|genel toplam|yekun|yekûn)([\s\-–—:/)]|$)/i;

export type ExclusionReason = 'no-account-code' | 'total-label';

export interface ExcludedRow<T = AccountLike> {
  row: T;
  reason: ExclusionReason;
  /** The text that triggered the match, so the user can see exactly why. */
  evidence: string;
}

export interface SubtotalPartition<T> {
  kept: T[];
  excluded: ExcludedRow<T>[];
}

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/** True only when the whole label is made of roll-up words ("ARA TOPLAM", "Grand Total"). */
function isExactTotalPhrase(text: string): boolean {
  const t = tokens(text);
  return t.length > 0 && t.every((w) => TOTAL_TOKENS.has(w));
}

/**
 * Separates roll-up lines from real account lines.
 *
 * A budget export interleaves section subtotals with the accounts, and
 * treating those as accounts double-counts every figure -- the worst thing
 * a variance tool can do quietly. The decisive signal is a missing account
 * code: in a file where the accounts are coded, an uncoded line is a
 * heading or a total. Label matching is only trusted where there are no
 * codes to go on, plus an exact-phrase check that catches a coded "TOPLAM"
 * row without touching an account that merely contains the word.
 *
 * Nothing is dropped silently: excluded rows are returned so the interface
 * can show them and let the user put any of them back.
 */
export function partitionSubtotals<T extends AccountLike>(rows: T[]): SubtotalPartition<T> {
  const kept: T[] = [];
  const excluded: ExcludedRow<T>[] = [];

  const anyCodes = rows.some((r) => (r.account_code ?? '').trim() !== '');

  for (const row of rows) {
    const name = (row.account_name ?? '').trim();
    const code = (row.account_code ?? '').trim();

    if (anyCodes) {
      if (code === '') {
        excluded.push({ row, reason: 'no-account-code', evidence: name || '(unnamed line)' });
        continue;
      }
      // Coded rows are accounts -- unless the label is nothing but a total word.
      if (isExactTotalPhrase(name) || isExactTotalPhrase(code)) {
        excluded.push({ row, reason: 'total-label', evidence: name || code });
        continue;
      }
    } else if (TOTAL_WORD_RE.test(name) || isExactTotalPhrase(name)) {
      excluded.push({ row, reason: 'total-label', evidence: name });
      continue;
    }

    kept.push(row);
  }

  return { kept, excluded };
}
