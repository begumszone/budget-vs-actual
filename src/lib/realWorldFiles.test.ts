import { describe, expect, test } from 'vitest';
import { detectHeaderRowIndex } from './detectHeaderRow';
import { detectMonthColumns, looksWide, unpivot } from './unpivot';
import { partitionSubtotals } from './detectSubtotals';
import { suggestColumn } from './suggestMapping';
import type { MappedRow, ParsedFile } from '../types';

describe('detectHeaderRowIndex', () => {
  test('skips a report title and blank rows above the real header', () => {
    const grid = [
      ['ACME Manufacturing A.Ş.', null, null, null],
      ['2026 Budget vs Actual — Management Report', null, null, null],
      [null, null, null, null],
      ['GL Code', 'Account Name', 'Department', 'Jan-26'],
      ['5000', 'Marketing', 'Sales', 40000],
      ['5100', 'Salaries', 'Sales', 120000],
    ];
    expect(detectHeaderRowIndex(grid)).toBe(3);
  });

  test('returns 0 when the header really is the first row', () => {
    const grid = [
      ['GL Code', 'Account Name', 'Period', 'Amount'],
      ['5000', 'Marketing', '2026-01', 40000],
      ['5000', 'Marketing', '2026-02', 41000],
    ];
    expect(detectHeaderRowIndex(grid)).toBe(0);
  });

  test('does not mistake a numeric data row for the header', () => {
    const grid = [
      ['Cost Centre Report', null, null],
      ['Account', 'Jan', 'Feb'],
      [5000, 1000, 2000],
      [5100, 3000, 4000],
    ];
    expect(detectHeaderRowIndex(grid)).toBe(1);
  });
});

describe('wide-format detection and unpivot', () => {
  const wide: ParsedFile = {
    fileName: 'budget.xlsx',
    sheetName: 'Budget',
    headers: ['GL Code', 'Account Name', 'Department', 'Jan-26', 'Feb-26', 'Mar-26'],
    rows: [
      { 'GL Code': '5000', 'Account Name': 'Marketing', Department: 'Sales', 'Jan-26': 40000, 'Feb-26': 41000, 'Mar-26': 45000 },
      { 'GL Code': '5100', 'Account Name': 'Salaries', Department: 'Sales', 'Jan-26': 120000, 'Feb-26': 120000, 'Mar-26': null },
    ],
  };

  test('recognises month headers and flags the sheet as wide', () => {
    expect(detectMonthColumns(wide.headers)).toEqual(['Jan-26', 'Feb-26', 'Mar-26']);
    expect(looksWide(wide.headers)).toBe(true);
  });

  test('a genuine long sheet is not treated as wide', () => {
    const longHeaders = ['GL Code', 'Account Name', 'Department', 'Period', 'Amount'];
    expect(looksWide(longHeaders)).toBe(false);
  });

  test('unpivots to one row per account per month, preserving id columns', () => {
    const { file, periodColumn, amountColumn } = unpivot(wide, ['Jan-26', 'Feb-26', 'Mar-26']);
    // 3 months for Marketing + 2 for Salaries (March is blank, not zero)
    expect(file.rows).toHaveLength(5);
    expect(file.headers).toEqual(['GL Code', 'Account Name', 'Department', periodColumn, amountColumn]);

    const first = file.rows[0];
    expect(first['GL Code']).toBe('5000');
    expect(first.Department).toBe('Sales');
    expect(first[periodColumn]).toBe('Jan-26');
    expect(first[amountColumn]).toBe(40000);
  });

  test('a blank month is omitted rather than written as zero', () => {
    const { file, periodColumn, amountColumn } = unpivot(wide, ['Jan-26', 'Feb-26', 'Mar-26']);
    const salariesMarch = file.rows.find(
      (r) => r['GL Code'] === '5100' && r[periodColumn] === 'Mar-26',
    );
    expect(salariesMarch).toBeUndefined();
    const zeroed = file.rows.filter((r) => r[amountColumn] === 0);
    expect(zeroed).toHaveLength(0);
  });

  test('reads amounts written with thousand separators', () => {
    const formatted: ParsedFile = {
      ...wide,
      rows: [{ 'GL Code': '5000', 'Account Name': 'Marketing', Department: 'Sales', 'Jan-26': '1.234.567,89', 'Feb-26': null, 'Mar-26': null }],
    };
    const { file, amountColumn } = unpivot(formatted, ['Jan-26', 'Feb-26', 'Mar-26']);
    expect(file.rows[0][amountColumn]).toBeCloseTo(1234567.89, 2);
  });
});

