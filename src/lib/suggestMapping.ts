import type { CommonField } from '../types';

/**
 * Header names seen in real exports, including both English spellings and
 * the Turkish equivalents finance teams here actually use.
 */
const SYNONYMS: Record<CommonField | 'amount' | 'budget_amount' | 'actual_amount', string[]> = {
  account_code: [
    'account_code', 'account code', 'gl code', 'gl account', 'g/l account', 'account #', 'account no',
    'account number', 'code', 'acct code', 'acct_code', 'ledger code', 'nominal code',
    'hesap kodu', 'hesap no', 'muhasebe kodu', 'kod',
  ],
  account_name: [
    'account_name', 'account name', 'account', 'description', 'gl description', 'acct name',
    'account description', 'line item', 'nominal name',
    'hesap adi', 'hesap adı', 'hesap ismi', 'aciklama', 'açıklama',
  ],
  department: [
    'department', 'dept', 'cost center', 'cost centre', 'cost_center', 'costcentre',
    'division', 'team', 'business unit', 'segment', 'profit center', 'profit centre',
    'departman', 'bolum', 'bölüm', 'masraf merkezi', 'birim',
  ],
  month: [
    'month', 'period', 'date', 'fiscal period', 'fiscal_period', 'posting date', 'accounting period',
    'ay', 'donem', 'dönem', 'tarih',
  ],
  amount: ['amount', 'value', 'total', 'tutar', 'deger', 'değer'],
  budget_amount: [
    'budget_amount', 'budget amount', 'budget', 'budgeted', 'planned amount', 'plan', 'forecast',
    'butce', 'bütçe', 'butce tutari', 'bütçe tutarı', 'planlanan',
  ],
  actual_amount: [
    'actual_amount', 'actual amount', 'actual', 'actuals', 'actual total',
    'gerceklesen', 'gerçekleşen', 'fiili', 'gerceklesen tutar', 'gerçekleşen tutar',
  ],
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