describe('subtotal detection', () => {
  const row = (code: string, name: string): MappedRow => ({
    account_code: code,
    account_name: name,
    department: 'Ops',
    month: '2026-01',
    amount: 100,
  });

  test('pulls out uncoded roll-up lines from a coded file', () => {
    const { kept, excluded } = partitionSubtotals([
      row('5000', 'Marketing'),
      row('', 'TOTAL OPERATING EXPENSES'),
      row('5100', 'Salaries'),
      row('', 'ARA TOPLAM'),
      row('', 'Genel Toplam'),
    ]);
    expect(kept.map((r) => r.account_code)).toEqual(['5000', '5100']);
    expect(excluded).toHaveLength(3);
    expect(excluded.every((e) => e.reason === 'no-account-code')).toBe(true);
  });

  test('keeps a real coded account whose name merely contains a total word', () => {
    const { kept, excluded } = partitionSubtotals([
      row('6000', 'Total Rewards Program'),
      row('6100', 'Toplam Kalite Yönetimi'),
      row('6200', 'Net Revenue Adjustments'),
    ]);
    expect(excluded).toHaveLength(0);
    expect(kept.map((r) => r.account_name)).toEqual([
      'Total Rewards Program',
      'Toplam Kalite Yönetimi',
      'Net Revenue Adjustments',
    ]);
  });

  test('still catches a coded row whose label is nothing but a total phrase', () => {
    const { kept, excluded } = partitionSubtotals([
      row('5000', 'Marketing'),
      row('5999', 'ARA TOPLAM'),
      row('6999', 'Grand Total'),
    ]);
    expect(kept.map((r) => r.account_code)).toEqual(['5000']);
    expect(excluded.map((e) => e.reason)).toEqual(['total-label', 'total-label']);
  });

  test('a coded account is never removed for lacking a code', () => {
    const { kept } = partitionSubtotals([row('5000', 'Marketing'), row('5100', 'Salaries')]);
    expect(kept).toHaveLength(2);
  });

  test('when no row has a code, labels become the only signal', () => {
    const { kept, excluded } = partitionSubtotals([
      row('', 'Marketing'),
      row('', 'Salaries'),
      row('', 'TOTAL OPERATING EXPENSES'),
    ]);
    expect(kept.map((r) => r.account_name)).toEqual(['Marketing', 'Salaries']);
    expect(excluded).toHaveLength(1);
  });
});

describe('header synonym matching for real exports', () => {
  test('recognises British and Turkish header spellings', () => {
    expect(suggestColumn('department', ['GL Code', 'Account Name', 'Cost Centre'])).toBe('Cost Centre');
    expect(suggestColumn('department', ['Hesap Kodu', 'Masraf Merkezi'])).toBe('Masraf Merkezi');
    expect(suggestColumn('account_code', ['Hesap Kodu', 'Hesap Adı', 'Tutar'])).toBe('Hesap Kodu');
    expect(suggestColumn('account_name', ['Hesap Kodu', 'Hesap Adı', 'Tutar'])).toBe('Hesap Adı');
    expect(suggestColumn('amount', ['Hesap Kodu', 'Hesap Adı', 'Tutar'])).toBe('Tutar');
    expect(suggestColumn('budget_amount', ['Hesap Kodu', 'Bütçe Tutarı'])).toBe('Bütçe Tutarı');
    expect(suggestColumn('actual_amount', ['Hesap Kodu', 'Gerçekleşen'])).toBe('Gerçekleşen');
    expect(suggestColumn('month', ['Dönem', 'Tutar'])).toBe('Dönem');
  });
});
